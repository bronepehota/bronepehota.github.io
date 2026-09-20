'use client';

import type { Squad } from '@/lib/types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { cn } from '@/lib/utils';
import { collectSquadSpecialProps } from '@/lib/modifier-utils';

/**
 * Классические спец-свойства отряда (Пр3/4/5, Рм — каталог standard-modifiers,
 * target 'custom') именованными чипами на карточках армии: селектор, компактная
 * карточка и список перед боем. Оба механизма хранения объединяет
 * collectSquadSpecialProps: взводные buffs (редактор) + пер-солдатские
 * modifiers[] (основная форма в данных). Плейтест 2026-09-20: «постоянный баф
 * — показывать его название, чтобы на отрядах было его видно». Обычные
 * бафы-модификаторы не показываем: им место в бою.
 */
export function SquadSpecialProps({ squad, className }: {
  squad?: Squad;
  className?: string;
}) {
  const specials = squad ? collectSquadSpecialProps(squad) : [];
  if (specials.length === 0) return null;
  return (
    <span className={cn('flex items-center gap-1 min-w-0', className)}>
      {specials.map(b => (
        // Плейтест 2026-09-20: «слишком ярко кричащее» — тихая аннотация;
        // повторный плейтест: «слишком яркие и крупные» на карточках
        // каталога (теперь у всех отрядов) — 9px как в бою, минимальные
        // отступы, приглушённый тон. Ярко — только бою.
        <span
          key={b.id}
          title={`${b.name}: ${b.description}${b.oneTimeUse ? ' (раз за бой)' : ''}`}
          className="flex items-center gap-px px-1 py-px rounded-sm border border-emerald-900/50 text-emerald-500/80 font-mono text-[9px] font-medium leading-none"
        >
          <ModifierIcon name={b.icon} size={9} className="text-emerald-500/60" />
          {b.name}
        </span>
      ))}
    </span>
  );
}
