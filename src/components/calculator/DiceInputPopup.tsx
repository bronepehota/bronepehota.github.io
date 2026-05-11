'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Minus, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HISTORY_KEY, fieldFromTitle, saveEntry, getRecentForField, loadHistory } from '@/lib/dice-history';

interface DiceInputPopupProps {
  title: string;
  value?: string;
  color: 'blue' | 'orange' | 'cyan' | 'emerald';
  onSubmit: (value: string) => void;
  onClose: () => void;
  mode?: 'dice' | 'number';
  numericValue?: number;
  min?: number;
  max?: number;
}

// --- Color configs ---

const colorConfig = {
  blue: {
    selected: 'border-blue-500 bg-blue-950/60 text-blue-400 shadow-lg shadow-blue-500/20',
    unselected: 'border-slate-700 bg-slate-800/60 text-slate-500 hover:border-blue-500/30 hover:text-slate-300',
    preview: 'text-blue-400',
    accent: 'border-blue-500/50',
    glow: 'shadow-blue-500/30',
    fill: 'bg-blue-500',
    tint: 'text-blue-500/20',
    gradient: 'from-blue-500/10 via-transparent to-blue-500/5',
  },
  orange: {
    selected: 'border-orange-500 bg-orange-950/60 text-orange-400 shadow-lg shadow-orange-500/20',
    unselected: 'border-slate-700 bg-slate-800/60 text-slate-500 hover:border-orange-500/30 hover:text-slate-300',
    preview: 'text-orange-400',
    accent: 'border-orange-500/50',
    glow: 'shadow-orange-500/30',
    fill: 'bg-orange-500',
    tint: 'text-orange-500/20',
    gradient: 'from-orange-500/10 via-transparent to-orange-500/5',
  },
  cyan: {
    selected: 'border-cyan-500 bg-cyan-950/60 text-cyan-400 shadow-lg shadow-cyan-500/20',
    unselected: 'border-slate-700 bg-slate-800/60 text-slate-500 hover:border-cyan-500/30 hover:text-slate-300',
    preview: 'text-cyan-400',
    accent: 'border-cyan-500/50',
    glow: 'shadow-cyan-500/30',
    fill: 'bg-cyan-500',
    tint: 'text-cyan-500/20',
    gradient: 'from-cyan-500/10 via-transparent to-cyan-500/5',
  },
  emerald: {
    selected: 'border-emerald-500 bg-emerald-950/60 text-emerald-400 shadow-lg shadow-emerald-500/20',
    unselected: 'border-slate-700 bg-slate-800/60 text-slate-500 hover:border-emerald-500/30 hover:text-slate-300',
    preview: 'text-emerald-400',
    accent: 'border-emerald-500/50',
    glow: 'shadow-emerald-500/30',
    fill: 'bg-emerald-500',
    tint: 'text-emerald-500/20',
    gradient: 'from-emerald-500/10 via-transparent to-emerald-500/5',
  },
};

// --- Component ---

