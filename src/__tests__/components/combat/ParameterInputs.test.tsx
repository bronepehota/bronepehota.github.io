import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatParameters } from '@/lib/combat-types';
import { RulesVersionID } from '@/lib/types';
import { HISTORY_KEY } from '@/lib/dice-history';

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

describe('ParameterInputs quick-pick chips', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders armor quick-pick chips 0-8 for shots', () => {
    renderShot();

    const chips = screen.getByTestId('armor-quick-chips');
    for (const v of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(within(chips).getByText(String(v))).toBeInTheDocument();
    }
  });

  it('selecting an armor chip writes parameters and target memory', async () => {
    const onChange = jest.fn();
    const onMemoryUpdate = jest.fn();
    renderShot({ onChange, onMemoryUpdate });

    await userEvent.click(within(screen.getByTestId('armor-quick-chips')).getByText('4'));

    expect(onChange).toHaveBeenCalledWith({ targetArmor: 4 });
    expect(onMemoryUpdate).toHaveBeenCalledWith({ targetArmor: 4 });
  });

  it('marks the current armor on the chips', () => {
    renderShot();

    const chips = screen.getByTestId('armor-quick-chips');
    expect(within(chips).getByText('2').closest('button')).toHaveClass('bg-cyan-950/50');
  });

  it('renders recent distance chips from the dice history', async () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([
      { value: '7', field: 'distance', timestamp: 1 },
      { value: '7', field: 'distance', timestamp: 2 },
      { value: '12', field: 'distance', timestamp: 3 },
    ]));

    renderShot();

    const chips = await screen.findByTestId('distance-recent-chips');
    expect(within(chips).getByText('7')).toBeInTheDocument();
    expect(within(chips).getByText('12')).toBeInTheDocument();
  });

  it('hides recent distance chips when there is no history', () => {
    renderShot();

    expect(screen.queryByTestId('distance-recent-chips')).not.toBeInTheDocument();
  });

  it('clicking a recent distance chip writes the distance', async () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([
      { value: '12', field: 'distance', timestamp: 1 },
    ]));
    const onChange = jest.fn();
    const onMemoryUpdate = jest.fn();

    renderShot({ onChange, onMemoryUpdate });

    const chips = await screen.findByTestId('distance-recent-chips');
    await userEvent.click(within(chips).getByText('12'));

    expect(onChange).toHaveBeenCalledWith({ distance: 12 });
    expect(onMemoryUpdate).toHaveBeenCalledWith({ distance: 12 });
  });

  it('ignores history entries of other fields', async () => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([
      { value: 'D6+2', field: 'range', timestamp: 1 },
    ]));

    renderShot();

    // Distance chips stay hidden — only 'distance' entries feed them
    expect(screen.queryByTestId('distance-recent-chips')).not.toBeInTheDocument();
  });
});
