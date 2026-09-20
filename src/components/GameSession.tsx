'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Army, ArmyUnit, Squad, Machine, PilotInfo } from '@/lib/types';
import { resolvePanic } from '@/lib/panic-logic';
import { cleanupExpiredModifiers, getAllDebuffs, resolveSoldierEffects, collectActiveBuffsForUnit, collectDebuffsForUnit, collectBuffsForUnit } from '@/lib/modifier-utils';
import { getSourceWithCustom } from '@/lib/sources-registry';
import { getMission, isFreePlay } from '@/lib/missions-registry';
import { SoldierEffectsModal } from './modals/SoldierEffectsModal';
import { getFactionColors } from '@/lib/faction-colors';
import { trackEvent } from '@/lib/analytics';
import UnitCard from './cards/UnitCard';
import { History, X, Bomb, Heart, Shield, Footprints, CheckCircle2, MoreVertical, BookOpen, RotateCcw, MessageCircle, Target, Users, LayoutGrid, GraduationCap, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CombatLogEntry } from '@/lib/combat-types';
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';
import InitiativeModal from './modals/InitiativeModal';
import { ExpandedNavigator, BattleTutorial } from './GameSession/index';
import { useWakeLock } from '@/hooks/useWakeLock';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { checkSquadUniformStats, getAliveSoldiersCount, countUnitsByStatus } from '@/lib/unit-utils';
import { deriveUnitStatus, UnitStatus } from '@/lib/unit-status';
import { resolveModifierSummary } from '@/lib/modifier-utils';

interface GameSessionProps {
  army: Army;
  setArmy: (army: Army) => void;
  isInBattle?: boolean;
  onEndBattle?: () => void;
  onInitiativeTriggerRef?: (trigger: () => void) => void;
  showCombatLog?: boolean;
  setShowCombatLog?: (show: boolean) => void;
  strictPilotRankEnabled?: boolean;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  autoCompleteEnabled?: boolean;
  // New props for external action control
  triggerOpenEncyclopedia?: boolean;
  onToggleUnitDoneRef?: (trigger: () => void) => void;
  // Callback to report current unit state
  onCurrentUnitChange?: (unit: ArmyUnit | null, isDone: boolean, isDead: boolean) => void;
}

