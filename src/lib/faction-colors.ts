import type { FactionID } from './types';

type FactionStyle = {
  text: string; border: string; bg: string; glow: string; primary: string;
  borderSolid: string; bgSolid: string; progress: string; accent: string; ring: string;
};

// Per-faction Tailwind style sets. Add a faction here to theme it everywhere.
const FACTION_STYLES: Record<string, FactionStyle> = {
  polaris:      { text: 'text-red-400',     border: 'border-red-500/50',     bg: 'bg-red-500/10',     glow: 'shadow-red-500/20',     primary: '#ef4444', borderSolid: 'border-red-500',     bgSolid: 'bg-red-500',     progress: 'bg-red-500',     accent: 'border-red-500',     ring: 'ring-red-500' },
  protectorate: { text: 'text-cyan-400',    border: 'border-cyan-500/50',    bg: 'bg-cyan-500/10',    glow: 'shadow-cyan-500/20',    primary: '#06b6d4', borderSolid: 'border-cyan-500',    bgSolid: 'bg-cyan-500',    progress: 'bg-cyan-500',    accent: 'border-cyan-500',    ring: 'ring-cyan-500' },
  mercenaries:  { text: 'text-yellow-400',  border: 'border-yellow-500/50',  bg: 'bg-yellow-500/10',  glow: 'shadow-yellow-500/20',  primary: '#eab308', borderSolid: 'border-yellow-500',  bgSolid: 'bg-yellow-500',  progress: 'bg-yellow-500',  accent: 'border-yellow-500',  ring: 'ring-yellow-500' },
  rutenia:      { text: 'text-orange-400',  border: 'border-orange-500/50',  bg: 'bg-orange-500/10',  glow: 'shadow-orange-500/20',  primary: '#ea580c', borderSolid: 'border-orange-500',  bgSolid: 'bg-orange-500',  progress: 'bg-orange-500',  accent: 'border-orange-500',  ring: 'ring-orange-500' },
  dead_fleet:   { text: 'text-rose-400',    border: 'border-rose-500/50',    bg: 'bg-rose-500/10',    glow: 'shadow-rose-500/20',    primary: '#e11d48', borderSolid: 'border-rose-500',    bgSolid: 'bg-rose-500',    progress: 'bg-rose-500',    accent: 'border-rose-500',    ring: 'ring-rose-500' },
  snow_wolves:  { text: 'text-blue-400',    border: 'border-blue-500/50',    bg: 'bg-blue-500/10',    glow: 'shadow-blue-500/20',    primary: '#2563eb', borderSolid: 'border-blue-500',    bgSolid: 'bg-blue-500',    progress: 'bg-blue-500',    accent: 'border-blue-500',    ring: 'ring-blue-500' },
};

export const getFactionColors = (faction: FactionID) => {
  // Default to polaris for unknown factions
  return FACTION_STYLES[faction] ?? FACTION_STYLES.polaris;
};

export const factionDisplayNames: Record<FactionID, string> = {
  polaris: 'Полярис',
  protectorate: 'Протекторат',
  mercenaries: 'Наёмники',
  rutenia: 'Рутения',
  dead_fleet: 'Мёртвый Флот',
  snow_wolves: 'Снежные Волки',
};

/** Faction logo images (PNG with transparency). Mercenaries has no logo (text fallback). */
export const factionLogos: Partial<Record<FactionID, string>> = {
  polaris: '/images/factions/polaris.png',
  protectorate: '/images/factions/protectorate.png',
  rutenia: '/images/factions/rutenia.png',
  mercenaries: '/images/factions/mercenaries.png',
  dead_fleet: '/images/factions/dead_fleet.png',
  snow_wolves: '/images/factions/snow_wolves.png',
};
