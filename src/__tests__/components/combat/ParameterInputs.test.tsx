import type { ComponentProps } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
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

    expect(screen.getByRole('heading', { name: 'ДИСТАНЦИЯ' })).toBeInTheDocument();
    const sw = screen.getByTestId('popup-unit-switch');
    expect(within(sw).getByRole('button', { name: 'ШАГИ' })).toHaveAttribute('aria-pressed', 'true');
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
    renderShot({ onChange, stepToCmFactor: 5 });

    await openDistanceModal();

    // Flip to cm INSIDE the modal
    await userEvent.click(within(screen.getByTestId('popup-unit-switch')).getByRole('button', { name: 'СМ' }));

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

describe('ParameterInputs — шаги/см switch (inside the distance modal)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const getSwitch = () => screen.getByTestId('popup-unit-switch');

  it('flips to cm and persists the choice to the shared storage key', async () => {
    renderShot();
    await openDistanceModal();

    await userEvent.click(within(getSwitch()).getByRole('button', { name: 'СМ' }));

    expect(localStorage.getItem('bronepehota_distance_input_unit')).toBe('cm');
    expect(within(getSwitch()).getByRole('button', { name: 'СМ' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('flipping fires the same-tab sync event (settings/page listeners)', async () => {
    const listener = jest.fn();
    window.addEventListener('bronepehota:distance-unit', listener);
    renderShot();
    await openDistanceModal();

    await userEvent.click(within(getSwitch()).getByRole('button', { name: 'СМ' }));

    expect(listener).toHaveBeenCalled();
    window.removeEventListener('bronepehota:distance-unit', listener);
  });

  it('the quick grid follows the flipped unit', async () => {
    renderShot();
    await openDistanceModal();

    // steps-only value 7 present, cm-only value 50 absent
    expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '50' })).not.toBeInTheDocument();

    await userEvent.click(within(getSwitch()).getByRole('button', { name: 'СМ' }));

    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '7' })).not.toBeInTheDocument();
  });

  it('switching the unit converts the current value in place', async () => {
    renderShot({ stepToCmFactor: 5 });
    await openDistanceModal();

    // 5 steps → flip to cm → 25 см
    expect(screen.getByLabelText('Значение')).toHaveValue(5);
    await userEvent.click(within(getSwitch()).getByRole('button', { name: 'СМ' }));
    expect(screen.getByLabelText('Значение')).toHaveValue(25);
  });

  it('remembers the unit across mounts (storage is the source of truth)', async () => {
    localStorage.setItem('bronepehota_distance_input_unit', 'cm');
    renderShot();
    await openDistanceModal();

    expect(within(getSwitch()).getByRole('button', { name: 'СМ' })).toHaveAttribute('aria-pressed', 'true');
    // cm grid already active
    expect(screen.getByRole('button', { name: '100' })).toBeInTheDocument();
  });

  it('cm-mode display follows a modal submit (external steps change) — review #2', async () => {
    localStorage.setItem('bronepehota_distance_input_unit', 'cm');
    const onChange = jest.fn();
    const view = renderShot({ onChange });

    // 5 steps × 5 = 25 см on the value button
    expect(screen.getByLabelText('Дистанция input')).toHaveTextContent('25');

    // Modal: pick 100 см → confirm → parent updates distance to 20 steps
    await openDistanceModal();
    await userEvent.click(screen.getByRole('button', { name: '100' }));
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));
    expect(onChange).toHaveBeenCalledWith({ distance: 20 });

    // Controlled parent feeds the new steps back — the cm display must follow
    view.rerender(
      <ParameterInputs
        actionType="shot"
        parameters={{ ...baseParams, distance: 20 }}
        onChange={onChange}
        rulesVersion="tehnolog"
      />
    );

    expect(screen.getByLabelText('Дистанция input')).toHaveTextContent('100');
    expect(screen.getByText('(20шаг)')).toBeInTheDocument();
  });
});
