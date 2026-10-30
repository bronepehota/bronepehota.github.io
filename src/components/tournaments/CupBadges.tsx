import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CupBadgesProps {
  gold: number;
  silver: number;
  bronze: number;
  className?: string;
}

const CUP_STYLES: Array<{ kind: string; countKey: 'gold' | 'silver' | 'bronze'; color: string; label: string }> = [
  { kind: 'gold', countKey: 'gold', color: 'text-amber-400', label: '1 место' },
  { kind: 'silver', countKey: 'silver', color: 'text-slate-300', label: '2 место' },
  { kind: 'bronze', countKey: 'bronze', color: 'text-amber-700', label: '3 место' },
];

/** Кубки за места у имени игрока: 🏆 золото / серебро / бронза. */
export default function CupBadges({ gold, silver, bronze, className }: CupBadgesProps) {
  const counts = { gold, silver, bronze };
  const cups = CUP_STYLES.filter((c) => counts[c.countKey] > 0);
  if (cups.length === 0) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)}>
      {cups.map((c) => (
        <span
          key={c.kind}
          data-testid={`cup-${c.kind}`}
          title={c.label}
          className={cn('inline-flex items-center gap-0.5', c.color)}
        >
          <Trophy className="w-3.5 h-3.5" aria-label={c.label} />
          {counts[c.countKey] > 1 && (
            <span className="font-ibm-mono text-[9px]">×{counts[c.countKey]}</span>
          )}
        </span>
      ))}
    </span>
  );
}
