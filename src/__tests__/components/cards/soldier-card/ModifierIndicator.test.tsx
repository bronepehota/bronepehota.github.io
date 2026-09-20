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

  it('«доступно N» — тихая кнопка: пунктир, без янтарной заливки (плейтест)', () => {
    // «Кнопка слишком видна, но на неё редко нажимают»: доступность —
    // возможность, а не событие; янтарь остаётся только в иконке
    render(<ModifierIndicator buffCount={0} debuffCount={0} availableCount={3} />);
    const btn = screen.getByRole('button', { name: '3 эффектов доступно' });
    expect(btn.className).toContain('border-dashed');
    expect(btn.className).not.toContain('bg-amber-950');
  });

  it('активные баффы не прячут спец-свойства: имя на кнопке рядом со счётчиком', () => {
    // «О них можно узнать только нажав на кнопку модификаторов» — неудобно;
    // счётчик И имена свойств на самой кнопке (плейтест 2026-09-20)
    render(<ModifierIndicator buffCount={2} debuffCount={0} staticAbilities={[pro4]} />);
    const btn = screen.getByRole('button', { name: /2 баффов/ });
    expect(btn).toHaveTextContent('Пр4');
    // тесная ячейка статов: имена переносятся, а не обрезаются
    expect(btn.className).toContain('flex-wrap');
  });

  it('применённые модификаторы не прячут имён свойств', () => {
    render(
      <ModifierIndicator
        buffCount={0}
        debuffCount={0}
        staticAbilities={[pro4]}
        soldierModifiers={[applied]}
      />
    );
    const btn = screen.getByRole('button', { name: /1 модификатор/ });
    expect(btn).toHaveTextContent('Пр4');
  });
});