export function DiceInputPopup({
  title,
  value,
  color,
  onSubmit,
  onClose,
  mode = 'dice',
  numericValue = 0,
  min = 0,
  max = 10,
}: DiceInputPopupProps) {
  const colors = colorConfig[color];
  const field = fieldFromTitle(title);
  const recentEntries = useMemo(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(HISTORY_KEY) : null;
    return getRecentForField(loadHistory(raw), field);
  }, [field]);

  // Dice mode state
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

  // Number mode state
  const [numValue, setNumValue] = useState(numericValue);

  // Animation state
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const buildNotation = useCallback(() => {
    const dicePart = count === 1 ? `D${sides}` : `${count}D${sides}`;
    if (bonus > 0) return `${dicePart}+${bonus}`;
    if (bonus < 0) return `${dicePart}${bonus}`;
    return dicePart;
  }, [count, sides, bonus]);

  const handleSubmit = useCallback(() => {
    const result = mode === 'number' ? String(numValue) : buildNotation();
    const raw = localStorage.getItem(HISTORY_KEY);
    const updated = saveEntry(raw, { value: result, field, timestamp: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    onSubmit(result);
  }, [mode, numValue, buildNotation, field, onSubmit]);

  const handleQuickSelect = useCallback((val: string) => {
    if (mode === 'number') {
      const n = parseInt(val, 10);
      if (!isNaN(n)) setNumValue(n);
    } else {
      // Parse dice notation and set state
      const match = val.match(/(?:(\d+))?D(\d+)(?:\+(-?\d+))?/);
      if (match) {
        setCount(parseInt(match[1] || '1'));
        setSides(parseInt(match[2]));
        setBonus(parseInt(match[3] || '0'));
      }
    }
  }, [mode]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 150);
  }, [onClose]);

  const maxFreq = useMemo(() => Math.max(1, ...recentEntries.map(e => e.count)), [recentEntries]);

  return (
    <div className={cn(
      "fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 transition-all duration-200",
      isVisible ? "bg-slate-950/90 backdrop-blur-sm" : "bg-slate-950/0"
    )}>
      <div className={cn(
        "w-full max-w-[420px] bg-slate-900 border-2 rounded-t-2xl md:rounded-xl overflow-hidden transition-all duration-300",
        colors.accent,
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      )}>
        {/* Scanline overlay */}
        <div className="absolute inset-0 combat-scanlines pointer-events-none z-10 opacity-30" />

        {/* Header — military briefing style */}
        <div className="relative px-4 pt-4 pb-3">
          {/* Geometric header decorations */}
          <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r", colors.gradient)} />
          <div className="absolute top-0 left-4 w-6 h-[2px] bg-current opacity-40" style={{ color: 'inherit' }} />

          <div className="flex items-center justify-between relative z-20">
            <div className="flex items-center gap-2.5">
              {/* Status LED */}
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                color === 'blue' ? 'bg-blue-400 shadow-sm shadow-blue-400/50' :
                color === 'orange' ? 'bg-orange-400 shadow-sm shadow-orange-400/50' :
                color === 'cyan' ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' :
                'bg-emerald-400 shadow-sm shadow-emerald-400/50'
              )} />
              <h3 className={cn("font-mono font-black text-base uppercase tracking-[0.15em]", colors.preview)}>
                {title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-800/80 rounded-lg border border-slate-700/80 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all active:scale-95"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="px-4 pb-4 space-y-3 relative z-20">

          {/* Recent / Quick Select */}
          {recentEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3 text-slate-600" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Недавние</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {recentEntries.map((entry) => {
                  const freqRatio = entry.count / maxFreq;
                  const isCurrent = mode === 'dice'
                    ? entry.value === buildNotation()
                    : entry.value === String(numValue);
                  return (
                    <button
                      key={entry.value}
                      onClick={() => handleQuickSelect(entry.value)}
                      className={cn(
                        "relative group px-3 py-1.5 rounded-md border transition-all active:scale-95 min-h-[36px]",
                        "flex items-center gap-1.5",
                        isCurrent
                          ? colors.selected
                          : "border-slate-700/80 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                      )}
                    >
                      <span className="font-mono font-bold text-xs tracking-wider">{entry.value}</span>
                      {/* Frequency indicator bar */}
                      {entry.count > 1 && (
                        <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full opacity-60", colors.fill)}
                            style={{ width: `${Math.max(20, freqRatio * 100)}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'number' ? (
            /* ===== Number Mode ===== */
            <div className="space-y-3">
              {/* Value stepper with military frame */}
              <div className="relative bg-slate-950/50 rounded-lg border border-slate-700/50 p-4">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-slate-600/40 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-slate-600/40 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-slate-600/40 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-slate-600/40 rounded-br-lg" />

                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={() => setNumValue(Math.max(min, numValue - 1))}
                    disabled={numValue <= min}
                    className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-700"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <span className={cn(
                      "font-mono font-black text-5xl tabular-nums transition-colors",
                      numValue > 0 ? colors.preview : "text-slate-300"
                    )}>
                      {numValue}
                    </span>
                    {/* Subtle background number for texture */}
                    <span className={cn("absolute inset-0 font-mono font-black text-5xl tabular-nums select-none pointer-events-none", colors.tint)}>
                      {numValue}
                    </span>
                  </div>
                  <button
                    onClick={() => setNumValue(Math.min(max, numValue + 1))}
                    disabled={numValue >= max}
                    className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick values grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(v => v >= min && v <= max).map(v => (
                  <button
                    key={v}
                    onClick={() => setNumValue(v)}
                    className={cn(
                      "py-2 rounded-md border font-mono text-sm font-bold transition-all active:scale-90",
                      numValue === v
                        ? colors.selected
                        : "border-slate-700/80 bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ===== Dice Mode ===== */
            <>
              {/* Dice Type Selector — geometric hexagonal feel */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2">Тип кубика</div>
                <div className="flex gap-2">
                  {[6, 12, 20].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSides(s)}
                      className={cn(
                        "relative flex-1 p-3 rounded-lg border-2 font-mono font-black text-xl text-center transition-all active:scale-95 min-h-[54px] overflow-hidden",
                        sides === s ? colors.selected : colors.unselected
                      )}
                    >
                      {/* Diagonal accent when selected */}
                      {sides === s && (
                        <div className={cn("absolute -top-1 -right-1 w-6 h-6 rotate-45 opacity-30", colors.fill)} />
                      )}
                      D{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count & Bonus steppers — side by side on wider popups */}
              <div className="grid grid-cols-2 gap-3">
                {/* Count */}
                <div className="bg-slate-950/40 rounded-lg border border-slate-700/40 p-3">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2 text-center">Кол-во</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCount(Math.max(1, count - 1))}
                      disabled={count <= 1}
                      className="w-9 h-9 rounded bg-slate-800 border border-slate-600 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-black text-2xl text-white w-8 text-center tabular-nums">{count}</span>
                    <button
                      onClick={() => setCount(Math.min(5, count + 1))}
                      disabled={count >= 5}
                      className="w-9 h-9 rounded bg-slate-800 border border-slate-600 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bonus */}
                <div className="bg-slate-950/40 rounded-lg border border-slate-700/40 p-3">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-slate-600 mb-2 text-center">Бонус</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setBonus(Math.max(-10, bonus - 1))}
                      disabled={bonus <= -10}
                      className="w-9 h-9 rounded bg-slate-800 border border-slate-600 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className={cn(
                      "font-mono font-black text-2xl w-10 text-center tabular-nums",
                      bonus > 0 ? "text-emerald-400" : bonus < 0 ? "text-red-400" : "text-white"
                    )}>
                      {bonus > 0 ? `+${bonus}` : bonus}
                    </span>
                    <button
                      onClick={() => setBonus(Math.min(10, bonus + 1))}
                      disabled={bonus >= 10}
                      className="w-9 h-9 rounded bg-slate-800 border border-slate-600 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all hover:bg-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview — large, framed */}
              <div className="relative bg-slate-950/50 rounded-lg border border-slate-700/40 py-3">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-slate-600/30" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-slate-600/30" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-slate-600/30" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-slate-600/30" />
                <div className="text-center">
                  <span className={cn("font-mono font-black text-3xl tracking-wider", colors.preview)} style={{
                    textShadow: `0 0 20px currentColor`,
                  }}>
                    {buildNotation()}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Submit — matches BottomSheetCombatModal execute button */}
          <button
            onClick={handleSubmit}
            className={cn(
              "relative w-full py-3 rounded-lg font-mono font-bold text-sm uppercase tracking-wider border-2 transition-all min-h-[48px] active:scale-95 overflow-hidden",
              colors.selected,
              "hover:brightness-110"
            )}
          >
            {/* Tech decoration corners */}
            <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 opacity-30", colors.accent)} />
            <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 opacity-30", colors.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 opacity-30", colors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 opacity-30", colors.accent)} />
            <span className="relative">Подтвердить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
