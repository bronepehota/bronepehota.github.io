'use client';

import { useState } from 'react';
import { executeRoll } from '@/lib/game-logic';
import { Dices } from 'lucide-react';

export default function DiceRoller() {
  const [lastRoll, setLastRoll] = useState<{ total: number, rolls: number[], type: string } | null>(null);

  const roll = (type: string) => {
    const result = executeRoll(type);
    setLastRoll({ ...result, type });
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wider opacity-70">
        <Dices className="w-4 h-4" />
        Кубики
      </h3>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['D6', 'D12', 'D20'].map(d => (
          <button
            key={d}
            onClick={() => roll(d)}
            className="bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold transition-transform active:scale-95"
          >
            {d}
          </button>
        ))}
      </div>

      {lastRoll && (
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-600 text-center animate-in fade-in zoom-in duration-200">
          <div className="text-xs opacity-50 mb-1">{lastRoll.type}</div>
          <div className="text-3xl font-black text-blue-400">{lastRoll.total}</div>
          {lastRoll.rolls.length > 1 && (
            <div className="text-xs opacity-40 mt-1">({lastRoll.rolls.join(' + ')})</div>
          )}
        </div>
      )}
    </div>
  );
}


