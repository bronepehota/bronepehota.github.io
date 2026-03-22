'use client';

import { cn } from '@/lib/utils';
import type { ModifierSummary } from '@/lib/modifier-types';

interface ActiveModifiersDisplayProps {
  summary: ModifierSummary;
  className?: string;
}

function getBadgeColor(text: string): string {
  const lower = text.toLowerCase();

  if (
    lower.includes('скорость') &&
    (lower.includes('0.5') || lower.includes('x0.5'))
  ) {
    return 'bg-red-900/30 text-red-400 border border-red-700/30';
  }

  if (lower.includes('+')) {
    return 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/30';
  }

  if (
    lower.includes('-') ||
    lower.includes('штраф') ||
    lower.includes('повреждение') ||
    lower.includes('пробита')
  ) {
    return 'bg-red-900/30 text-red-400 border border-red-700/30';
  }

  return 'bg-amber-900/30 text-amber-400 border border-amber-700/30';
}

export default function ActiveModifiersDisplay({
  summary,
  className,
}: ActiveModifiersDisplayProps) {
  if (summary.descriptions.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-slate-800/60 p-2 rounded-lg border border-slate-700/50', className)}>
      <div className="text-[9px] opacity-50 uppercase font-bold tracking-wider mb-1">
        МОДИФИКАТОРЫ
      </div>
      <div className="flex flex-wrap gap-1">
        {summary.descriptions.map((desc, i) => (
          <span
            key={i}
            className={cn(
              'text-[10px] font-mono px-1.5 py-0.5 rounded',
              getBadgeColor(desc)
            )}
          >
            {desc}
          </span>
        ))}
      </div>
    </div>
  );
}