export default function GameSession({
  army,
  setArmy,
  isInBattle: _isInBattle,
  onEndBattle,
  onInitiativeTriggerRef,
  showCombatLog,
  setShowCombatLog,
  strictPilotRankEnabled = true,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  autoCompleteEnabled = true,
  triggerOpenEncyclopedia = false,
  onToggleUnitDoneRef,
  onCurrentUnitChange,
}: GameSessionProps) {
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [showTurnConfirmation, setShowTurnConfirmation] = useState(false);
  const [focusedUnitIdx, setFocusedUnitIdx] = useState(0);
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  const [triggerEncyclopediaOpen, setTriggerEncyclopediaOpen] = useState(false);
  const [effectsModalState, setEffectsModalState] = useState<{
    unitId: string;
    soldierIndex: number;
    soldierName: string;
  } | null>(null);
  const [showDockMenu, setShowDockMenu] = useState(false);

  // Close dock menu on outside click. Клик внутри меню (data-dock-menu-root —
  // напр. тумблер «Не гаснуть») меню не закрывает: пункты, закрывающие меню,
  // зовут setShowDockMenu(false) сами.
  useEffect(() => {
    if (!showDockMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-dock-menu-root]')) return;
      setShowDockMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showDockMenu]);

  // Soldier-applicable debuffs from catalog (buffs & abilities come from getAllBuffs)
  const { soldierDebuffs } = useMemo(() => {
    return {
      soldierDebuffs: getAllDebuffs().filter(d => d.applyTo.includes('soldier')),
    };
  }, []);
  const { clearAllMemory } = useCombatTargetContext();

  // Keep ref to current army for immediate access in updateUnit
  const armyRef = useRef(army);
  useEffect(() => {
    armyRef.current = army;
  }, [army]);

  const updateUnit = (
    arg1: string | ArmyUnit | ((currentUnit: ArmyUnit) => ArmyUnit),
    arg2?: (currentUnit: ArmyUnit) => ArmyUnit
  ) => {
    // Three API styles supported:
    // 1. updateUnit(instanceId, updateFn) - functional update with explicit instanceId
    // 2. updateUnit(armyUnit) - direct update with unit object (backward compatibility)
    // 3. updateUnit(updateFn) - NOT SUPPORTED (causes bug where all units get updated)

    let targetInstanceId: string;
    let updatedUnit: ArmyUnit | undefined;

    if (typeof arg1 === 'string') {
      // Style 1: updateUnit(instanceId, updateFn)
      targetInstanceId = arg1;
      // Apply update function only to matching unit
      const newArmy = {
        ...armyRef.current,
        lastBattleDate: new Date().toISOString(), // Update last activity time
        units: armyRef.current.units.map(u =>
          u.instanceId === targetInstanceId ? arg2!(u) : u
        )
      };
      armyRef.current = newArmy;
      setArmy(newArmy);
      return;
    } else if (typeof arg1 === 'function') {
      // Style 3: updateUnit(updateFn) - find the unit by trying the function
      // This is called from SoldierCard with closure-captured soldierIndex
      // We need to find which unit actually changed
      const newArmy = {
        ...armyRef.current,
        lastBattleDate: new Date().toISOString(), // Update last activity time
        units: armyRef.current.units.map(u => {
          const result = arg1(u);
          // The function adds/removes the captured soldierIndex from deadSoldiers
          // Only the matching unit will have a different deadSoldiers array
          const deadChanged = JSON.stringify(u.deadSoldiers) !== JSON.stringify(result.deadSoldiers);
          const actionsChanged = JSON.stringify(u.actionsUsed) !== JSON.stringify(result.actionsUsed);
          return (deadChanged || actionsChanged) ? result : u;
        })
      };
      armyRef.current = newArmy;
      setArmy(newArmy);
      return;
    } else {
      // Style 2: updateUnit(armyUnit) - direct update
      targetInstanceId = arg1.instanceId;
      updatedUnit = arg1;
    }

    // Direct update path
    const newArmy = {
      ...armyRef.current,
      lastBattleDate: new Date().toISOString(), // Update last activity time
      units: armyRef.current.units.map(u => u.instanceId === targetInstanceId ? updatedUnit! : u)
    };
    armyRef.current = newArmy;
    setArmy(newArmy);
  };

  // Calculate initiative - opens the initiative modal
  const calculateInitiative = useCallback(() => {
    setShowInitiativeModal(true);
  }, []);

  // Expose trigger function to parent via callback ref
  useEffect(() => {
    if (onInitiativeTriggerRef) {
      onInitiativeTriggerRef(calculateInitiative);
    }
  }, [calculateInitiative, onInitiativeTriggerRef]);

  // Combat log visibility - controlled by parent with stable fallback
  const noOp = useMemo(() => () => {}, []);
  const combatLogVisible = showCombatLog ?? false;
  const setCombatLogVisible = setShowCombatLog ?? noOp;

  // Combat log state
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);

  // Handle pilot assignment - updates both machine and squad
  const handlePilotAssign = useCallback((machineInstanceId: string, pilotInfo: PilotInfo) => {
    const updatedUnits = army.units.map((unit: ArmyUnit) => {
      // Update the machine with pilot info
      if (unit.instanceId === machineInstanceId) {
        return { ...unit, pilotInfo };
      }
      // Update the squad soldier as pilot
      if (unit.instanceId === pilotInfo.squadInstanceId && unit.type === 'squad') {
        const updatedSoldiers = [...(unit.data as Squad).soldiers];
        updatedSoldiers[pilotInfo.soldierIndex] = {
          ...updatedSoldiers[pilotInfo.soldierIndex],
          isPilot: true,
          pilotOfInstanceId: machineInstanceId,
        };
        return { ...unit, data: { ...unit.data, soldiers: updatedSoldiers } };
      }
      return unit;
    });
    setArmy({ ...army, units: updatedUnits });
  }, [army, setArmy]);

  // Handle pilot removal - clears pilot from both machine and squad
  const handlePilotRemove = useCallback((machineInstanceId: string) => {
    // Find the machine to get pilot info before clearing
    const machine = army.units.find((u: ArmyUnit) => u.instanceId === machineInstanceId);
    if (!machine?.pilotInfo) return;

    const updatedUnits = army.units.map((unit: ArmyUnit) => {
      // Clear pilot info from machine
      if (unit.instanceId === machineInstanceId) {
        const { pilotInfo: _pilotInfo, ...unitWithoutPilot } = unit;
        return unitWithoutPilot;
      }
      // Clear pilot status from squad soldier
      if (unit.instanceId === machine.pilotInfo!.squadInstanceId && unit.type === 'squad') {
        const updatedSoldiers = [...(unit.data as Squad).soldiers];
        updatedSoldiers[machine.pilotInfo!.soldierIndex] = {
          ...updatedSoldiers[machine.pilotInfo!.soldierIndex],
          isPilot: false,
          pilotOfInstanceId: undefined,
        };
        return { ...unit, data: { ...unit.data, soldiers: updatedSoldiers } };
      }
      return unit;
    });
    setArmy({ ...army, units: updatedUnits });
  }, [army, setArmy]);

  // #168: Append a captured machine to the army. Uses armyRef.current (not closure
  // army) so that the immediately-following updateUnit() call in handleCaptureConfirm
  // sees the new machine — otherwise React 18 batching + stale closure would overwrite.
  const handleCaptureMachine = useCallback((newMachine: ArmyUnit) => {
    const newArmy = { ...armyRef.current, units: [...armyRef.current.units, newMachine] };
    armyRef.current = newArmy;
    setArmy(newArmy);
  }, [setArmy]);

  // Handle navigation to a specific unit
  const handleNavigateToUnit = useCallback((unitInstanceId: string) => {
    const targetIdx = army.units.findIndex((u: ArmyUnit) => u.instanceId === unitInstanceId);
    if (targetIdx !== -1) {
      setFocusedUnitIdx(targetIdx);
    }
  }, [army.units]);

  const handleCombatLogEntry = (entry: CombatLogEntry) => {
    setCombatLog(prev => [entry, ...prev]);
  };

  // Helper to count incomplete (active) units
  const getIncompleteUnits = () => {
    return army.units.filter(unit => {
      if (unit.type === 'squad') {
        const squad = unit.data as Squad;
        // Check if any alive soldier is not done
        return squad.soldiers.some((_, idx) => {
          const isDead = unit.deadSoldiers?.includes(idx);
          const isDone = unit.actionsUsed?.[idx]?.done;
          return !isDead && !isDone;
        });
      } else {
        // Machine is incomplete if not done
        return !unit.isMachineDone && (unit.currentDurability || 0) > 0;
      }
    });
  };

  const startNewTurn = () => {
    const incompleteUnits = getIncompleteUnits();
    if (incompleteUnits.length > 0) {
      setShowTurnConfirmation(true);
    } else {
      setShowInitiativeModal(true);
    }
  };

  const onTurnConfirmed = () => {
    setShowTurnConfirmation(false);
    setShowInitiativeModal(true);
  };

  const confirmStartNewTurn = () => {
    // Сброс памяти параметров цели при начале нового тура
    clearAllMemory();

    const newTurn = (army.currentTurn || 1) + 1;

    trackEvent('battle_turn', { turn: newTurn, faction: army.faction });
    if (newTurn === 2) {
      trackEvent('battle_engaged', { faction: army.faction });
    }

    // Create army with new turn value first
    const armyWithNewTurn = {
      ...army,
      currentTurn: newTurn,
    };

    // Remove expired modifiers
    const cleanedArmy = cleanupExpiredModifiers(armyWithNewTurn);

    setArmy({
      ...cleanedArmy,
      units: cleanedArmy.units.map(u => {
        // Resolve panic at the start of new turn
        const unitWithoutPanic = resolvePanic(u, newTurn);

        if (u.type === 'squad') {
          return {
            ...unitWithoutPanic,
            actionsUsed: (u.data as Squad).soldiers.map(() => ({ moved: false, shot: false, melee: false, done: false }))
          };
        } else {
          return {
            ...unitWithoutPanic,
            isMachineMoved: false,
            isMachineShot: false,
            isMachineMelee: false,
            isMachineDone: false,
            machineShotsUsed: 0,
            machineWeaponShots: {}
          };
        }
      })
    });
    setShowInitiativeModal(false);
    setShowTurnConfirmation(false);
    setFocusedUnitIdx(0);
  };

  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as Squad).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  // Helper to check if unit is active (not done and not dead)
  const isUnitActive = useCallback((unit: ArmyUnit) => {
    const isSquad = unit.type === 'squad';
    const isDead = isSquad
      ? (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length
      : (unit.currentDurability || 0) === 0;
    const isDone = isSquad
      ? (unit.data as Squad).soldiers.every((_, idx) => unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done)
      : unit.isMachineDone;

    return !isDead && !isDone;
  }, []);

  // Helper to check unit status
  const getUnitStatus = useCallback((unit: ArmyUnit) => {
    const isSquad = unit.type === 'squad';
    const isDead = isSquad
      ? (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length
      : (unit.currentDurability || 0) === 0;
    const isDone = isSquad
      ? (unit.data as Squad).soldiers.every((_, idx) => unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done)
      : unit.isMachineDone;
    return { isDead, isDone };
  }, []);

  // Keep ref to onCurrentUnitChange to avoid useEffect dependency on unstable callback
  const onCurrentUnitChangeRef = useRef(onCurrentUnitChange);
  onCurrentUnitChangeRef.current = onCurrentUnitChange;

  // Notify parent about current unit changes
  useEffect(() => {
    if (onCurrentUnitChangeRef.current && army.units.length > 0 && focusedUnitIdx < army.units.length) {
      const currentUnit = army.units[focusedUnitIdx];
      const { isDead, isDone } = getUnitStatus(currentUnit);
      onCurrentUnitChangeRef.current(currentUnit, isDone ?? false, isDead);
    }
  }, [focusedUnitIdx, army.units, getUnitStatus]);

  // Handle encyclopedia trigger from parent
  useEffect(() => {
    if (triggerOpenEncyclopedia && army.units.length > 0 && focusedUnitIdx < army.units.length) {
      setTriggerEncyclopediaOpen(true);
      setTimeout(() => setTriggerEncyclopediaOpen(false), 100);
    }
  }, [triggerOpenEncyclopedia, army.units, focusedUnitIdx]);

  // Get indices of active units only
  const activeUnitIndices = useCallback(() => {
    return army.units.map((u, idx) => isUnitActive(u) ? idx : -1).filter(idx => idx !== -1);
  }, [army.units, isUnitActive]);

  const nextUnit = useCallback(() => {
    const activeIndices = activeUnitIndices();
    if (activeIndices.length === 0) return;
    const currentIdx = activeIndices.indexOf(focusedUnitIdx);
    const nextIdx = currentIdx === -1 ? activeIndices[0] : activeIndices[(currentIdx + 1) % activeIndices.length];
    setFocusedUnitIdx(nextIdx);
  }, [focusedUnitIdx, activeUnitIndices]);

  const prevUnit = useCallback(() => {
    const activeIndices = activeUnitIndices();
    if (activeIndices.length === 0) return;
    const currentIdx = activeIndices.indexOf(focusedUnitIdx);
    const prevIdx = currentIdx === -1 ? activeIndices[0] : activeIndices[(currentIdx - 1 + activeIndices.length) % activeIndices.length];
    setFocusedUnitIdx(prevIdx);
  }, [focusedUnitIdx, activeUnitIndices]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevUnit();
      if (e.key === 'ArrowRight') nextUnit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextUnit, prevUnit]);

  // Жест «потянуть» для дока и листа навигатора: короткий свайп вверх в
  // ЛЮБОМ месте дока открывает навигатор, потягивание вниз за ручку листа —
  // закрывает (плейтест: «должно легко переключаться — паршиво работало»:
  // старый порог читался из устаревшего замыкания и почти не срабатывал).
  // Клик без движения жестом не считается; после настоявшегося жеста клик
  // гасится — свайп, начатый на кнопке «Готов», не отмечает бойца.
  const startDragGesture = useCallback((open: boolean, startY: number) => {
    let up = 0, down = 0, moved = false;
    const track = (y: number) => {
      const diff = startY - y; // вверх — плюс
      if (Math.abs(diff) > 8) moved = true;
      if (diff > up) up = diff;
      if (-diff > down) down = -diff;
    };
    const mouseMove = (e: MouseEvent) => track(e.clientY);
    const touchMove = (e: TouchEvent) => { if (e.touches[0]) track(e.touches[0].clientY); };
    const end = () => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', end);
      if (moved) {
        const swallow = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
        document.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 400);
      }
      if (!open && up > 60) setIsDockExpanded(true);
      if (open && down > 40) setIsDockExpanded(false);
    };
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', touchMove, { passive: true });
    document.addEventListener('touchend', end);
  }, []);

  const toggleDockExpanded = useCallback(() => {
    setIsDockExpanded(prev => !prev);
  }, []);

  // Handle toggle done for current unit - called from header button
  const handleToggleUnitDone = useCallback(() => {
    if (army.units.length === 0 || focusedUnitIdx >= army.units.length) return;

    const currentUnit = army.units[focusedUnitIdx];
    const { isDone } = getUnitStatus(currentUnit);
    const newDoneState = !isDone;

    if (currentUnit.type === 'squad') {
      // Toggle all alive soldiers. Built over soldiers.length — a seeded or
      // legacy unit may carry a shorter/empty actionsUsed array, and mapping
      // over THAT silently marks nobody done (the toggle became a no-op).
      const squad = currentUnit.data as Squad;
      const prevActions = currentUnit.actionsUsed;
      const newActions = squad.soldiers.map((_, idx) => {
        const existing = prevActions?.[idx] ?? { moved: false, shot: false, melee: false, done: false };
        if (currentUnit.deadSoldiers?.includes(idx)) return existing;
        return { ...existing, done: newDoneState };
      });
      setArmy({
        ...army,
        units: army.units.map(u => u.instanceId === currentUnit.instanceId ? { ...u, actionsUsed: newActions } : u)
      });
    } else {
      // Toggle machine done
      setArmy({
        ...army,
        units: army.units.map(u => u.instanceId === currentUnit.instanceId ? { ...u, isMachineDone: newDoneState } : u)
      });

      // Also update pilot's done state if exists
      if (currentUnit.pilotInfo) {
        const pilotSquad = army.units.find(u => u.instanceId === currentUnit.pilotInfo?.squadInstanceId);
        if (pilotSquad && pilotSquad.type === 'squad') {
          const soldierIndex = currentUnit.pilotInfo.soldierIndex;
          setArmy({
            ...army,
            units: army.units.map(u => {
              if (u.instanceId === pilotSquad.instanceId) {
                const newActions = [...(u.actionsUsed || [])];
                newActions[soldierIndex] = { ...newActions[soldierIndex], done: newDoneState };
                return { ...u, actionsUsed: newActions };
              }
              if (u.instanceId === currentUnit.instanceId) {
                return { ...u, isMachineDone: newDoneState };
              }
              return u;
            })
          });
        }
      }
    }
  }, [army, focusedUnitIdx, getUnitStatus, setArmy]);

  // Expose toggle done to parent via callback ref
  useEffect(() => {
    if (onToggleUnitDoneRef) {
      onToggleUnitDoneRef(handleToggleUnitDone);
    }
  }, [handleToggleUnitDone, onToggleUnitDoneRef]);

  // Auto-open the navigator when the FOCUSED unit's turn ends by any path:
  // dock «Готов», combat auto-complete of the last alive soldier, machine
  // destruction, capture toggle. Focused-only — Side-A capture appends a
  // foreign ACTIVE machine that must not trigger this. Skipped when no
  // active units remain: the floating «Завершить тур» button takes over.
  // The baseline map advances on every run, so a new turn / «Отмена»
  // (done→active, wrong direction) and army reloads never fire.
  const prevStatusesRef = useRef<Map<string, UnitStatus> | null>(null);
  useEffect(() => {
    if (army.units.length === 0) {
      prevStatusesRef.current = null;
      return;
    }
    const statuses = new Map(army.units.map(u => [u.instanceId, deriveUnitStatus(u)]));
    const prev = prevStatusesRef.current;
    prevStatusesRef.current = statuses;
    if (!prev) return; // first army load — record the baseline only

    const focused = army.units[focusedUnitIdx];
    if (!focused) return;
    const before = prev.get(focused.instanceId);
    const now = statuses.get(focused.instanceId);
    if (before === 'active' && (now === 'done' || now === 'dead' || now === 'captured')) {
      const anyActive = army.units.some(u => statuses.get(u.instanceId) === 'active');
      if (anyActive) setIsDockExpanded(true);
    }
  }, [army.units, focusedUnitIdx]);

  const factionColors = getFactionColors(army.faction || 'polaris');

  // «Не гаснуть» для игры за столом (плейтест: телефон лежит на столе,
  // ход длятся минутами — лок между ходами мешает). Флаг персистится.
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const wakeLock = useWakeLock(wakeLockEnabled);
  useEffect(() => {
    setWakeLockEnabled(localStorage.getItem(LOCAL_STORAGE_KEYS.WAKE_LOCK_ENABLED) === '1');
  }, []);
  const handleToggleWakeLock = () => {
    const next = !wakeLockEnabled;
    setWakeLockEnabled(next);
    localStorage.setItem(LOCAL_STORAGE_KEYS.WAKE_LOCK_ENABLED, next ? '1' : '0');
  };

  // «Боевой инструктаж» — однократно при первом заходе в бой со взводом
  // (интерактивные свайпы на демо-карточке + подсказка про СПИСОК)
  const [showBattleTutorial, setShowBattleTutorial] = useState(false);
  const hasSquadUnit = army.units.some(u => u.type === 'squad');
  useEffect(() => {
    if (!hasSquadUnit) return;
    if (localStorage.getItem(LOCAL_STORAGE_KEYS.BATTLE_TUTORIAL_DONE) === '1') return;
    setShowBattleTutorial(true);
  }, [hasSquadUnit]);
  // GitHubPagesImage сам префиксует BASE_PATH для /images/
  const tutorialImage = (() => {
    if (!showBattleTutorial) return undefined;
    const squadUnit = army.units.find(u => u.type === 'squad');
    if (!squadUnit) return undefined;
    return (squadUnit.data as Squad).soldiers[0]?.image || squadUnit.data.image || undefined;
  })();
  const selectedMission = isFreePlay(army.missionId) ? null : getMission(army.missionId!) ?? null;

  // Compute uniform stats for focused squad unit
  const focusedUnit = army.units[focusedUnitIdx];
  const squadUniformStats = useMemo(() => {
    const unit = army.units[focusedUnitIdx];
    if (!unit || unit.type !== 'squad') {
      return { isUniformArmor: false, isUniformSpeed: false };
    }
    return checkSquadUniformStats(unit);
  }, [army.units, focusedUnitIdx]);

  const hideArmorForUnit = squadUniformStats.isUniformArmor && squadUniformStats.isUniformSpeed;
  const hideSpeedForUnit = hideArmorForUnit;

  // Compute squad-level modifier bonuses for dock bar display
  const squadDockBonuses = useMemo(() => {
    if (!focusedUnit || focusedUnit.type !== 'squad' || !hideArmorForUnit) {
      return { armorBonus: undefined, speedMultiplier: undefined };
    }
    const summary = resolveModifierSummary(focusedUnit, army, 'always');
    return {
      armorBonus: summary.armorBonus || undefined,
      speedMultiplier: summary.speedMultiplier !== 1 ? summary.speedMultiplier : undefined,
    };
  }, [focusedUnit, hideArmorForUnit, army]);

  // «СПИСОК N/M» counter: N = units no longer active (done + dead + captured)
  const statusCounts = useMemo(() => countUnitsByStatus(army.units), [army.units]);
  const finishedCount = statusCounts.done + statusCounts.dead + statusCounts.captured;
  const totalUnits = army.units.length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" data-testid="game-session">
      {/* Боевой инструктаж (первый заход) */}
      {showBattleTutorial && (
        <BattleTutorial
          demoImageUrl={tutorialImage}
          onFinish={() => {
            localStorage.setItem(LOCAL_STORAGE_KEYS.BATTLE_TUTORIAL_DONE, '1');
            setShowBattleTutorial(false);
          }}
        />
      )}

      {/* Initiative Modal */}
      <InitiativeModal
        isOpen={showInitiativeModal}
        onClose={() => setShowInitiativeModal(false)}
        onConfirm={confirmStartNewTurn}
        factionId={army.faction || 'polaris'}
        activeUnitsCount={activeUnitsCount}
        context="turn"
      />

      {/* Soldier Effects Modal */}
      {effectsModalState && (() => {
        const unit = army.units.find(u => u.instanceId === effectsModalState.unitId);
        if (!unit) return null;
        // Resolve buffs: squad-level + soldier-level modifiers from catalog
        const sourceData = army.sourceId ? getSourceWithCustom(army.sourceId) : null;
        const liveSquad = sourceData?.squads.find(s => s.id === unit.data.id);
        const squadBuffs = (liveSquad?.buffs || unit.data.buffs || []);
        const si = effectsModalState.soldierIndex;
        // Resolve per-soldier modifier IDs against catalog
        const soldier = (unit.data as Squad).soldiers[si];
        const soldierModIds = soldier?.modifiers || [];
        const { buffs: modalBuffs, abilities: modalAbilities } = resolveSoldierEffects(squadBuffs, soldierModIds);
        const abilitiesUsed = (unit.soldierAbilitiesUsed || [])
          .filter(k => k.endsWith(`_${si}`))
          .map(k => k.split('_').slice(0, -1).join('_'));
        // Collect all active effects on this unit for display
        const unitActiveBuffs = collectActiveBuffsForUnit(unit, army);
        const unitDebuffs = collectDebuffsForUnit(unit, army);
        // Static buffs from army (across all phases)
        const shotBuffs = collectBuffsForUnit(unit, army, 'shot');
        const meleeBuffs = collectBuffsForUnit(unit, army, 'melee');
        const alwaysBuffs = collectBuffsForUnit(unit, army, 'always');
        const allStaticBuffs = [...shotBuffs, ...meleeBuffs, ...alwaysBuffs];
        const seenBuffIds = new Set<string>();
        // Спец-свойства (Пр4, Рм — target 'custom') в «статические баффы»
        // не идут: им место во вкладке «Свойства» (иначе дубль в модале)
        const uniqueStaticBuffs = allStaticBuffs.filter(b => {
          if (b.target === 'custom') return false;
          if (seenBuffIds.has(b.id)) return false;
          seenBuffIds.add(b.id);
          return true;
        });
        return (
          <SoldierEffectsModal
            isOpen={!!effectsModalState}
            onClose={() => setEffectsModalState(null)}
            soldierModifiers={(unit.soldierModifiers || []).filter(
              m => m.soldierIndex === si
            )}
            activeBuffs={unitActiveBuffs}
            activeDebuffs={unitDebuffs}
            staticBuffs={uniqueStaticBuffs}
            availableBuffs={modalBuffs}
            availableDebuffs={soldierDebuffs}
            availableAbilities={modalAbilities}
            currentTurn={army.currentTurn || 1}
            abilitiesUsed={abilitiesUsed}
            onApplyModifier={(item, _tabType) => {
              const appliedAt = army.currentTurn || 1;
              const si = effectsModalState.soldierIndex;
              const targetUnit = army.units.find(u => u.instanceId === effectsModalState.unitId);
              if (!targetUnit) return;

              // ALL effects from soldier modal go to soldierModifiers (per-soldier)
              // Prevent duplicate — same catalog ID on same soldier
              const alreadyOnSoldier = (targetUnit.soldierModifiers || []).some(
                m => m.catalogId === item.id && m.soldierIndex === si
              );
              if (alreadyOnSoldier) return;

              const duration = 'duration' in item && item.duration ? item.duration : undefined;
              const modifier: any = {
                id: `${item.id}_${Date.now()}`,
                catalogId: item.id,
                name: item.name,
                description: item.description,
                target: item.target,
                value: item.value,
                phase: item.phase,
                icon: item.icon,
                appliedAtTurn: appliedAt,
                soldierIndex: si,
              };
              if (duration) {
                modifier.duration = duration;
                modifier.expiresAtTurn = appliedAt + duration;
              }
              updateUnit(effectsModalState.unitId, u => {
                const updates: Partial<ArmyUnit> = {
                  soldierModifiers: [
                    ...(u.soldierModifiers || []),
                    modifier,
                  ],
                };
                // Only oneTimeUse abilities are permanently tracked (one per battle per soldier)
                if ('oneTimeUse' in item && item.oneTimeUse) {
                  updates.soldierAbilitiesUsed = [
                    ...(u.soldierAbilitiesUsed || []),
                    `${item.id}_${si}`,
                  ];
                }
                return { ...u, ...updates };
              });
            }}
            onRemoveModifier={(modId) => {
              updateUnit(effectsModalState.unitId, u => ({
                ...u,
                soldierModifiers: (u.soldierModifiers || []).filter(m => m.id !== modId),
              }));
            }}
            soldierName={effectsModalState.soldierName}
          />
        );
      })()}

      {/* Turn Confirmation Modal */}
      {showTurnConfirmation && (
        <div data-testid="turn-count-popup" className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-2 md:p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={cn(
            "relative border-2 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-sm w-full shadow-2xl text-center space-y-4 md:space-y-6 animate-in zoom-in duration-300 mx-auto",
            factionColors.border,
            factionColors.bg,
            factionColors.glow
          )}>
            {/* Corner accents */}
            <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", factionColors.accent)} />
            <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", factionColors.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", factionColors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", factionColors.accent)} />

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <h3 className={cn("text-lg md:text-xl font-mono font-bold tracking-wider", factionColors.primary)}>
                ЗАВЕРШИТЬ ТУР {army.currentTurn || 1}{selectedMission?.parameters.turnCount ? ` ИЗ ${selectedMission.parameters.turnCount}` : ''}?
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            </div>

            {/* Warning message */}
            <div className="bg-amber-950/30 border border-amber-700/50 rounded-lg p-3 md:p-4">
              <p className="text-sm md:text-base font-mono text-amber-300">
                Активных отрядов: <span className="font-black">{getIncompleteUnits().length}</span>
              </p>
            </div>

            {/* Incomplete units list */}
            <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 max-h-40 overflow-y-auto space-y-2">
              {getIncompleteUnits().map(unit => {
                const incompleteCount = unit.type === 'squad'
                  ? (unit.data as Squad).soldiers.filter((_, idx) => {
                      const isDead = unit.deadSoldiers?.includes(idx);
                      const isDone = unit.actionsUsed?.[idx]?.done;
                      return !isDead && !isDone;
                    }).length
                  : 1;

                return (
                  <div key={unit.instanceId} className="flex items-center justify-between text-xs md:text-sm font-mono">
                    <span className="text-slate-300 truncate flex-1 text-left">
                      {unit.instanceNumber ? `${unit.instanceNumber} — ` : ''}{unit.data.name}
                    </span>
                    <span className="text-amber-400 font-black ml-2">
                      {incompleteCount} {unit.type === 'squad' ? 'бойцов' : 'машина'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTurnConfirmation(false)}
                className={cn(
                  "flex-1 py-3 md:py-4 font-mono text-sm md:text-base font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50 hover:text-slate-300"
                )}
              >
                ОТМЕНИТЬ
              </button>
              <button
                onClick={onTurnConfirmed}
                className={cn(
                  "flex-[2] py-3 md:py-4 font-mono text-sm md:text-lg font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  factionColors.border,
                  factionColors.bg,
                  factionColors.primary,
                  "hover:scale-102 active:scale-95"
                )}
              >
                ЗАВЕРШИТЬ ТУР
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content — окно карточки. Док ниже в потоке: контент физически
          не может зайти под панель, никаких bottomInset-замеров не нужно. */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {army.units.length > 0 && (
          <div className={cn(
            "w-full h-full flex flex-col min-h-0",
            army.units[focusedUnitIdx]?.type === 'machine' ? "max-w-6xl mx-auto" : "max-w-3xl mx-auto"
          )}>
            <UnitCard
              unit={army.units[focusedUnitIdx]}
              updateUnit={updateUnit}
              combatLog={combatLog}
              onCombatLogEntry={handleCombatLogEntry}
              allUnits={army.units}
              army={army}
              onPilotAssign={handlePilotAssign}
              onPilotRemove={handlePilotRemove}
              onCaptureMachine={handleCaptureMachine}
              onNavigateToUnit={handleNavigateToUnit}
              strictPilotRankEnabled={strictPilotRankEnabled}
              distanceInputUnit={distanceInputUnit}
              stepToCmFactor={stepToCmFactor}
              autoCompleteEnabled={autoCompleteEnabled}
              triggerEncyclopediaOpen={triggerEncyclopediaOpen}
              onSoldierModifierClick={(unitId, soldierIndex, soldierName) => {
                setEffectsModalState({ unitId, soldierIndex, soldierName });
              }}
              hideArmor={hideArmorForUnit}
              hideSpeed={hideSpeedForUnit}
            />
          </div>
        )}

        {/* Floating "End Turn" button - appears when all units are done.
            NB: testid intentionally differs from the dock-menu «Новый тур» item
            (new-turn-button) — the old duplicate testid was a strict-mode hazard
            when both rendered. E2E targets the menu item. */}
        {army.units.length > 0 && getIncompleteUnits().length === 0 && !isDockExpanded && (
          <div className="absolute inset-x-2 bottom-2 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <button
              data-testid="floating-new-turn-button"
              onClick={startNewTurn}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 font-mono font-bold text-base uppercase tracking-wider transition-all min-h-[48px]",
                "cursor-pointer active:scale-[0.97] hover:scale-[1.01]",
                factionColors.border, factionColors.bg, factionColors.primary,
                "shadow-lg backdrop-blur-sm"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              Завершить тур {army.currentTurn || 1}
            </button>
          </div>
        )}
      </div>

      {/* Dock — окно панели В ПОТОКЕ раскладки (shrink-0): карточка кончается
          на его верхней границе, зайти под панель невозможно — никаких
          bottomInset-замеров. slate-900 + stronger edge + shadow: док
          читается отдельной консолью (bg совпадает с корнем страницы) */}
      {army.units.length > 0 && (
        <div
          data-testid="unit-dock"
          className={cn(
            "relative z-50 shrink-0 bg-slate-900 border-t-2",
            "border-slate-700/70 shadow-[0_-8px_24px_rgba(0,0,0,0.45)]"
          )}
          onMouseDown={(e) => startDragGesture(false, e.clientY)}
          onTouchStart={(e) => startDragGesture(false, e.touches[0].clientY)}
        >
          {/* Ручка открытия навигатора — тап или свайп вверх по доку */}
          <div
            className="flex justify-center py-1 active:bg-slate-800/50 transition-colors cursor-pointer"
            onClick={toggleDockExpanded}
          >
            <div className={cn(
              "w-8 h-0.5 rounded-full transition-all duration-200",
              factionColors.bgSolid
            )} />
          </div>

          {/* Current unit info bar — two readable rows (playtest fix: the old
              single text-xs row was unreadable on phones).
              Row 1: identity (number + name + живые бойцы). Row 2: stats + done.
              Guard focusedUnit?.data: юнит без data (битый localStorage) не рендерим. */}
          {focusedUnit?.data && (
            <div
              data-testid="dock-info-bar"
              className="px-2 py-1.5 border-t border-slate-800/50 space-y-1"
            >
              {/* Row 1 — identity */}
              <div className="flex items-center gap-2 min-w-0">
                {/* Unit number */}
                {(() => {
                  // Guard от битого localStorage (юнит без data) — не белый экран;
                  // сам блок уже под focusedUnit?.data &&, здесь только defense-in-depth u.data?.id
                  const sameTypeCount = army.units.filter(u => u.data?.id === focusedUnit.data.id).length;
                  return focusedUnit.instanceNumber && sameTypeCount > 1 && (
                    <span className={cn(
                      "shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-bold",
                      factionColors.bg,
                      factionColors.text
                    )}>
                      {focusedUnit.instanceNumber}
                    </span>
                  );
                })()}

                {/* Unit name — own line, larger */}
                <span
                  data-testid="dock-unit-name"
                  className={cn(
                    "min-w-0 flex-1 text-base md:text-lg font-mono font-bold uppercase tracking-wider truncate",
                    factionColors.text
                  )}
                  title={focusedUnit.data.name}
                >
                  {focusedUnit.data.name}
                </span>

                {/* Alive soldiers aggregate + граната взвода (плейтест: граната
                    рядом с N/M) — squads only */}
                {focusedUnit.type === 'squad' && (() => {
                  const squadData = focusedUnit.data as Squad;
                  const alive = getAliveSoldiersCount(focusedUnit);
                  const grenadesUsed = focusedUnit.grenadesUsed;
                  return (
                    <span
                      data-testid="dock-soldiers-alive"
                      className="shrink-0 flex items-center gap-1.5 px-1.5 min-h-[24px] rounded-sm bg-slate-800/60 border border-slate-700/40"
                      title={`Живые бойцы: ${alive} из ${squadData.soldiers.length}. Гранаты: ${grenadesUsed ? 'использованы' : 'есть'}.`}
                    >
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        alive === 0 ? "text-slate-500" : "text-emerald-300"
                      )}>
                        {alive}/{squadData.soldiers.length}
                      </span>
                      <span className="w-px h-3.5 bg-slate-700/50" aria-hidden="true" />
                      <Bomb
                        data-testid="dock-grenade"
                        className={cn("w-3.5 h-3.5", grenadesUsed ? "text-slate-500" : "text-amber-400")}
                      />
                    </span>
                  );
                })()}
              </div>

              {/* Row 2 — stats + controls. flex-wrap: на 320px кластер
                  кнопок переносится строкой вместо обрезания (высота дока
                  авторастёт через ResizeObserver → bottomInset). */}
              <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
                {/* Armor badge - squads with uniform armor */}
                {focusedUnit.type === 'squad' && squadUniformStats.isUniformArmor && squadUniformStats.commonArmor !== undefined && (() => {
                  const bonus = squadDockBonuses.armorBonus ? `+${squadDockBonuses.armorBonus}` : undefined;
                  const isActive = !!bonus;
                  return (
                    <div
                      data-testid="dock-armor-badge"
                      className={cn(
                        'flex items-center justify-center gap-0.5 rounded-lg min-h-[40px] min-w-[44px] max-w-[72px] px-1 transition-colors shrink-0',
                        isActive ? 'border border-emerald-500/40 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)]' : 'border border-slate-700/40 bg-slate-800/60'
                      )}
                    >
                      <Shield className="w-4 h-4 shrink-0 text-yellow-400" />
                      <span className="text-base font-mono font-black text-yellow-300 leading-none">
                        {squadUniformStats.commonArmor}
                      </span>
                      {bonus && (
                        <span className="text-[9px] font-mono font-extrabold text-emerald-400/90 leading-none translate-y-[-1px]">
                          {bonus}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Speed badge - squads with uniform speed */}
                {focusedUnit.type === 'squad' && squadUniformStats.isUniformSpeed && squadUniformStats.commonSpeed !== undefined && (() => {
                  const bonus = squadDockBonuses.speedMultiplier ? `x${squadDockBonuses.speedMultiplier}` : undefined;
                  const isActive = !!bonus;
                  return (
                    <div
                      data-testid="dock-speed-badge"
                      className={cn(
                        'flex items-center justify-center gap-0.5 rounded-lg min-h-[40px] min-w-[44px] max-w-[72px] px-1 transition-colors shrink-0',
                        isActive ? 'border border-emerald-500/40 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)]' : 'border border-slate-700/40 bg-slate-800/60'
                      )}
                    >
                      <Footprints className="w-4 h-4 shrink-0 text-cyan-400" />
                      {distanceInputUnit === 'cm' ? (
                        <span className="text-base font-mono font-black text-cyan-300 leading-none">
                          {squadUniformStats.commonSpeed * stepToCmFactor}
                        </span>
                      ) : (
                        // Шаги + см в скобках, читаемым кеглем — как в статах бойца
                        <>
                          <span className="text-base font-mono font-black text-cyan-300 leading-none">
                            {squadUniformStats.commonSpeed}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-300 leading-none">
                            ({squadUniformStats.commonSpeed * stepToCmFactor}см)
                          </span>
                        </>
                      )}
                      {bonus && (
                        <span className="text-[9px] font-mono font-extrabold text-emerald-400/90 leading-none translate-y-[-1px]">
                          {bonus}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Durability + ammo - only for machines */}
                {focusedUnit.type === 'machine' && (() => {
                  const machine = focusedUnit.data as Machine;
                  const currentDurability = focusedUnit.currentDurability || 0;
                  const maxDurability = machine.durability_max;
                  const durabilityPercent = currentDurability / maxDurability;

                  let durabilityColor = "text-emerald-500";
                  let durabilityBg = "bg-emerald-950/50";

                  if (currentDurability === 0) {
                    durabilityColor = "text-slate-600";
                    durabilityBg = "bg-slate-800";
                  } else if (durabilityPercent < 0.3) {
                    durabilityColor = "text-red-500";
                    durabilityBg = "bg-red-950/50";
                  } else if (durabilityPercent < 0.6) {
                    durabilityColor = "text-amber-500";
                    durabilityBg = "bg-amber-950/50";
                  }

                  const ammo = focusedUnit.currentAmmo;
                  const showAmmo = ammo !== undefined && !!machine.ammo_max;

                  return (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "flex items-center justify-center gap-1 rounded-sm px-1.5 min-h-[24px]",
                        durabilityBg
                      )}>
                        <Heart className={cn("w-3.5 h-3.5", durabilityColor)} />
                        <span className={cn("text-xs font-mono font-bold", durabilityColor)}>
                          {currentDurability}/{maxDurability}
                        </span>
                      </span>
                      {showAmmo && (
                        <span
                          data-testid="dock-machine-ammo"
                          className={cn(
                            "flex items-center justify-center gap-1 rounded-sm px-1.5 min-h-[24px]",
                            ammo! > 0 ? "bg-slate-800/60" : "bg-red-950/50"
                          )}
                        >
                          <Bomb className={cn("w-3.5 h-3.5", ammo! > 0 ? "text-slate-300" : "text-red-400")} />
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            ammo! > 0 ? "text-slate-200" : "text-red-400"
                          )}>
                            {ammo}/{machine.ammo_max}
                          </span>
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Spacer */}
                <div className="flex-1 min-w-0" />

                {/* Navigator button — the primary unit switcher (playtest:
                    the tiny-icon strip was unreadable). N/M = units that
                    finished their turn (done + dead + captured). */}
                <button
                  data-testid="dock-open-navigator"
                  onClick={toggleDockExpanded}
                  aria-label={`Открыть список юнитов, завершено ${finishedCount} из ${totalUnits}`}
                  title="Список юнитов"
                  className={cn(
                    "shrink-0 min-h-[44px] px-2 flex items-center justify-center gap-1.5 rounded-sm border",
                    "font-mono text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95",
                    "border-slate-700/50 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-slate-100"
                  )}
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  {/* Подпись только на десктопе: на мобиле иконка+счётчик,
                      иначе ⋮ переносится на вторую строку (плейтест) */}
                  <span className="hidden md:inline">Список</span>
                  <span
                    data-testid="dock-nav-counter"
                    aria-hidden="true"
                    className={cn(
                      "px-1 rounded-sm text-[10px] font-mono font-bold leading-none py-0.5",
                      finishedCount === totalUnits && totalUnits > 0
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-900/70 text-slate-200"
                    )}
                  >
                    {finishedCount}/{totalUnits}
                  </span>
                </button>

                {/* Unit done toggle — labeled, faction-tinted (playtest: solid
                    faction fill was too loud) + the dock menu right after it */}
                {(() => {
                  const { isDead, isDone } = getUnitStatus(focusedUnit);
                  return (
                    <>
                      <button
                        data-testid="dock-unit-done"
                        onClick={isDead ? undefined : handleToggleUnitDone}
                        disabled={isDead}
                        aria-pressed={isDone}
                        title={isDone ? "Отменить завершение" : "Завершить ход"}
                        aria-label={isDone ? "Отменить завершение хода взвода" : "Завершить ход взвода"}
                        className={cn(
                          "shrink-0 min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-sm border",
                          "font-mono text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95",
                          isDead
                            ? "bg-slate-900/50 border-slate-800/50 opacity-40 cursor-not-allowed"
                            : isDone
                              ? "bg-emerald-900/50 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/60"
                              : cn(factionColors.bg, factionColors.border, factionColors.text, "hover:brightness-125")
                        )}
                      >
                        {isDone ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span className="hidden md:inline">{isDone ? "Отмена" : "Готов"}</span>
                      </button>
                      {/* Dock menu — moved from the unit strip's far right
                          (playtest: undiscoverable there) */}
                      <button
                        data-testid="dock-menu-toggle"
                        onClick={(e) => { e.stopPropagation(); setShowDockMenu(!showDockMenu); }}
                        aria-label="Меню боя"
                        title="Меню боя"
                        className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 active:scale-95"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Dock Menu Dropdown — absolute над доком: док в потоке и
              relative, смещение bottom-full не требует замеров высоты */}
          {showDockMenu && (
            <div data-dock-menu-root className="absolute bottom-full right-2 mb-1 z-[60] animate-in fade-in duration-150">
              <div className="bg-slate-800 border border-slate-700 rounded-sm shadow-xl py-1 min-w-[150px]">
                <div className="px-3 py-1.5 border-b border-slate-700/50 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">Тур</span>
                  <span className={cn("text-sm font-mono font-black", factionColors.primary)}>{army.currentTurn || 1}</span>
                </div>
                {selectedMission && (
                  <Link
                    href={`/encyclopedia/mission/${selectedMission.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="game-session-mission-link"
                    onClick={() => setShowDockMenu(false)}
                    className="px-3 py-1.5 border-b border-slate-700/50 flex items-center justify-between hover:bg-slate-700"
                  >
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Миссия
                    </span>
                    <span className={cn("text-xs font-mono font-bold truncate ml-2 max-w-[90px]", factionColors.primary)}>
                      {selectedMission.name}
                    </span>
                  </Link>
                )}
                <button
                  data-testid="new-turn-button"
                  onClick={() => { startNewTurn(); setShowDockMenu(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  Новый тур
                </button>
                <button
                  onClick={() => { setTriggerEncyclopediaOpen(true); setShowDockMenu(false); setTimeout(() => setTriggerEncyclopediaOpen(false), 100); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700/50"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Энциклопедия
                </button>
                <button
                  onClick={() => { setCombatLogVisible(true); setShowDockMenu(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700/50"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  История боя
                </button>
                <button
                  data-testid="battle-tutorial-replay"
                  onClick={() => { setShowBattleTutorial(true); setShowDockMenu(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  Инструктаж
                </button>
                {wakeLock.supported && (
                  <button
                    data-testid="wake-lock-toggle"
                    onClick={(e) => { e.stopPropagation(); handleToggleWakeLock(); }}
                    aria-pressed={wakeLockEnabled}
                    title={wakeLockEnabled ? 'Экран не будет гаснуть во время боя' : 'Держать экран включённым во время боя'}
                    className={cn(
                      'w-full px-3 py-2 text-left text-xs flex items-center gap-2 border-t border-slate-700/50',
                      wakeLockEnabled ? 'text-emerald-300' : 'text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    <Power className={cn('w-3.5 h-3.5', wakeLockEnabled ? 'text-emerald-400' : 'text-slate-400')} />
                    Не гаснуть
                    {/* Точка — от ФАКТА (wakeLock.active), не от намерения: при
                        отказе API (Low Power Mode и пр.) лок не держится, и
                        светить «активен» нельзя (ревью PR #242) */}
                    {wakeLock.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" aria-hidden="true" />}
                  </button>
                )}
                {army.isInBattle && (
                  <button
                    onClick={() => { onEndBattle?.(); setShowDockMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/30 flex items-center gap-2 border-t border-slate-700/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Завершить бой
                  </button>
                )}
                <a
                  href="https://vk.com/lastbpcoder"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowDockMenu(false)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-700 flex items-center gap-2 border-t border-slate-700/50"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                  Сообщить о проблеме
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigator sheet — отдельное фиксированное окно, а не «растущий док»
          (плейтест 2026-09-20: расширяющийся док требовал замеров высоты и
          всё равно пропускал контент под панель). Триггеры прежние: кнопка
          СПИСОК, свайп вверх по доку, авто-открытие после хода юнита.
          Закрытие: выбор строки, ручка (тап/потянуть вниз). Раскладку дока
          и карточки не трогает. */}
      {army.units.length > 0 && isDockExpanded && (
        <div
          data-testid="navigator-sheet"
          className="fixed inset-x-0 top-16 bottom-0 z-[70] flex flex-col bg-slate-900 border-t-2 border-slate-700/70 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] animate-in slide-in-from-bottom duration-200"
        >
          <div
            className="flex justify-center py-1.5 active:bg-slate-800/50 transition-colors cursor-pointer shrink-0"
            onClick={() => setIsDockExpanded(false)}
            onMouseDown={(e) => startDragGesture(true, e.clientY)}
            onTouchStart={(e) => startDragGesture(true, e.touches[0].clientY)}
          >
            <div className="w-12 h-0.5 rounded-full bg-slate-600" />
          </div>
          <ExpandedNavigator
            army={army}
            focusedUnitIdx={focusedUnitIdx}
            onSelectUnit={(idx) => { setFocusedUnitIdx(idx); setIsDockExpanded(false); }}
          />
        </div>
      )}

      {/* Combat Log Modal - Full screen overlay */}
      {combatLogVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                История боя ({combatLog.length})
              </span>
            </div>
            <button
              onClick={() => setCombatLogVisible(false)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {combatLog.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                История пуста
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl mx-auto">
                {combatLog.slice().reverse().map((entry) => (
                  <div key={entry.id} className="bg-slate-800/50 rounded-lg p-3 text-sm border border-slate-700/50">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-bold text-slate-200">{entry.result.unitName}</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs">
                      {entry.result.actionType === 'shot' && 'Выстрел'}
                      {entry.result.actionType === 'melee' && 'Ближний бой'}
                      {entry.result.actionType === 'grenade' && 'Граната'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
