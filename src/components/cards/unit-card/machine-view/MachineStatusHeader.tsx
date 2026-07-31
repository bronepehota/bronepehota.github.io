'use client';

import { Skull, AlertTriangle, Check, Loader2, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DurabilityZone, PilotInfo, FactionID } from '@/lib/types';
import { getFactionColors } from '@/lib/faction-colors';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { PilotChip } from './PilotChip';

interface MachineStatusHeaderProps {
  faction: FactionID;
  imageUrl: string;
  machineName: string;
  isDestroyed: boolean;
  currentDurability: number;
  maxDurability: number;
  speed: number;
  maxSpeed?: number;
  zone: DurabilityZone;
  pilotInfo: PilotInfo | null;
  pilotLabel?: string;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  onSurvivalTest: () => void;
  isPilotTestRunning: boolean;
  pilotTestUrgent: boolean;
  onOpenPilot: () => void;
  onImageClick: () => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
  flying?: boolean;
}

const getZoneColor = (color: 'green' | 'yellow' | 'red') => {
  const colors = {
    green: { bar: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
    red: { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' }
  };
  return colors[color];
};

export function MachineStatusHeader({
  faction,
  imageUrl,
  machineName,
  isDestroyed,
  currentDurability,
  maxDurability,
  speed,
  maxSpeed,
  zone,
  pilotInfo,
  pilotLabel,
  survivalTest,
  onSurvivalTest,
  isPilotTestRunning,
  pilotTestUrgent,
  onOpenPilot,
  onImageClick,
  distanceInputUnit,
  stepToCmFactor,
  flying
}: MachineStatusHeaderProps) {
  const colors = getFactionColors(faction);
  const zoneColor = getZoneColor(zone.color);

  return (
    <div className="relative">
      {/* Status header row */}
      <div className="flex gap-2.5 items-stretch">
        {/* Machine image — ~95px mobile, tap → fullscreen */}
        <button
          type="button"
          onClick={onImageClick}
          className="relative w-[95px] aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden border"
          style={{ borderColor: `${colors.primary}40` }}
          aria-label={`Показать фото: ${machineName}`}
        >
          <GitHubPagesImage
            src={imageUrl}
            alt={machineName}
            width={120}
            height={160}
            className="w-full h-full object-cover object-center"
            unoptimized
          />
          {isDestroyed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Skull className="w-8 h-8 text-red-500" strokeWidth={2.5} />
            </div>
          )}
          {flying && (
            <div
              className="absolute top-1 right-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-slate-900/90 border text-[9px] font-mono font-bold uppercase tracking-wider"
              style={{ borderColor: `${colors.primary}80`, color: colors.primary }}
              title="Летающая техника: 2 перемещения за ход, без ближнего боя, иммунитет к гранатам"
            >
              <Plane className="w-3 h-3" />
              <span>ЛЕТАЕТ</span>
            </div>
          )}
        </button>

        {/* Badges grid */}
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg py-1 text-center">
            <div className="text-[8px] uppercase tracking-wide text-slate-500">Прочн</div>
            <div className={cn('text-base font-black leading-tight', zoneColor.text)}>
              {currentDurability}<span className="text-[9px] opacity-60">/{maxDurability}</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg py-1 text-center">
            <div className="text-[8px] uppercase tracking-wide text-slate-500">Скор</div>
            <div className="text-base font-black leading-tight text-cyan-400">
              {distanceInputUnit === 'cm' ? speed * stepToCmFactor : speed}
              {maxSpeed !== undefined && maxSpeed > 0 && (
                <span className="text-[9px] opacity-60">
                  /{distanceInputUnit === 'cm' ? maxSpeed * stepToCmFactor : maxSpeed}
                </span>
              )}
              <span className="text-[8px] opacity-60 ml-0.5">{distanceInputUnit === 'cm' ? 'см' : 'ш'}</span>
            </div>
          </div>
          <div className="col-span-2">
            <PilotChip pilotInfo={pilotInfo} pilotLabel={pilotLabel} pilotTestUrgent={pilotTestUrgent} onOpenPilot={onOpenPilot} />
          </div>
        </div>
      </div>

      {/* Segmented durability bar */}
      <div className="flex gap-0.5 mt-2">
        {Array.from({ length: maxDurability }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-sm',
              i < currentDurability ? zoneColor.bar : 'bg-slate-800'
            )}
          />
        ))}
      </div>

      {/* #163 urgent pilot-test alert bar — preserved verbatim from TacticalDashboard */}
      {pilotInfo && pilotInfo.alive && (pilotTestUrgent || isPilotTestRunning || survivalTest) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSurvivalTest(); }}
          disabled={isPilotTestRunning}
          data-testid="pilot-survival-test-button"
          className={cn(
            "mt-1.5 w-full flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-sm border text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all touch-manipulation",
            isPilotTestRunning
              ? "bg-purple-950/50 border-purple-700/50 text-purple-300"
              : pilotTestUrgent
                ? "bg-amber-950/50 border-amber-500/60 text-amber-200 animate-pulse shadow-[0_0_12px_-3px_rgba(245,158,11,0.6)]"
                : survivalTest
                  ? survivalTest.survived
                    ? "bg-green-950/40 border-green-700/50 text-green-300"
                    : "bg-red-950/40 border-red-700/50 text-red-300"
                  : "bg-slate-800/40 border-slate-700/50 text-slate-400"
          )}
        >
          {isPilotTestRunning ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Тест пилота…</>
          ) : pilotTestUrgent ? (
            <><AlertTriangle className="w-3.5 h-3.5" /> Тест пилота · получен урон</>
          ) : survivalTest ? (
            survivalTest.survived
              ? <><Check className="w-3.5 h-3.5" /> Пилот выжил</>
              : <><Skull className="w-3.5 h-3.5" /> Пилот погиб</>
          ) : null}
        </button>
      )}
    </div>
  );
}
