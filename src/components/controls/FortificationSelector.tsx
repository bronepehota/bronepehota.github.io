'use client';

import { FortificationType, FORTIFICATION_MODIFIERS, RulesVersionID } from '@/lib/types';
import { clsx } from 'clsx';
import { ShieldOff, ShieldHalf, ShieldCheck } from 'lucide-react';

interface FortificationSelectorProps {
  value: FortificationType;
  onChange: (value: FortificationType) => void;
  rulesVersion: RulesVersionID;
  className?: string;
}

const OPTIONS: Record<FortificationType, {
  label: string;
  icon: React.ReactNode;
  tooltip: string;
}> = {
  none: { label: 'Нет', icon: <ShieldOff size={18} />, tooltip: 'Без укрытия' },
  light: { label: '<50%', icon: <ShieldHalf size={18} />, tooltip: 'Лёгкое укрытие (менее 50%)' },
  heavy: { label: '>50%', icon: <ShieldCheck size={18} />, tooltip: 'Полное укрытие (более 50%)' },
};

export function FortificationSelector({
  value,
  onChange,
  rulesVersion,
  className = ''
}: FortificationSelectorProps) {
  const getModifierText = (type: FortificationType) => {
    const mod = FORTIFICATION_MODIFIERS[type];
    if (rulesVersion === 'tehnolog') {
      return mod.armor > 0 ? `+${mod.armor} к броне` : '+0';
    } else {
      return mod.distance > 0 ? `+${mod.distance} к дистанции` : '+0';
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Укрытие цели"
      className={clsx('flex gap-1', className)}
    >
      {(Object.entries(OPTIONS) as [FortificationType, typeof OPTIONS.none][]).map(
        ([type, opt]) => {
          const isSelected = value === type;
          return (
            <button
              key={type}
              role="radio"
              aria-checked={isSelected}
              aria-label={opt.tooltip}
              title={`${opt.tooltip}. Модификатор: ${getModifierText(type)}`}
              className={clsx(
                'flex flex-col items-center justify-center',
                'flex-1 min-w-[60px] p-2 rounded-lg',
                'transition-all duration-200',
                'border-2',
                isSelected
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500'
                  : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'
              )}
              onClick={() => onChange(type)}
            >
              {opt.icon}
              <span className="text-xs font-medium mt-1">{opt.label}</span>
            </button>
          );
        }
      )}
    </div>
  );
}
