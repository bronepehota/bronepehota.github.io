import { clsx } from 'clsx';
import type { LucideIcon as LucideIconType } from 'lucide-react';

interface StatBarProps {
  value: number;
  max: number;
  icon: LucideIconType;
  label?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatBar({
  value,
  max,
  icon: Icon,
  label,
  color = '#22d3ee',
  size = 'md'
}: StatBarProps) {
  const percentage = (value / max) * 100;
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2'
  };

  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className={clsx('w-4 h-4', color)} />}
      <div className="flex-1">
        <div className="relative bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              sizeClasses[size]
            )}
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
              boxShadow: `0 0 10px ${color}40`
            }}
          />
        </div>
        {(label || (value !== undefined)) && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white/80 mix-blend-plus-lighter">
            {value}/{max}
          </span>
        )}
      </div>
    </div>
  );
}
