'use client';

import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiceInputPopupProps {
  title: string;
  value?: string;
  color: 'blue' | 'orange';
  onSubmit: (value: string) => void;
  onClose: () => void;
}

const DICE_TYPES = [
  { sides: 6, label: 'D6' },
  { sides: 12, label: 'D12' },
  { sides: 20, label: 'D20' },
] as const;

const colorConfig = {
  blue: {
    selected: 'border-blue-500 bg-blue-950/60 text-blue-400 shadow-lg shadow-blue-500/20',
    unselected: 'border-slate-600 bg-slate-800/60 text-slate-400 hover:border-blue-500/40',
    preview: 'text-blue-400',
    accent: 'border-blue-500/50',
  },
  orange: {
    selected: 'border-orange-500 bg-orange-950/60 text-orange-400 shadow-lg shadow-orange-500/20',
    unselected: 'border-slate-600 bg-slate-800/60 text-slate-400 hover:border-orange-500/40',
    preview: 'text-orange-400',
    accent: 'border-orange-500/50',
  },
};

export function DiceInputPopup({ title, value, color, onSubmit, onClose }: DiceInputPopupProps) {
  const colors = colorConfig[color];

  const parseInitial = () => {
    if (!value) return { sides: 6, count: 1, bonus: 0 };
    const match = value.match(/(?:(\d+))?D(\d+)(?:\+(-?\d+))?/);
    if (!match) return { sides: 6, count: 1, bonus: 0 };
    return {
      sides: parseInt(match[2]),
      count: parseInt(match[1] || '1'),
      bonus: parseInt(match[3] || '0'),
    };
  };

  const initial = parseInitial();
  const [sides, setSides] = useState(initial.sides);
  const [count, setCount] = useState(initial.count);
  const [bonus, setBonus] = useState(initial.bonus);

  const buildNotation = () => {
    const dicePart = count === 1 ? `D${sides}` : `${count}D${sides}`;
    if (bonus > 0) return `${dicePart}+${bonus}`;
    if (bonus < 0) return `${dicePart}${bonus}`;
    return dicePart;
  };

  const handleSubmit = () => {
    onSubmit(buildNotation());
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className={cn(
        "w-full max-w-[400px] bg-slate-900 border-2 rounded-t-xl md:rounded-xl",
        colors.accent,
        "p-4 space-y-4"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={cn("font-mono font-black text-lg uppercase tracking-wider", colors.preview)}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Dice Type Selector */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2">Тип кубика</div>
          <div className="flex gap-2">
            {DICE_TYPES.map((dt) => (
              <button
                key={dt.sides}
                onClick={() => setSides(dt.sides)}
                className={cn(
                  "flex-1 p-3 rounded-lg border-2 font-mono font-black text-xl text-center transition-all active:scale-95 min-h-[52px]",
                  sides === dt.sides ? colors.selected : colors.unselected
                )}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count Stepper */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Количество</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount(Math.max(1, count - 1))}
              disabled={count <= 1}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-black text-2xl text-white w-8 text-center">{count}</span>
            <button
              onClick={() => setCount(Math.min(5, count + 1))}
              disabled={count >= 5}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bonus Stepper */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Бонус</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBonus(Math.max(-10, bonus - 1))}
              disabled={bonus <= -10}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className={cn(
              "font-mono font-black text-2xl w-12 text-center",
              bonus > 0 ? "text-emerald-400" : bonus < 0 ? "text-red-400" : "text-white"
            )}>
              {bonus > 0 ? `+${bonus}` : bonus}
            </span>
            <button
              onClick={() => setBonus(Math.min(10, bonus + 1))}
              disabled={bonus >= 10}
              className="w-10 h-10 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="text-center py-2">
          <span className={cn("font-mono font-black text-2xl", colors.preview)}>
            {buildNotation()}
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className={cn(
            "w-full py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 transition-all min-h-[48px] active:scale-95",
            colors.selected
          )}
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}