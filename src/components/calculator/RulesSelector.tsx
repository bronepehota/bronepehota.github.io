'use client';

import { cn } from '@/lib/utils';
import type { RulesVersionID } from '@/lib/types';

interface RulesSelectorProps {
  value: RulesVersionID;
  onChange: (version: RulesVersionID) => void;
  className?: string;
}

const RULES_OPTIONS: Array<{ id: RulesVersionID; label: string; description: string }> = [
  { id: 'tehnolog', label: 'Технолог', description: 'Официальные правила' },
  { id: 'community_star_system', label: 'Стар Систем', description: 'Фан-правила' },
];

export function RulesSelector({ value, onChange, className }: RulesSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {RULES_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            "flex-1 p-2.5 rounded-lg border-2 text-center transition-all active:scale-95 min-h-[44px]",
            value === opt.id
              ? "border-amber-500 bg-amber-950/40 text-amber-400 shadow-lg shadow-amber-900/20"
              : "border-slate-600 bg-slate-800/60 text-slate-400 hover:border-slate-500"
          )}
        >
          <div className="font-mono font-bold text-xs uppercase tracking-wider">{opt.label}</div>
          <div className="text-[9px] opacity-60 mt-0.5">{opt.description}</div>
        </button>
      ))}
    </div>
  );
}