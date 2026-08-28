// src/__tests__/components/UnitCombatSandbox.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UnitCombatSandbox } from '@/components/encyclopedia/UnitDetail/UnitCombatSandbox';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';
import { trackEvent } from '@/lib/analytics';
import type { Soldier } from '@/lib/types';
import type { CombatActionType } from '@/lib/combat-types';
import type { EnrichedUnit } from '@/lib/encyclopedia-utils';

jest.mock('@/hooks/useStandaloneCombatFlow', () => ({
  useStandaloneCombatFlow: jest.fn(),
}));

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

// Стабы боевых детей — тестируем обвязку песочницы, не их внутренности.
// ParameterInputs-стаб пробрасывает onDataNeeded наружу кнопкой — так тесты
// могут открыть попап кубиков без настоящей фазы PARAMETERS.
jest.mock('@/components/combat/ParameterInputs', () => ({
  ParameterInputs: ({ onDataNeeded }: { onDataNeeded?: (field: string) => void }) => (
    <div data-testid="parameter-inputs-stub">
      {onDataNeeded && (
        <button type="button" data-testid="stub-open-dice" onClick={() => onDataNeeded('range')}>
          open dice
        </button>
      )}
    </div>
  ),
}));
jest.mock('@/components/combat/CombatResults', () => ({
  CombatResults: () => <div data-testid="combat-results-stub" />,
}));
// ВАЖНО: стаб БЕЗ stopPropagation — как настоящий DiceInputPopup. Если попап
// окажется вложен в оверлей (onClick={onClose}), клик по нему всплывёт и
// закроет песочницу — это и есть регрессия, которую ловит тест ниже.
jest.mock('@/components/calculator/DiceInputPopup', () => ({
  DiceInputPopup: () => <div data-testid="dice-popup-stub" />,
}));

const UNIT = { id: 'star_system_polaris_test', name: 'Тестовый отряд' } as unknown as EnrichedUnit;

const soldier = (overrides: Partial<Soldier> = {}): Soldier => ({
  rank: 3,
  speed: 4,
  range: 'D12',
  power: '2D6',
  melee: 2,
  armor: 3,
  ...overrides,
});

function makeFlow() {
  return {
    combatState: {
      // широкие типы — тесты переключают фазу/действие без пересоздания стаба
      phase: 'ACTION_SELECT' as 'ACTION_SELECT' | 'PARAMETERS' | 'ROLLING' | 'RESULTS' | 'APPLY',
      actionType: null as CombatActionType | null,
      unitType: 'squad' as const,
      parameters: { distance: 6, targetArmor: 3, targetMelee: 2, fortification: 'none' as const },
      result: null,
    },
    selectAction: jest.fn(),
    setParameters: jest.fn(),
    executeAction: jest.fn(),
    applyResult: jest.fn(),
    goBack: jest.fn(),
    checkGrenadeTarget: jest.fn(),
    combatantData: { type: 'squad' as const, melee: 2, armor: 3, rank: 3, grenadesAvailable: true },
    updateCombatantField: jest.fn(),
    rulesVersion: 'tehnolog' as const,
    updateRulesVersion: jest.fn(),
    modifierSummary: {},
    setModifierSummary: jest.fn(),
    switchAction: jest.fn(),
    newCalculation: jest.fn(),
  };
}

const useFlowMock = useStandaloneCombatFlow as unknown as jest.Mock;

function renderSandbox(soldiers: Soldier[], unit: EnrichedUnit = UNIT) {
  const onClose = jest.fn();
  render(<UnitCombatSandbox unit={unit} soldiers={soldiers} onClose={onClose} />);
  return { onClose };
}

