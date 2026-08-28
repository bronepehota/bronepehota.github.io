import { Army, ArmyUnit, isSquad, isMachine } from './types';
import { LOCAL_STORAGE_KEYS } from './constants';
import { getSourceWithCustom } from './sources-registry';

/**
 * Persisted-army schema version. Bump when the Army shape changes and add a
 * migration branch in `migrateArmy`. Legacy data (pre-versioning, a bare Army
 * object) is treated as version 0 and migrated on load.
 */
export const ARMY_SCHEMA_VERSION = 1;

/** A battle older than this is considered stale → transient action state reset. */
const STALE_BATTLE_MS = 60 * 60 * 1000; // 1 hour

interface PersistedArmy {
  schemaVersion: number;
  army: Army;
}

/** Persist the army under a versioned envelope. */
export function saveArmy(army: Army): void {
  const payload: PersistedArmy = { schemaVersion: ARMY_SCHEMA_VERSION, army };
  localStorage.setItem(LOCAL_STORAGE_KEYS.ARMY, JSON.stringify(payload));
}

/**
 * Load + migrate the army from storage.
 * Accepts both the current versioned envelope and the legacy bare-Army shape.
 * Returns null if absent or unparseable.
 */
export function loadArmy(now: number = Date.now()): Army | null {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.ARMY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const army: Army | undefined =
      'schemaVersion' in parsed ? (parsed as PersistedArmy).army : (parsed as Army);
    if (!army) return null;
    return rehydrateFromSource(migrateArmy(army as Army, now));
  } catch {
    return null;
  }
}

/**
 * Refresh each unit's template `data` from its source so a saved army reflects the
 * current army-list data (stats/cost/weapons). Runtime state (durability, ammo, dead
 * soldiers, actions, modifiers, pilot…) is preserved. Falls back to the stored data
 * when the source is unavailable or the unit's structure changed (e.g. soldier count)
 * so runtime indices stay valid.
 */
export function rehydrateFromSource(army: Army): Army {
  if (!army.sourceId) return army;
  const source = getSourceWithCustom(army.sourceId);
  if (!source) return army;

  return {
    ...army,
    units: army.units.map((unit) => {
      if (isSquad(unit)) {
        const fresh = source.squads.find((s) => s.id === unit.data.id);
        if (fresh && fresh.soldiers.length === unit.data.soldiers.length) {
          return { ...unit, data: fresh };
        }
        return unit;
      }
      if (isMachine(unit)) {
        const fresh = source.machines.find((m) => m.id === unit.data.id);
        if (fresh && fresh.durability_max === unit.data.durability_max) {
          return { ...unit, data: fresh };
        }
        return unit;
      }
      return unit;
    }),
  };
}

/**
 * Apply forward migrations + defaults for an army.
 * Centralizes what used to be ad-hoc field patching inline in page.tsx.
 */
export function migrateArmy(army: Army, now: number = Date.now()): Army {
  const withDefaults: Army = {
    ...army,
    // Санитайзинг на границе хранения: битые записи (без data / чужой type) выкидываем,
    // чтобы каждый downstream-потребитель (GameSession, UnitCard, навигатор) был
    // защищён by construction, а render-гарды остались defense-in-depth.
    units: (army.units ?? []).filter(
      (u): u is ArmyUnit => !!u?.data && (u.type === 'squad' || u.type === 'machine'),
    ),
    currentStep: army.currentStep ?? 'faction-select',
    isInBattle: army.isInBattle ?? false,
    currentTurn: army.currentTurn ?? 1,
  };
  return resetStaleBattle(withDefaults, now);
}

/** If a battle is older than STALE_BATTLE_MS, reset transient machine/squad action state. */
function resetStaleBattle(army: Army, now: number): Army {
  const lastBattleTime = army.lastBattleDate ? new Date(army.lastBattleDate).getTime() : 0;
  const isStale =
    !!army.isInBattle && lastBattleTime > 0 && now - lastBattleTime > STALE_BATTLE_MS;
  if (!isStale) return army;

  return { ...army, units: army.units.map(resetUnitActions) };
}

function resetUnitActions(unit: ArmyUnit): ArmyUnit {
  if (unit.type === 'machine') {
    return {
      ...unit,
      machineShotsUsed: 0,
      machineWeaponShots: {},
      isMachineShot: false,
      isMachineMoved: false,
      isMachineMelee: false,
      isMachineDone: false,
    };
  }
  if (isSquad(unit) && unit.actionsUsed) {
    return {
      ...unit,
      actionsUsed: unit.data.soldiers.map(() => ({
        moved: false,
        shot: false,
        melee: false,
        done: false,
      })),
    };
  }
  return unit;
}
