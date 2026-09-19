import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';

const baseParams: CombatParameters = {
  distance: 5,
  targetArmor: 2,
  targetMelee: 2,
  fortification: 'none',
  isSurpriseAttack: false,
  isAimedShot: false,
};

const renderShot = (props: Partial<ComponentProps<typeof ParameterInputs>> = {}) =>
  render(
    <ParameterInputs
      actionType="shot"
      parameters={baseParams}
      onChange={jest.fn()}
      rulesVersion={'tehnolog' as RulesVersionID}
      {...props}
    />
  );

const openDistanceModal = async () => {
  await userEvent.click(screen.getByLabelText('Дистанция input'));
};

const openArmorModal = async () => {
  await userEvent.click(screen.getByLabelText('Броня цели input'));
};

describe('ParameterInputs quick-input modals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens the armor modal with standard values on value tap', async () => {
    renderShot();

    await openArmorModal();

    expect(screen.getByText('БРОНЯ ЦЕЛИ')).toBeInTheDocument();
    // Standard armor range chips 0-8 (+10 for custom builds)
    for (const v of [0, 1, 2, 3, 4, 5, 6, 7, 8, 10]) {
      expect(screen.getByRole('button', { name: String(v) })).toBeInTheDocument();
    }
  });

  it('selecting a standard armor value in the modal writes parameters and memory', async () => {
    const onChange = jest.fn();
    const onMemoryUpdate = jest.fn();
    renderShot({ onChange, onMemoryUpdate });

    await openArmorModal();
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onChange).toHaveBeenCalledWith({ targetArmor: 4 });
    expect(onMemoryUpdate).toHaveBeenCalledWith({ targetArmor: 4 });
    // Modal closes after submit
    expect(screen.queryByText('БРОНЯ ЦЕЛИ')).not.toBeInTheDocument();
  });

  it('armor modal starts from the current value', async () => {
    const onChange = jest.fn();
    renderShot({ onChange });

    await openArmorModal();
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    // Submitting without changes re-writes the current armor
    expect(onChange).toHaveBeenCalledWith({ targetArmor: 2 });
  });

  it('opens the distance modal in steps by default', async () => {
    renderShot();

    await openDistanceModal();

    expect(screen.getByText('ДИСТАНЦИЯ (ШАГИ)')).toBeInTheDocument();
  });

  it('distance modal writes the picked steps', async () => {
    const onChange = jest.fn();
    const onMemoryUpdate = jest.fn();
    renderShot({ onChange, onMemoryUpdate });

    await openDistanceModal();
    await userEvent.click(screen.getByRole('button', { name: '12' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onChange).toHaveBeenCalledWith({ distance: 12 });
    expect(onMemoryUpdate).toHaveBeenCalledWith({ distance: 12 });
  });

  it('distance modal converts cm entries back to steps (cm input unit)', async () => {
    const onChange = jest.fn();
    renderShot({ onChange, distanceInputUnit: 'cm', stepToCmFactor: 5 });

    await openDistanceModal();

    expect(screen.getByText('ДИСТАНЦИЯ (СМ)')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '50' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    // 50 см / 5 = 10 шагов
    expect(onChange).toHaveBeenCalledWith({ distance: 10 });
  });

  it('closing the modal keeps the previous value', async () => {
    const onChange = jest.fn();
    renderShot({ onChange });

    await openArmorModal();
    await userEvent.click(screen.getByRole('button', { name: '7' }));
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));

    // The popup closes asynchronously (150ms exit animation)
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'БРОНЯ ЦЕЛИ' })).not.toBeInTheDocument()
    );

    // Nothing written — only the modal closed
    expect(onChange).not.toHaveBeenCalledWith({ targetArmor: 7 });
  });

  it('steppers still work alongside the modal trigger', async () => {
    const onChange = jest.fn();
    renderShot({ onChange });

    await userEvent.click(screen.getByRole('button', { name: 'Increase Броня цели' }));

    expect(onChange).toHaveBeenCalledWith({ targetArmor: 3 });
  });
});
