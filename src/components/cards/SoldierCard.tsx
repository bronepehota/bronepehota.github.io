'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { SoldierActions } from './soldier-card/SoldierActions';
import { SoldierStats } from './soldier-card/SoldierStats';
import { SoldierImage } from './soldier-card/SoldierImage';
import { SoldierDoneButton } from './soldier-card/SoldierDoneButton';
import StatusStripe, { type SoldierState } from './soldier-card/StatusStripe';
import { useCardSwipe } from '@/hooks/useCardSwipe';
import { cn } from '@/lib/utils';
import type { Squad, ArmyUnit, Army } from '@/lib/types';
import { collectBuffsForUnit, getSoldierModifiers, resolveModifierSummary, isModifierActive } from '@/lib/modifier-utils';
import { getSourceWithCustom } from '@/lib/sources-registry';
import { withClassicProps } from '@/lib/classic-props';

interface SoldierCardProps {
  squad: Squad;
  unit: ArmyUnit;
  soldierIndex: number;
  allUnits: ArmyUnit[];
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
  getSoldierImage: (idx: number) => string;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  onNavigateToUnit?: (instanceId: string) => void;
  onSoldierModifierClick?: (unitId: string, soldierIndex: number, soldierName: string) => void;
  sourceId?: string;
  currentTurn?: number;
  hideArmor?: boolean;
  hideSpeed?: boolean;
}

