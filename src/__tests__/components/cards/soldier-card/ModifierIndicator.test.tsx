import { render, screen } from '@testing-library/react';
import { ModifierIndicator } from '@/components/cards/soldier-card/ModifierIndicator';
import type { BuffDefinition, SoldierModifier } from '@/lib/modifier-types';

const pro4 = {
  id: 'jump_boost_4', name: 'Пр4', description: 'Прыжковой ускоритель на 4е',
  applyTo: ['soldier'], target: 'custom', value: 4, phase: 'always',
  icon: 'ArrowUp', oneTimeUse: true,
} as unknown as BuffDefinition;

const applied = {
  id: 'm1', name: 'Медик', description: '+1 брони', soldierIndex: 0,
  appliedAtTurn: 1, value: 1, phase: 'always', icon: 'Sparkles',
} as unknown as SoldierModifier;

describe('ModifierIndicator — классические спец-свойства', () => {
  it('без активных модификаторов: свойства иконками + доступное имя', () => {
    render(<ModifierIndicator buffCount={0} debuffCount={0} staticAbilities={[pro4]} />);
    const btn = screen.getByRole('button', { name: 'Спец-свойства: Пр4' });
    expect(btn.querySelector('svg')).toBeTruthy(); // иконка каталога ArrowUp
  });

  it('активные модификаторы не вытесняют свойства — рендерятся рядом', () => {
    render(
      <ModifierIndicator
        buffCount={0}
        debuffCount={0}
        staticAbilities={[pro4]}
        soldierModifiers={[applied]}
      />
    );
    // aria считает applied (1 модификатор), но иконка свойства тоже на кнопке
    const btn = screen.getByRole('button', { name: /1 модификатор/ });
    expect(btn.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
  });

  it('без свойств и модификаторов — прежняя заглушка', () => {
    render(<ModifierIndicator buffCount={0} debuffCount={0} />);
    expect(screen.getByRole('button', { name: 'Добавить эффект' })).toBeInTheDocument();
  });
});
