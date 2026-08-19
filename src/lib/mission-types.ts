/**
 * Mission types
 *
 * A Mission is a battle scenario: backdrop story, deployment diagram, asymmetric
 * per-faction objectives, and special rules. Missions are informational reference
 * only — the app does not enforce turn limits, track objectives, or declare a winner.
 *
 * Convention follows combat-types.ts / modifier-types.ts (a dedicated type file).
 */
import type { FactionID } from './types';
// Type-only: Provenance type lives in ./provenance, which type-only-imports back
// from this module — type-only on both sides, no runtime cycle.
import type { Provenance } from './provenance';

/** A single faction's objective for a mission. Missions are asymmetric. */
export interface MissionObjective {
  /** Main task description, e.g. «Освободить полковника… в течение 8 ходов». */
  text: string;
  /** Optional win / draw / loss conditions broken out as bullet points. */
  victoryConditions?: string[];
}

/** The kind of combat unit that takes part in a mission. */
export type MissionParticipantType = 'squad' | 'machine' | 'weapon';

/** A combat unit that participates in a mission (no dice/instructions/etc.). */
export interface MissionParticipant {
  /** Unit name, e.g. «Тяжёлая клон-пехота», «Бронеход», «Миномёт». */
  name: string;
  type: MissionParticipantType;
  /** Count of this unit (e.g. 2 for two mortars / two squads). Omit/1 for singletons. */
  count?: number;
  /** Encyclopedia unit id to link to (omit for non-unit entries like mortars/pilot). */
  unitId?: string;
}

/** Game parameters shown as reference (never enforced). */
export interface MissionParameters {
  /** Recommended turn count, e.g. 8. Omitted when a mission has no turn limit (objective-based). */
  turnCount?: number;
  /** Faction id that moves first, e.g. 'protectorate'. */
  firstMove?: FactionID;
  /** Rules variant label, e.g. «быстрые правила». */
  rulesVariant?: string;
}

/** The narrative briefing (предыстория), split into three labelled beats. */
export interface MissionBriefing {
  /** Classified header / location line («СОВЕРШЕННО СЕКРЕТНО. Планета Цербер…»). */
  setting?: string;
  /** The commander's order + signature. */
  order?: string;
  /** Field report / response from the unit on the ground. */
  report?: string;
}

/**
 * A battle scenario. Objectives are keyed by faction id so the reference panel can
 * look up the player's side directly via army.faction.
 */
export interface Mission {
  /** Slug id, e.g. 'osvobozhdenie'. */
  id: string;
  /** Display name, e.g. «Освобождение». */
  name: string;
  /** Sort order in lists (ascending). */
  order: number;
  /** Campaign id this mission belongs to, e.g. 'cerber'. */
  campaign: string;
  /** Factions that take part, e.g. ['polaris', 'protectorate']. */
  factions: FactionID[];
  /** Closing tagline after the shared campaign intro. */
  tagline?: string;
  /** One-line unique summary shown on the mission card (what the mission is about). */
  summary?: string;
  /** Narrative briefing. */
  briefing: MissionBriefing;
  /** Terrain / deployment preparation instructions referencing the diagram. */
  setup?: string;
  /** Game parameters (reference only). */
  parameters: MissionParameters;
  /** Asymmetric objectives keyed by faction id. */
  objectives: Record<string, MissionObjective>;
  /** Special rules / warnings, e.g. «Полковник Горрелоу должен остаться живым». */
  specialRules?: string[];
  /** Deployment diagram image path, e.g. '/images/missions/<id>/diagram.png'. */
  diagramImage?: string;
  /** Combat units that participate, split by faction (squads, machines, weapons). */
  participants?: Record<string, MissionParticipant[]>;
  /** Canonical source URL. */
  sourceUrl?: string;
  /** Lore provenance override (origin / loreAuthor). Unset axes default to Tehnolog
   * for both — see `resolveMissionProvenance` in `@/lib/provenance`.
   *
   * An EXPLICIT `null` means «source not established»: the mission page renders
   * no attribution row at all (no invented «Технолог» default). */
  provenance?: Partial<Provenance> | null;
}

/** A campaign groups missions that share a universe / intro paragraph. */
export interface Campaign {
  /** Slug id, e.g. 'cerber'. */
  id: string;
  /** Display name, e.g. «Цербер». */
  name: string;
  /** Shared intro paragraph shown above each mission's briefing. */
  intro: string;
}