function SoldierCard({
  squad,
  unit,
  soldierIndex,
  allUnits: _allUnits,
  updateUnit,
  onSoldierAction,
  setShowSoldierImage,
  getSoldierImage,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  onNavigateToUnit,
  onSoldierModifierClick,
  sourceId,
  currentTurn,
  hideArmor = false,
  hideSpeed = false,
}: SoldierCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressProgressRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const soldier = squad.soldiers[soldierIndex];
  const isDead = unit.deadSoldiers?.includes(soldierIndex) || false;
  const isDone = unit.actionsUsed?.[soldierIndex]?.done || false;
  const isInPanic = unit.panicState?.some(p => p.soldierIndex === soldierIndex) || false;

  // Determine stripe state
  const getStripeState = (): SoldierState => {
    if (isDead) return 'dead';
    if (isInPanic) return 'panic';
    if (isDone) return 'done';
    return 'active';
  };

  const startLongPress = (callback: () => void) => {
    // Don't show progress bar immediately - wait 100ms first
    const progressDelay = 100;

    // Start the long-press timer (600ms for cancel)
    longPressTimerRef.current = setTimeout(() => {
      callback();
      setIsLongPressing(false);
      setLongPressProgress(1);
      if (longPressProgressRef.current) {
        clearInterval(longPressProgressRef.current);
      }
    }, 600);

    // Show progress bar only after 100ms of holding
    longPressProgressRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setLongPressProgress(0);

      // Start progress animation
      let progress = progressDelay / 600; // Start at 100/600 = ~17%
      const progressInterval = setInterval(() => {
        progress += 0.05;
        if (progress >= 1) {
          progress = 1;
          clearInterval(progressInterval);
        }
        setLongPressProgress(progress);
      }, 30);

      // Store interval ID for cleanup
      progressIntervalRef.current = progressInterval;
    }, progressDelay);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressRef.current) {
      clearTimeout(longPressProgressRef.current);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      longPressProgressRef.current = null;
    }
    setIsLongPressing(false);
    setLongPressProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (longPressProgressRef.current) clearInterval(longPressProgressRef.current);
    };
  }, []);

  const handleToggleAction = () => {
    // Use explicit instanceId to avoid updating all units
    updateUnit(unit.instanceId, (currentUnit: ArmyUnit) => {
      const newActions = [...(currentUnit.actionsUsed || [])];
      const currentDone = newActions[soldierIndex]?.done || false;

      if (currentDone) {
        // Untoggling "done" - reset all actions
        newActions[soldierIndex] = {
          moved: false,
          shot: false,
          melee: false,
          done: false
        };
      } else {
        newActions[soldierIndex] = {
          ...newActions[soldierIndex],
          done: true
        };
      }
      return { ...currentUnit, actionsUsed: newActions };
    });
  };

  const handleToggleDead = () => {
    updateUnit(unit.instanceId, (currentUnit: ArmyUnit) => {
      const currentDead = currentUnit.deadSoldiers || [];
      const newDead = currentDead.includes(soldierIndex)
        ? currentDead.filter(i => i !== soldierIndex)
        : [...currentDead, soldierIndex];
      return { ...currentUnit, deadSoldiers: newDead };
    });
  };

  // Check if this soldier is a pilot
  const isPilot = soldier.isPilot || false;

  // Свайп по карточке (плейтест): влево — «готов», вправо — «убит».
  // Гейтинг как у кнопок: паникующий/мёртвый не может завершить ход
  // (правила §10 — можно быть уничтоженным, но нельзя действовать);
  // убить в панике можно, поэтому вправо не гейтим.
  const swipe = useCardSwipe({
    onSwipeLeft: () => {
      if (!isDead && !isInPanic) handleToggleAction();
    },
    onSwipeRight: handleToggleDead,
  });

  // Compute modifier counts for the modifier indicator
  const { buffCount, debuffCount, soldierModifiers, staticAbilities, availableBuffCount, statBonuses } = useMemo(() => {
    // Build a minimal army-like structure from allUnits for buff collection
    const armyLike: Army = { name: '', totalCost: 0, units: _allUnits, currentTurn };
    // Count buffs across ALL phases (not just shot)
    const shotBuffs = collectBuffsForUnit(unit, armyLike, 'shot');
    const meleeBuffs = collectBuffsForUnit(unit, armyLike, 'melee');
    const alwaysBuffs = collectBuffsForUnit(unit, armyLike, 'always');
    // Спец-свойства (Пр4, Рм — target 'custom') в счётчик баффов кнопки не
    // идут: это способности, они показываются отдельным чипом на кнопке
    // (плейтест: «на кнопке 1 бафов — хочется Пр4»)
    const allBuffIds = new Set(
      [...shotBuffs, ...meleeBuffs, ...alwaysBuffs]
        .filter(b => b.target !== 'custom')
        .map(b => b.id)
    );
    // Filter debuffs by expiry (includes unit-level debuffs + per-soldier debuffs from modal)
    const unitDebuffs = (unit.activeDebuffs || []).filter(d =>
      isModifierActive(d.appliedAtTurn, d.duration, currentTurn)
    );
    const soldierMods = getSoldierModifiers(unit, soldierIndex, armyLike);
    const soldierDebuffs = soldierMods.filter(m => m.value < 0);
    const debuffs = [...unitDebuffs, ...soldierDebuffs];
    // Resolve buffs: only squad-level (set via editor), no catalog fallback.
    // Классические спец-свойства (Пр4/Пр5/Рм) выводим из каталога по
    // названию взвода — в данных не дублируем (classic-props.ts)
    const sourceData = sourceId ? getSourceWithCustom(sourceId) : null;
    const liveSquad = sourceData?.squads.find(s => s.id === squad.id);
    const templateBuffs = withClassicProps(liveSquad?.buffs || squad.buffs, squad.name);
    const available = templateBuffs
      .filter((b: any) => b.applyTo?.includes('soldier')).length;

    // Классические спец-свойства взвода (Пр4, Рм — каталог standard-modifiers):
    // показываем на кнопке модификаторов. Разовые скрываем после траты —
    // ЛЮБОЙ из двух путей: взводный buffsUsed ИЛИ по-бойцовый
    // soldierAbilitiesUsed «<id>_<i>» (модал «Способности»). Иначе у бойца,
    // использовавшего Пр4, иконка дублировалась (статическая + применённая).
    const buffsUsed = new Set(unit.buffsUsed || []);
    const abilitiesUsed = new Set(unit.soldierAbilitiesUsed || []);
    const staticAbilities = templateBuffs
      .filter((b: any) => b.applyTo?.includes('soldier') && !(
        b.oneTimeUse && (buffsUsed.has(b.id) || abilitiesUsed.has(`${b.id}_${soldierIndex}`))
      ));

    // Compute stat bonuses for display (merge shot + melee + always phases)
    const shotSummary = resolveModifierSummary(unit, armyLike, 'shot', soldierIndex);
    const meleeSummary = resolveModifierSummary(unit, armyLike, 'melee', soldierIndex);
    const alwaysSummary = resolveModifierSummary(unit, armyLike, 'always', soldierIndex);

    const statBonuses = {
      rangeBonus: shotSummary.rangeBonus,
      powerBonus: shotSummary.powerBonus,
      meleeBonus: meleeSummary.meleeBonus,
      armorBonus: alwaysSummary.armorBonus,
      speedMultiplier: alwaysSummary.speedMultiplier !== 1 ? alwaysSummary.speedMultiplier : undefined,
    };

    return { buffCount: allBuffIds.size, debuffCount: debuffs.length, soldierModifiers: soldierMods, staticAbilities, availableBuffCount: available, statBonuses };
  }, [unit, _allUnits, soldierIndex, squad.buffs, squad.id, sourceId, currentTurn]);

  return (
    <div
      data-testid="soldier-card"
      data-soldier-index={soldierIndex}
      {...swipe.handlers}
      style={swipe.style}
      className={cn(
        "relative p-1 md:p-1.5 rounded-sm border flex items-center gap-1.5 md:gap-2 transition-all overflow-hidden flex-1 touch-pan-y",
        isDead ? "bg-slate-950/80 border-slate-800 opacity-40 grayscale" :
        isDone ? "bg-slate-900/40 border-slate-700/50 opacity-90" : "bg-slate-800/30 border-slate-700/50",
        isPilot && !isDead ? "border-cyan-700/40" : ""
      )}
    >
      {/* Status stripe */}
      <StatusStripe state={getStripeState()} />

      {/* Progress bar during long-press */}
      {isLongPressing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-75"
            style={{ width: `${longPressProgress * 100}%` }}
          />
        </div>
      )}

      {/* Tech corners for pilot */}
      {isPilot && !isDead && (
        <>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500/40" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500/40" aria-hidden="true" />
        </>
      )}

      {/* Soldier image (left side) with the «Готов» button overlaid bottom-left.
          Hidden for pilots (nav button replaces actions) and panic (no DONE). */}
      {/* self-stretch + кап: фото растёт с высотой строки (взвод заполняет
          экран, пол — прежний размер). Потолок min(224px, 40vw) единый на
          всех вьюпортах: после удаления кнопки «череп» (правая колонка
          ~44px ушла статам) ячейка на 320px выросла до ~59px и длинные
          кубы (D12+2, 1D20+2) влезают без узкого 34vw-кэпа (замер
          320/375/390 — переполнений нет). Кап на обёртке, не на фото:
          чип «ГОТОВ» остаётся у низа фото. */}
      <div className="relative shrink-0 self-stretch max-h-[min(224px,40vw)]">
        <SoldierImage
          imageUrl={getSoldierImage(soldierIndex)}
          soldierIndex={soldierIndex}
          isDead={isDead}
          isInPanic={isInPanic}
          isMounted={isMounted}
          isPilot={isPilot}
          onImageClick={() => setShowSoldierImage(soldierIndex)}
        />
        {!(soldier.isPilot && soldier.pilotOfInstanceId && onNavigateToUnit) && !isInPanic && (
          <SoldierDoneButton
            isDone={isDone}
            isDead={isDead}
            soldierIndex={soldierIndex}
            onToggleDone={handleToggleAction}
            onStartLongPress={startLongPress}
            onEndLongPress={cancelLongPress}
            isLongPressing={isLongPressing}
            className="absolute bottom-0 right-0 z-10"
          />
        )}
      </div>

      {/* Stats (center - clickable for action) */}
      <SoldierStats
        soldier={soldier}
        distanceInputUnit={distanceInputUnit}
        stepToCmFactor={stepToCmFactor}
        disabled={isDone || isDead || isInPanic}
        onClick={() => onSoldierAction(soldierIndex)}
        className="flex-1 min-w-0"
        buffCount={buffCount}
        debuffCount={debuffCount}
        soldierModifiers={soldierModifiers}
        staticAbilities={staticAbilities}
        availableBuffCount={availableBuffCount}
        onModifierClick={onSoldierModifierClick ? () => onSoldierModifierClick(unit.instanceId, soldierIndex, `#${soldier.num || soldierIndex + 1}`) : undefined}
        statBonuses={statBonuses}
        hideArmor={hideArmor}
        hideSpeed={hideSpeed}
      />

      {/* Правая колонка — только особые состояния (пилот / паника); убить —
          свайп вправо, кнопки «череп» больше нет (решение владельца) */}
      <SoldierActions
        isDead={isDead}
        isInPanic={isInPanic}
        isPilot={soldier.isPilot || false}
        onNavigateToMachine={soldier.pilotOfInstanceId ? () => onNavigateToUnit?.(soldier.pilotOfInstanceId!) : undefined}
      />
    </div>
  );
}

