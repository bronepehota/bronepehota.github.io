/**
 * Missions Registry
 *
 * Centralized access to battle scenarios (missions) and their campaigns.
 * Mirrors the encyclopedia-registry pattern: compile-time JSON imports → typed
 * arrays → accessor functions. Static export bundles the JSON at build time.
 *
 * Missions are informational reference only — no game-state enforcement.
 */
import missionsJson from '@/data/missions/missions.json';
import campaignsJson from '@/data/missions/campaigns.json';
import type { Mission, Campaign, MissionObjective } from './mission-types';
import type { FactionID } from './types';

/** Sentinel id for "no mission / free play". */
export const FREE_PLAY_MISSION_ID = '__free_play__';

// Type assertions for JSON imports
const missions: Mission[] = missionsJson as unknown as Mission[];
const campaigns: Campaign[] = campaignsJson as Campaign[];

/** All missions, sorted ascending by `order`. */
export function getAllMissions(): Mission[] {
  return [...missions].sort((a, b) => a.order - b.order);
}

/** Mission by id, or undefined if not found. */
export function getMission(id: string): Mission | undefined {
  return missions.find((m) => m.id === id);
}

/** Mission by id; throws if not found (for routes that have validated the id). */
export function getMissionOrThrow(id: string): Mission {
  const mission = getMission(id);
  if (!mission) {
    throw new Error(`Mission not found: ${id}`);
  }
  return mission;
}

/** All missions belonging to a campaign, sorted by order. */
export function getMissionsForCampaign(campaignId: string): Mission[] {
  return getAllMissions().filter((m) => m.campaign === campaignId);
}

/** All campaigns (in file order). */
export function getAllCampaigns(): Campaign[] {
  return campaigns;
}

/** Campaign by id, or undefined. */
export function getCampaign(id: string): Campaign | undefined {
  return campaigns.find((c) => c.id === id);
}

/**
 * The objective for a specific faction in a mission.
 * Returns undefined if the mission or faction objective doesn't exist
 * (e.g. mercenaries have no objective in most missions).
 */
export function getObjectiveForFaction(
  missionId: string,
  factionId: FactionID,
): MissionObjective | undefined {
  return getMission(missionId)?.objectives[factionId];
}

/** True when no mission is selected (null/undefined) or free play is chosen. */
export function isFreePlay(missionId?: string | null): boolean {
  return !missionId || missionId === FREE_PLAY_MISSION_ID;
}

/** True when the id resolves to a real (non-free-play) mission. */
export function isValidMission(id?: string | null): boolean {
  return !!id && id !== FREE_PLAY_MISSION_ID && !!getMission(id);
}

/**
 * True if the mission prescribes combat forces for the given faction.
 * Drives the wizard routing: missions with prescribed forces auto-fill the army;
 * missions without them go to the budget/manual-build path.
 */
export function missionHasParticipantsForFaction(mission: Mission, faction: FactionID): boolean {
  return (mission.participants?.[faction]?.length ?? 0) > 0;
}

/**
 * True if the mission prescribes combat forces for any faction.
 * Drives wizard clustering: participant-less missions render in the free-play cluster.
 */
export function missionHasAnyParticipants(mission: Mission): boolean {
  return (
    !!mission.participants &&
    Object.values(mission.participants).some((arr) => Array.isArray(arr) && arr.length > 0)
  );
}
