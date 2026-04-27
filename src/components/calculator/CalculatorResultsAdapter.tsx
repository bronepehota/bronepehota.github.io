'use client';

import { Crosshair, Swords, Bomb, Target } from 'lucide-react';
import type { CalculatorResult } from '@/hooks/useCalculator';

interface CalculatorResultsAdapterProps {
  result: CalculatorResult;
  onReset: () => void;
  onGrenadeCheckTarget?: (armor: number) => void;
}

export default function CalculatorResultsAdapter({ result, onReset, onGrenadeCheckTarget }: CalculatorResultsAdapterProps) {
  if (result.type === 'shot') {
    return <ShotResultDisplay data={result.data} onReset={onReset} />;
  }
  if (result.type === 'melee') {
    return <MeleeResultDisplay data={result.data} onReset={onReset} />;
  }
  if (result.type === 'grenade_distance') {
    return <GrenadeDistanceDisplay data={result.data} onReset={onReset} />;
  }
  if (result.type === 'grenade_penetration') {
    return <GrenadePenetrationDisplay data={result.data} onReset={onReset} onCheckTarget={onGrenadeCheckTarget} />;
  }
  return null;
}

function ResultCard({ children, onReset }: { children: React.ReactNode; onReset: () => void }) {
  return (
    <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-lg">
      {children}
      <button
        onClick={onReset}
        className="mt-3 w-full px-3 py-2 bg-slate-700/50 hover:bg-slate-700
          text-slate-300 text-xs font-russo uppercase tracking-wide rounded
          transition-colors"
      >
        Новый бросок
      </button>
    </div>
  );
}

function ShotResultDisplay({ data, onReset }: { data: import('@/lib/combat-calculator').ShotResult; onReset: () => void }) {
  const { hitResult, damageResult } = data;
  return (
    <ResultCard onReset={onReset}>
      <div className="flex items-center gap-2 mb-3">
        <Crosshair className="w-4 h-4 text-slate-400" />
        <span className="font-russo text-xs uppercase tracking-wide text-slate-400">Стрельба</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">Попадание</span>
        <span className={`font-russo text-sm ${hitResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
          {hitResult.success ? 'ПОПАДАНИЕ' : 'ПРОМАХ'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/50 rounded px-2 py-1">
          <span className="text-slate-500">Бросок</span>
          <div className="font-ibm-mono text-slate-200">
            {hitResult.rolls?.length ? hitResult.rolls.join(', ') : hitResult.roll}
            {hitResult.bonus ? `+${hitResult.bonus}` : ''}
          </div>
        </div>
        <div className="bg-slate-900/50 rounded px-2 py-1">
          <span className="text-slate-500">Итого</span>
          <div className="font-ibm-mono text-slate-200">{hitResult.total}</div>
        </div>
      </div>
      {hitResult.success && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Урон</span>
            <span className={`font-russo text-sm ${damageResult.damage > 0 ? 'text-red-400' : 'text-slate-500'}`}>
              {damageResult.damage > 0 ? `${damageResult.damage} раны` : 'Броня выдержала'}
            </span>
          </div>
          {damageResult.rolls.length > 0 && (
            <div className="font-ibm-mono text-[10px] text-slate-500">
              [{damageResult.rolls.join(', ')}]
            </div>
          )}
        </div>
      )}
    </ResultCard>
  );
}

function MeleeResultDisplay({ data, onReset }: { data: import('@/lib/types').MeleeResult; onReset: () => void }) {
  return (
    <ResultCard onReset={onReset}>
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-slate-400" />
        <span className="font-russo text-xs uppercase tracking-wide text-slate-400">Ближний бой</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        <div className="bg-slate-900/50 rounded px-2 py-1">
          <span className="text-slate-500">Атакующий</span>
          <div className="font-ibm-mono text-slate-200">{data.attackerRoll}+{data.attackerTotal - data.attackerRoll}={data.attackerTotal}</div>
        </div>
        <div className="bg-slate-900/50 rounded px-2 py-1">
          <span className="text-slate-500">Защитник</span>
          <div className="font-ibm-mono text-slate-200">{data.defenderRoll}+{data.defenderTotal - data.defenderRoll}={data.defenderTotal}</div>
        </div>
      </div>
      <div className="text-center">
        <span className={`font-russo text-sm ${
          data.winner === 'attacker' ? 'text-emerald-400' :
          data.winner === 'defender' ? 'text-red-400' : 'text-slate-400'
        }`}>
          {data.winner === 'attacker' ? 'АТАКА УСПЕШНА' :
           data.winner === 'defender' ? 'ЗАЩИТА УСПЕШНА' : 'НИЧЬЯ'}
        </span>
      </div>
    </ResultCard>
  );
}

function GrenadeDistanceDisplay({ data, onReset }: { data: import('@/lib/combat-calculator').GrenadeDistanceResult; onReset: () => void }) {
  const isDangerous = data.distanceRoll === 1;
  return (
    <ResultCard onReset={onReset}>
      <div className="flex items-center gap-2 mb-3">
        <Bomb className="w-4 h-4 text-slate-400" />
        <span className="font-russo text-xs uppercase tracking-wide text-slate-400">Граната</span>
      </div>
      <div className="text-center mb-2">
        <div className="font-russo text-lg text-slate-200">
          Взрыв на расстоянии {data.totalDistance} шагов
        </div>
        <div className="font-ibm-mono text-xs text-slate-400 mt-1">
          [{data.blastZone.minSteps}-{data.blastZone.maxSteps} шагов, {data.blastZone.minCm}-{data.blastZone.maxCm} см]
        </div>
        {data.allRolls.length > 1 && (
          <div className="font-ibm-mono text-[10px] text-slate-500 mt-1">
            Броски: [{data.allRolls.join(', ')}]
          </div>
        )}
      </div>
      {isDangerous && (
        <div className="text-center text-red-400 text-xs font-russo">
          Опасно! Вы в зоне взрыва!
        </div>
      )}
    </ResultCard>
  );
}

function GrenadePenetrationDisplay({
  data,
  onReset,
  onCheckTarget,
}: {
  data: import('@/lib/combat-calculator').GrenadePenetrationResult;
  onReset: () => void;
  onCheckTarget?: (armor: number) => void;
}) {
  return (
    <ResultCard onReset={onReset}>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-slate-400" />
        <span className="font-russo text-xs uppercase tracking-wide text-slate-400">Проверка пробития</span>
      </div>
      <div className="text-center mb-2">
        <div className={`font-russo text-sm ${data.hit ? 'text-red-400' : 'text-emerald-400'}`}>
          {data.hit ? 'ПРОБИТО!' : 'НЕ ПРОБИТО'}
        </div>
        <div className="font-ibm-mono text-xs text-slate-400 mt-1">
          D20 = {data.roll} {data.roll > data.armor ? '>' : '≤'} Броня {data.armor}
        </div>
      </div>
      {onCheckTarget && (
        <button
          onClick={() => onCheckTarget(data.armor)}
          className="mt-2 w-full px-3 py-2 bg-amber-700/50 hover:bg-amber-700
            text-amber-200 text-xs font-russo uppercase tracking-wide rounded
            transition-colors"
        >
          Проверить ещё одну цель
        </button>
      )}
    </ResultCard>
  );
}