// Memoize SoldierCard to prevent unnecessary re-renders
// Custom comparison checks soldier-specific state to avoid re-rendering all cards when any soldier updates
export default memo(SoldierCard, (prevProps, nextProps) => {
  const prevIsDead = prevProps.unit.deadSoldiers?.includes(prevProps.soldierIndex) || false;
  const nextIsDead = nextProps.unit.deadSoldiers?.includes(nextProps.soldierIndex) || false;
  const prevIsDone = prevProps.unit.actionsUsed?.[prevProps.soldierIndex]?.done || false;
  const nextIsDone = nextProps.unit.actionsUsed?.[nextProps.soldierIndex]?.done || false;
  const prevIsInPanic = prevProps.unit.panicState?.some(p => p.soldierIndex === prevProps.soldierIndex) || false;
  const nextIsInPanic = nextProps.unit.panicState?.some(p => p.soldierIndex === nextProps.soldierIndex) || false;

  return (
    prevProps.soldierIndex === nextProps.soldierIndex &&
    prevProps.squad === nextProps.squad &&
    prevProps.allUnits === nextProps.allUnits &&
    prevIsDead === nextIsDead &&
    prevIsDone === nextIsDone &&
    prevIsInPanic === nextIsInPanic &&
    prevProps.unit.activeDebuffs === nextProps.unit.activeDebuffs &&
    prevProps.unit.activeBuffs === nextProps.unit.activeBuffs &&
    prevProps.unit.soldierModifiers === nextProps.unit.soldierModifiers &&
    prevProps.onNavigateToUnit === nextProps.onNavigateToUnit &&
    prevProps.onSoldierModifierClick === nextProps.onSoldierModifierClick &&
    prevProps.currentTurn === nextProps.currentTurn &&
    prevProps.hideArmor === nextProps.hideArmor &&
    prevProps.hideSpeed === nextProps.hideSpeed
  );
});
