'use client';

import type { BuffDefinition } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { cn } from '@/lib/utils';

/**
 * Классические спец-свойства взвода (Пр4, Рм — каталог standard-modifiers,
 * target 'custom') именованными чипами на карточках армии: ростер
 * (CompactArmyCard), селектор и детальный вид (SquadCard). Плейтест
 * 2026-09-20: «постоянный баф — показывать его название, чтобы на отрядах
 * было его видно» — экран боя уже показывает их (ModifierIndicator).
 * Обычные бафы-модификаторы не показываем: им место в бою.
 */
export function SquadSpecialProps({ buffs, className }: {
  buffs?: BuffDefinition[];
  className?: string;
}) {
  const specials = (buffs || []).filter(b => b.target === 'custom');
  if (specials.length === 0) return null;
  return (
    <span className={cn('flex items-center gap-1 min-w-0', className)}>
      {specials.map(b => (
        // Плейтест 2026-09-20: «слишком ярко кричащее» — тихая аннотация:
        // без заливки, тонкая рамка, приглушённый тон. Ярко — только бою.
        <span
          key={b.id}
          title={`${b.name}: ${b.description}${b.oneTimeUse ? ' (раз за бой)' : ''}`}
          className="flex items-center gap-0.5 px-1 py-0.5 rounded-sm border border-emerald-800/50 text-emerald-400/90 font-mono font-semibold leading-none"
        >
          <ModifierIcon name={b.icon} size={10} className="text-emerald-400/70" />
          {b.name}
        </span>
      ))}
    </span>
  );
}
