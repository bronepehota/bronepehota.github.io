'use client';

import { Shield, Footprints, Flame, Wrench, Skull, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DurabilityZone, PilotInfo, FactionID } from '@/lib/types';
import { getFactionColors } from '@/lib/faction-colors';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';

interface TacticalDashboardProps {
  faction: FactionID;
  imageUrl: string;
  machineName: string;
  isDestroyed: boolean;
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  onUpdateDurability: (delta: number) => void;
  pilotInfo: PilotInfo | null;
  pilotImage: string | null;
  survivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  onAssignPilot: () => void;
  onSurvivalTest: () => void;
  isPilotTestRunning: boolean;
  onImageClick: () => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

const getZoneColor = (color: 'green' | 'yellow' | 'red') => {
  const colors = {
    green: { bar: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
    red: { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' }
  };
  return colors[color];
};

export function TacticalDashboard({
  faction,
  imageUrl,
  machineName,
  isDestroyed,
  currentDurability,
  maxDurability,
  speed,
  zone,
  onUpdateDurability,
  pilotInfo,
  pilotImage,
  survivalTest,
  onAssignPilot,
  onSurvivalTest,
  isPilotTestRunning,
  onImageClick,
  distanceInputUnit,
  stepToCmFactor
}: TacticalDashboardProps) {
  const colors = getFactionColors(faction);
  const zoneColor = getZoneColor(zone.color);

  return (
    <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-sm overflow-hidden">
      {/* Tactical grid background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(${colors.primary}20 1px, transparent 1px),
          linear-gradient(90deg, ${colors.primary}20 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }} />

      {/* Diagonal accent line - top left to bottom right */}
      <div className="absolute top-0 left-0 w-full h-px" style={{
        background: `linear-gradient(90deg, transparent 0%, ${colors.primary}80 50%, transparent 100%)`
      }} />

      {/* Main content grid */}
      <div className="relative grid grid-cols-[120px_1fr_80px] gap-3 p-3 items-start">
        {/* LEFT: Machine Image Panel */}
        <div className="relative">
          {/* Image container with tactical frame */}
          <div
            onClick={onImageClick}
            className="relative w-[120px] aspect-[3/4] rounded-sm overflow-hidden cursor-pointer group border-2 transition-all duration-300"
            style={{ borderColor: `${colors.primary}40` }}
          >
            {/* Tech corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 z-10" style={{ borderColor: colors.primary }} />
            <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 z-10" style={{ borderColor: colors.primary }} />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 z-10" style={{ borderColor: colors.primary }} />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 z-10" style={{ borderColor: colors.primary }} />

            {/* Image */}
            <GitHubPagesImage
              src={imageUrl}
              alt={machineName}
              width={120}
              height={160}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
              unoptimized
            />

            {/* Destroyed overlay */}
            {isDestroyed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Skull className="w-12 h-12 text-red-500" strokeWidth={2.5} />
              </div>
            )}

            {/* Scanning line animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan" />
            </div>
          </div>

          {/* Status indicator below image */}
          <div className={cn(
            "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-sm text-[8px] font-mono font-bold uppercase tracking-wider border transition-all",
            isDestroyed
              ? "bg-red-950/90 text-red-400 border-red-700/70"
              : "bg-emerald-950/90 text-emerald-400 border-emerald-700/70"
          )}>
            {isDestroyed ? 'НЕИСПРАВЕН' : 'ГОТОВ'}
          </div>
        </div>

        {/* CENTER: Stats Panel */}
        <div className="space-y-2">
          {/* Durability Section */}
          <div className="relative bg-slate-950/50 p-2 rounded-sm border border-slate-700/50">
            {/* Section header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: colors.primary }}>
                <Shield className="w-2.5 h-2.5" />
                Прочность
              </span>
              <span className={cn("text-xs font-mono font-black", zoneColor.text)}>
                {currentDurability}/{maxDurability}
              </span>
            </div>

            {/* Segmented durability bar */}
            <div className="flex gap-px mb-2">
              {Array.from({ length: maxDurability }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-sm transition-all flex-1",
                    i < currentDurability ? zoneColor.bar : "bg-slate-800"
                  )}
                />
              ))}
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => onUpdateDurability(-1)}
                disabled={currentDurability === 0}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-sm transition-all text-[10px] font-mono font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed mr-1",
                  "bg-red-950/50 hover:bg-red-950/70 text-red-400 border border-red-800/50"
                )}
              >
                <Flame className="w-3 h-3" />
                Урон
              </button>
              <button
                onClick={() => onUpdateDurability(1)}
                disabled={currentDurability === maxDurability}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-sm transition-all text-[10px] font-mono font-bold uppercase disabled:opacity-30 disabled:cursor-not-allowed ml-1",
                  "bg-emerald-950/50 hover:bg-emerald-950/70 text-emerald-400 border border-emerald-800/50"
                )}
              >
                <Wrench className="w-3 h-3" />
                Ремонт
              </button>
            </div>
          </div>

          {/* Speed Section */}
          <div className="relative bg-slate-950/50 p-2 rounded-sm border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 text-yellow-400">
                <Footprints className="w-2.5 h-2.5" />
                Скорость
              </span>
              <div className="text-right">
                <span className="text-lg font-mono font-black text-yellow-400">
                  {distanceInputUnit === 'cm' ? `${speed * stepToCmFactor}` : speed}
                </span>
                <span className="text-[8px] font-mono opacity-60 ml-0.5">
                  {distanceInputUnit === 'cm' ? 'см' : 'шаг'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Pilot Status Panel */}
        <div className="relative">
          {/* Pilot container */}
          <div className="relative w-[80px] h-[110px] rounded-sm overflow-hidden bg-slate-950/50 border-2 transition-all duration-300"
               style={{ borderColor: pilotInfo ? `${colors.primary}60` : `${colors.primary}20` }}>
            {/* Tech corners */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t z-10" style={{ borderColor: colors.primary }} />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t z-10" style={{ borderColor: colors.primary }} />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b z-10" style={{ borderColor: colors.primary }} />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b z-10" style={{ borderColor: colors.primary }} />

            <button
              onClick={onAssignPilot}
              className="w-full h-full relative"
            >
              {pilotInfo ? (
                <>
                  <GitHubPagesImage
                    src={pilotImage || '/images/soldiers/empty.png'}
                    width={80}
                    height={110}
                    className="w-full h-full object-cover object-center"
                    alt="Пилот"
                    unoptimized
                  />

                  {/* Status overlay */}
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 text-[7px] font-mono font-bold text-center py-0.5 border-t backdrop-blur-sm",
                    pilotInfo.alive
                      ? "bg-emerald-950/90 text-emerald-300 border-emerald-700/50"
                      : "bg-red-950/90 text-red-300 border-red-700/50"
                  )}>
                    {pilotInfo.alive ? 'ЖИВ' : 'ПОГИБ'}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                  <Plane className="w-6 h-6" />
                  <span className="text-[8px] font-mono font-bold uppercase">Пилот</span>
                </div>
              )}
            </button>

            {/* Survival Test Button - Overlay */}
            {pilotInfo && pilotInfo.alive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSurvivalTest();
                }}
                disabled={isPilotTestRunning}
                className={cn(
                  "absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 min-w-[36px] min-h-[36px] z-20",
                  isPilotTestRunning && "animate-pulse",
                  survivalTest
                    ? survivalTest.survived
                      ? "bg-green-600 border-green-900 text-white"
                      : "bg-red-600 border-red-900 text-white"
                    : isPilotTestRunning
                    ? "bg-purple-600 border-purple-900 text-white animate-spin"
                    : "bg-purple-900 border-purple-950 text-purple-300 hover:bg-purple-800 hover:scale-110"
                )}
                title={survivalTest ? `Повторить тест (последний: ${survivalTest.survived ? 'ВЫЖИЛ' : 'ПОГИБ'})` : "Тест выживаемости пилота"}
              >
                <Skull className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Pilot label */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[7px] font-mono font-bold uppercase tracking-wider opacity-50">
              Экипаж
            </span>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-full h-px" style={{
        background: `linear-gradient(90deg, transparent 0%, ${colors.primary}80 50%, transparent 100%)`
      }} />
    </div>
  );
}