describe('UnitCombatSandbox — боевая песочница юнита', () => {
  let flow: ReturnType<typeof makeFlow>;

  beforeEach(() => {
    flow = makeFlow();
    useFlowMock.mockReturnValue(flow);
  });

  it('рендерит лист + шлёт sandbox_open с id юнита при монтировании', () => {
    renderSandbox([soldier()]);
    expect(screen.getByTestId('unit-combat-sandbox')).toBeInTheDocument();
    expect(screen.getByText('Тестовый отряд')).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('sandbox_open', { unit: 'star_system_polaris_test' });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('панель: мобайл — приклеена к низу full-width; md+ — парящая карточка-диалог', () => {
    renderSandbox([soldier()]);
    const panel = screen.getByTestId('unit-combat-sandbox');
    // базовые (мобайл) классы не трогаем
    expect(panel).toHaveClass('fixed', 'inset-x-0', 'bottom-0', 'rounded-t-2xl');
    // адаптив: центрирование, ограничение ширины, радиус со всех сторон, отступ снизу
    expect(panel).toHaveClass('md:mx-auto', 'md:max-w-xl', 'md:rounded-2xl', 'md:bottom-6');
    // оверлей остаётся fullscreen
    expect(screen.getByTestId('unit-combat-sandbox-overlay')).toHaveClass('fixed', 'inset-0');
  });

  it('различающиеся статы → чипы солдат; клик чипа проталкивает поля и отложенно сбрасывает расчёт', () => {
    renderSandbox([
      soldier(),
      soldier({ rank: 2, range: 'D6', power: '1D20', melee: 4, armor: 5 }),
    ]);

    expect(screen.getByTestId('sandbox-soldier-0')).toBeInTheDocument();
    expect(screen.getByTestId('sandbox-soldier-1')).toBeInTheDocument();
    // подписи «1»…«n»
    expect(screen.getByTestId('sandbox-soldier-0')).toHaveTextContent('1');

    // Зонд: фиксируем состояние DOM в момент вызова newCalculation.
    // Синхронный вызов в обработчике клика видел бы СТАРЫЙ DOM (aria-pressed=false) —
    // и, главное, старое замыкание combatantData предыдущего солдата.
    const domAtNewCalcCall: Array<string | null> = [];
    flow.newCalculation.mockImplementation(() => {
      domAtNewCalcCall.push(
        screen.getByTestId('sandbox-soldier-1').getAttribute('aria-pressed'),
      );
    });

    act(() => {
      fireEvent.click(screen.getByTestId('sandbox-soldier-1'));
    });

    // хук берёт initialCombatant только при монтировании — поля идут через updateCombatantField
    expect(flow.updateCombatantField).toHaveBeenCalledWith('range', 'D6');
    expect(flow.updateCombatantField).toHaveBeenCalledWith('power', '1D20');
    expect(flow.updateCombatantField).toHaveBeenCalledWith('melee', 4);
    expect(flow.updateCombatantField).toHaveBeenCalledWith('armor', 5);
    expect(flow.updateCombatantField).toHaveBeenCalledWith('rank', 2);

    // сброс расчёта — ровно один раз, после флеша эффектов (не синхронно в обработчике)
    expect(flow.newCalculation).toHaveBeenCalledTimes(1);
    expect(domAtNewCalcCall).toEqual(['true']);

    // выделение переехало на второй чип
    expect(screen.getByTestId('sandbox-soldier-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('sandbox-soldier-0')).toHaveAttribute('aria-pressed', 'false');
  });

  it('одинаковые статы → чипы не рендерятся', () => {
    renderSandbox([soldier(), soldier(), soldier()]);
    expect(screen.queryByTestId('sandbox-soldier-0')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-soldier-1')).not.toBeInTheDocument();
  });

  it('крестик закрывает песочницу', () => {
    const { onClose } = renderSandbox([soldier()]);
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('клик по оверлею закрывает, клик по панели — нет', () => {
    const { onClose } = renderSandbox([soldier()]);
    const panel = screen.getByTestId('unit-combat-sandbox');
    const overlay = screen.getByTestId('unit-combat-sandbox-overlay');

    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('регрессия: клик внутри попапа кубиков не закрывает песочницу', () => {
    // Фаза PARAMETERS — ParameterInputs-стаб рендерит кнопку, дёргающую
    // onDataNeeded('range') → открывается DiceInputPopup.
    flow.combatState = {
      ...flow.combatState,
      phase: 'PARAMETERS' as const,
      actionType: 'shot' as const,
    };
    const { onClose } = renderSandbox([soldier()]);

    act(() => {
      fireEvent.click(screen.getByTestId('stub-open-dice'));
    });
    expect(screen.getByTestId('dice-popup-stub')).toBeInTheDocument();

    // Стаб попапа НЕ останавливает всплытие: если попап вложен в оверлей
    // с onClick={onClose}, клик по нему закроет песочницу.
    act(() => {
      fireEvent.click(screen.getByTestId('dice-popup-stub'));
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('unit-combat-sandbox')).toBeInTheDocument();
    expect(screen.getByTestId('dice-popup-stub')).toBeInTheDocument();
  });

  it('повторный клик по уже выбранному чипу солдата ничего не проталкивает', () => {
    renderSandbox([
      soldier(),
      soldier({ rank: 2, range: 'D6', power: '1D20', melee: 4, armor: 5 }),
    ]);

    // чип 0 выбран по умолчанию (soldierIdx = 0)
    expect(screen.getByTestId('sandbox-soldier-0')).toHaveAttribute('aria-pressed', 'true');

    act(() => {
      fireEvent.click(screen.getByTestId('sandbox-soldier-0'));
    });

    expect(flow.updateCombatantField).not.toHaveBeenCalled();
    expect(flow.newCalculation).not.toHaveBeenCalled();
    expect(screen.getByTestId('sandbox-soldier-0')).toHaveAttribute('aria-pressed', 'true');
  });

  it('предлагает только выстрел и ближний бой; клик вызывает selectAction', () => {
    renderSandbox([soldier()]);
    expect(screen.getByTestId('sandbox-action-shot')).toBeInTheDocument();
    expect(screen.getByTestId('sandbox-action-melee')).toBeInTheDocument();
    expect(screen.queryByTestId('sandbox-action-grenade')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('sandbox-action-shot'));
    expect(flow.selectAction).toHaveBeenCalledWith('shot');
    expect(flow.selectAction).toHaveBeenCalledTimes(1);
  });
});
