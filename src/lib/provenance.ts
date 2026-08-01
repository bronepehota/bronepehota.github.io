/**
 * Lore provenance ("источник") resolver.
 *
 * Provenance answers two independent questions about an encyclopedia entity:
 *   - origin:     who *invented the concept* (the faction / unit / mission idea)
 *   - loreAuthor: who *wrote the descriptive lore text*
 *
 * These differ in practice: most units are Tehnolog-originals, but their rich lore
 * was written by the Star System community — so `origin: 'tehnolog'` while
 * `loreAuthor: 'star_system'`.
 *
 * Each entity MAY carry an optional `provenance` field (`Partial<Provenance>`) that
 * overrides a single axis. Anything unset falls back to a per-entity-type default,
 * so the vast majority of entries need no JSON edit at all.
 *
 * Type-only imports below avoid a runtime cycle: this module reads only type
 * shapes from the registries, and they in turn import only the `Provenance` type.
 */
import type { EncyclopediaUnit, EncyclopediaFaction } from './encyclopedia-registry';
import type { Mission } from './mission-types';

/** Who a piece of lore comes from. */
export type LoreSource = 'tehnolog' | 'star_system' | 'universestarsys' | 'ai';

/** Resolved provenance — both axes always present after resolution. */
export interface Provenance {
  /** Who invented the concept (the faction / unit / mission itself). */
  origin: LoreSource;
  /** Who wrote the descriptive lore text shown on the page. */
  loreAuthor: LoreSource;
}

/** Faction-aware default for factions and units (they share the same rule). */
function defaultFactionOrUnit(factionId: string | undefined): Provenance {
  // Community creations — concept and lore alike (not Технолог canon):
  //   Рутения      → Star System community (vk.com/bp_bnp)
  //   Мёртвый Флот → Звёздные Системы   (vk.ru/universestarsys)
  if (factionId === 'rutenia') return { origin: 'star_system', loreAuthor: 'star_system' };
  if (factionId === 'dead_fleet') return { origin: 'universestarsys', loreAuthor: 'universestarsys' };
  // Default: Tehnolog-original concept, community-written lore.
  return { origin: 'tehnolog', loreAuthor: 'star_system' };
}

/** Apply a per-axis `Partial` override on top of a base default. */
function merge(base: Provenance, override?: Partial<Provenance>): Provenance {
  if (!override) return base;
  return {
    origin: override.origin ?? base.origin,
    loreAuthor: override.loreAuthor ?? base.loreAuthor,
  };
}

/** Provenance for a unit (defaults from its faction + army-list presence; override via `unit.provenance`). */
export function resolveUnitProvenance(unit: EncyclopediaUnit): Provenance {
  // Machines (техника) and орудия are official Технолог products — both the concept
  // and the lore text are Технолог's, regardless of faction. A community-made machine
  // (e.g. Dead Fleet's, by Звёздные Системы) overrides this via `unit.provenance`.
  if (unit.type === 'machine' || unit.type === 'орудие') {
    return merge({ origin: 'tehnolog', loreAuthor: 'tehnolog' }, unit.provenance);
  }
  // Faction-specific community creations.
  if (unit.faction === 'rutenia') {
    return merge({ origin: 'star_system', loreAuthor: 'star_system' }, unit.provenance);
  }
  if (unit.faction === 'dead_fleet') {
    return merge({ origin: 'universestarsys', loreAuthor: 'universestarsys' }, unit.provenance);
  }
  // Official canon unit (present in the Tehnolog army list) → Tehnolog concept + lore.
  // Community-only unit (star_system list) → community concept + lore.
  const official = (unit.sources ?? []).some((s) => s.id === 'tehnolog');
  const base: Provenance = official
    ? { origin: 'tehnolog', loreAuthor: 'tehnolog' }
    : { origin: 'star_system', loreAuthor: 'star_system' };
  return merge(base, unit.provenance);
}

/** Provenance for a faction (defaults from its id; override via `faction.provenance`). */
export function resolveFactionProvenance(faction: EncyclopediaFaction): Provenance {
  return merge(defaultFactionOrUnit(faction.id), faction.provenance);
}

/** Provenance for a mission — both axes default to Tehnolog (Cerber scenarios are
 * verbatim official material sourced from tehnolog.ru). Override via `mission.provenance`. */
export function resolveMissionProvenance(mission: Mission): Provenance {
  return merge({ origin: 'tehnolog', loreAuthor: 'tehnolog' }, mission.provenance);
}

/** True when origin and lore author are the same source — the UI may collapse to a
 * single chip («Технолог — оригинал и лор» / «Star System — сообщество»). */
export function isProvenanceUniform(p: Provenance): boolean {
  return p.origin === p.loreAuthor;
}
