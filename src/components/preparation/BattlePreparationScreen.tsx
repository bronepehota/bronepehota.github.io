'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sword, ChevronUp, Shield, Users, Zap, Target, Timer, Flag, Clock, Crosshair, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Army, isSquad } from '@/lib/types';
import { PrepArmyList } from './PrepArmyList';
import InitiativeModal from '../modals/InitiativeModal';
import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';
import { getMission, getCampaign, getObjectiveForFaction, isFreePlay } from '@/lib/missions-registry';

interface BattlePreparationScreenProps {
  army: Army;
  setArmy: (army: Army) => void;
  onStartBattle: () => void;
  onBackToBuilder: () => void;
}

export function BattlePreparationScreen({
  army,
  setArmy,
  onStartBattle,
  onBackToBuilder: _onBackToBuilder,
}: BattlePreparationScreenProps) {
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const colors = getFactionColors(army.faction || 'polaris');

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleStartBattle = () => {
    setArmy({
      ...army,
      isInBattle: true,
      currentStep: 'battle',
      lastBattleDate: new Date().toISOString()
    });
    onStartBattle();
  };

  const activeUnitsCount = army.units.filter(unit => {
    if (isSquad(unit)) {
      return (unit.deadSoldiers?.length || 0) < unit.data.soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  const squadCount = army.units.filter(u => u.type === 'squad').length;
  const machineCount = army.units.filter(u => u.type === 'machine').length;
  const totalSoldiers = army.units.reduce((acc, u) => {
    if (isSquad(u)) {
      return acc + u.data.soldiers.length - (u.deadSoldiers?.length || 0);
    }
    return acc;
  }, 0);
  const hasUnits = army.units.length > 0;

  // Selected mission (reference only — informational, never enforced)
  const mission = isFreePlay(army.missionId) ? null : getMission(army.missionId!);
  const missionCampaign = mission ? getCampaign(mission.campaign) : undefined;
  const playerObjective = mission && army.faction
    ? getObjectiveForFaction(mission.id, army.faction)
    : undefined;

  return (
    <div className="relative min-h-screen pb-36 overflow-hidden bg-slate-950">
      {/* Animated tactical grid background */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tactical-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tactical-grid)" />
        </svg>
      </div>

      {/* Animated scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-px opacity-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
            animation: 'scanDown 4s linear infinite',
          }}
        />
        <style>{`
          @keyframes scanDown {
            0% { top: -2px; opacity: 0; }
            5% { opacity: 0.2; }
            95% { opacity: 0.2; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          @keyframes countUp {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>

      {/* Radial glow behind header */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-10 blur-3xl"
        style={{
          background: `radial-gradient(ellipse at center, ${colors.primary}, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10" data-testid="battle-preparation-screen">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header section */}
          <div
            className={cn(
              "text-center space-y-4 px-2 transition-all duration-700",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
          >
            {/* Tactical classification tag */}
            <div className="flex justify-center">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.2em]",
                "border bg-slate-900/80",
                colors.border, colors.text
              )}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }} />
                Оперативная готовность
              </div>
            </div>

            {/* Main title */}
            <h2 className="text-3xl md:text-4xl font-mono font-black uppercase tracking-wider text-white">
              Готовьте войска!
            </h2>

            <div className="max-w-md mx-auto space-y-1">
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                Расставьте миниатюры на столе и бросьте кубик инициативы.
              </p>
            </div>

            {/* Tactical stats row */}
            {hasUnits && (
              <div
                className="flex justify-center gap-4 pt-2"
                style={{
                  animation: isLoaded ? 'fadeSlideUp 0.6s ease-out 0.3s both' : 'none',
                }}
              >
                <StatChip icon={<Users className="w-3.5 h-3.5" />} value={squadCount} label="отряд" />
                <StatChip icon={<Zap className="w-3.5 h-3.5" />} value={machineCount} label="машина" />
                <StatChip icon={<Shield className="w-3.5 h-3.5" />} value={totalSoldiers} label="боец" />
                <StatChip icon={<Target className="w-3.5 h-3.5" />} value={army.totalCost} label="очков" />
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="h-px flex-1 max-w-[80px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}40)` }} />
              <Timer className="w-4 h-4 opacity-30" style={{ color: colors.primary }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ background: `linear-gradient(90deg, ${colors.primary}40, transparent)` }} />
            </div>
          </div>

          {/* Selected mission reference (informational only) */}
          {mission && (
            <div
              data-testid="mission-reference-banner"
              className="mt-2 rounded-xl border p-4"
              style={{
                borderColor: `${colors.primary}40`,
                backgroundColor: `${colors.primary}0d`,
                animation: isLoaded ? 'fadeSlideUp 0.6s ease-out 0.35s both' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: colors.primary }} />
                  <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Миссия</span>
                </div>
                {missionCampaign && (
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                    Набор сценариев «{missionCampaign.name}»
                  </span>
                )}
              </div>

              <h3 className="font-mono font-bold text-base text-white mb-2.5">
                {mission.name}
              </h3>

              <div className="flex flex-wrap gap-2 mb-3">
                <MissionStat icon={<Clock className="w-3 h-3" />} text={mission.parameters.turnCount ? `${mission.parameters.turnCount} ходов` : 'без лимита'} />
                {mission.parameters.firstMove && (
                  <MissionStat icon={<Flag className="w-3 h-3" />} text={`1-й ход: ${factionDisplayNames[mission.parameters.firstMove] ?? mission.parameters.firstMove}`} />
                )}
                {mission.parameters.rulesVariant && (
                  <MissionStat icon={<Crosshair className="w-3 h-3" />} text={mission.parameters.rulesVariant} />
                )}
              </div>

              {playerObjective ? (
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/40 p-2.5 mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: colors.primary }}>
                    Ваша задача
                  </span>
                  <p className="text-sm text-slate-300 leading-snug mt-0.5">{playerObjective.text}</p>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/40 p-2.5 mb-2">
                  <p className="text-xs text-slate-400">См. обе задачи сторон в описании миссии.</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">Справочно. Отслеживание — вручную.</span>
                <Link
                  href={`/encyclopedia/mission/${mission.id}`}
                  className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider hover:opacity-80 transition-opacity"
                  style={{ color: colors.primary }}
                >
                  Подробнее <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Army list */}
          <div style={{
            animation: isLoaded ? 'fadeSlideUp 0.6s ease-out 0.2s both' : 'none',
          }}>
            <PrepArmyList army={army} />
          </div>
        </div>

        {/* Floating "Start Battle" button */}
        <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center px-4">
          <div className="relative group" style={{ maxWidth: '400px', width: '100%' }}>
            {/* Glow behind button */}
            <div
              className="absolute -inset-1 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ backgroundColor: colors.primary, opacity: 0 }}
            />
            <div
              className="absolute -inset-0.5 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{ backgroundColor: colors.primary }}
            />

            <button
              onClick={() => {
                if (hasUnits) {
                  setShowInitiativeModal(true);
                }
              }}
              className={cn(
                "relative w-full pointer-events-auto",
                "py-4 px-6 rounded-xl",
                "flex items-center justify-center gap-3",
                "font-mono text-base md:text-lg font-bold uppercase tracking-wider",
                "transition-all duration-300",
                "border-2",
                "bg-slate-900/90 backdrop-blur-md",
                colors.border,
                colors.text,
                hasUnits && "hover:scale-[1.02] hover:bg-slate-800/90",
                hasUnits && "active:scale-[0.98]",
                "shadow-2xl",
                !hasUnits && "opacity-30 cursor-not-allowed"
              )}
              data-testid="start-battle-button"
            >
              {/* Shimmer sweep on hover */}
              {hasUnits && (
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(105deg, transparent 40%, ${colors.primary}15 45%, ${colors.primary}25 50%, ${colors.primary}15 55%, transparent 60%)`,
                      animation: 'shimmer 2s ease-in-out infinite',
                    }}
                  />
                  <style>{`
                    @keyframes shimmer {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(100%); }
                    }
                  `}</style>
                </div>
              )}

              <Sword className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Начать бой</span>
              {hasUnits && (
                <ChevronUp className="w-4 h-4 relative z-10 animate-bounce opacity-60" />
              )}
            </button>

            {/* Tooltip */}
            {hasUnits && (
              <div className={cn(
                "absolute -top-10 left-1/2 -translate-x-1/2",
                "whitespace-nowrap px-3 py-1 rounded-md",
                "bg-slate-900/95 text-slate-400 text-xs font-mono",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "border border-slate-700/50 shadow-lg",
                "pointer-events-none"
              )}>
                Бросить кубик инициативы
              </div>
            )}
          </div>
        </div>

        {/* Initiative modal */}
        <InitiativeModal
          isOpen={showInitiativeModal}
          onClose={() => setShowInitiativeModal(false)}
          onConfirm={handleStartBattle}
          factionId={army.faction || 'polaris'}
          activeUnitsCount={activeUnitsCount}
          context="preparation"
        />
      </div>
    </div>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  const suffix = value === 1 && label !== 'очков' ? '' : (label === 'очков' ? '' : '');
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/60 text-slate-400">
      <span className="opacity-50">{icon}</span>
      <span className="text-sm font-mono font-bold text-white">{value}</span>
      <span className="text-[10px] font-mono uppercase tracking-wide hidden sm:inline">{label}{suffix}</span>
    </div>
  );
}

function MissionStat({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900/60 border border-slate-800/60 text-[11px] font-mono text-slate-300">
      <span className="opacity-60">{icon}</span>
      {text}
    </span>
  );
}
