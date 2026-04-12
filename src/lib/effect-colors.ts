/**
 * Effect color utility — assigns unique, deterministic colors to combat effects.
 * Uses a DJB2 hash on the effect ID to pick from a 12-color palette.
 */

export interface EffectColorStyles {
  border: string;
  bg: string;
  icon: string;
  label: string;
  glow: string;
}

export interface EffectColor {
  name: string;
  hex: string;
}

const PALETTE: EffectColor[] = [
  { name: 'emerald', hex: '#10b981' },
  { name: 'amber',   hex: '#f59e0b' },
  { name: 'cyan',    hex: '#06b6d4' },
  { name: 'rose',    hex: '#f43f5e' },
  { name: 'violet',  hex: '#8b5cf6' },
  { name: 'orange',  hex: '#f97316' },
  { name: 'sky',     hex: '#0ea5e9' },
  { name: 'pink',    hex: '#ec4899' },
  { name: 'lime',    hex: '#84cc16' },
  { name: 'fuchsia', hex: '#d946ef' },
  { name: 'teal',    hex: '#14b8a6' },
  { name: 'red',     hex: '#ef4444' },
];

// Full literal Tailwind class strings — required for JIT purge safety
export const COLOR_STYLE_MAP: Record<string, EffectColorStyles> = {
  emerald: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-950/20',
    icon: 'text-emerald-400',
    label: 'text-emerald-500',
    glow: '0 0 8px rgba(16,185,129,0.3)',
  },
  amber: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-950/20',
    icon: 'text-amber-400',
    label: 'text-amber-500',
    glow: '0 0 8px rgba(245,158,11,0.3)',
  },
  cyan: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-950/20',
    icon: 'text-cyan-400',
    label: 'text-cyan-500',
    glow: '0 0 8px rgba(6,182,212,0.3)',
  },
  rose: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-950/20',
    icon: 'text-rose-400',
    label: 'text-rose-500',
    glow: '0 0 8px rgba(244,63,94,0.3)',
  },
  violet: {
    border: 'border-l-violet-500',
    bg: 'bg-violet-950/20',
    icon: 'text-violet-400',
    label: 'text-violet-500',
    glow: '0 0 8px rgba(139,92,246,0.3)',
  },
  orange: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-950/20',
    icon: 'text-orange-400',
    label: 'text-orange-500',
    glow: '0 0 8px rgba(249,115,22,0.3)',
  },
  sky: {
    border: 'border-l-sky-500',
    bg: 'bg-sky-950/20',
    icon: 'text-sky-400',
    label: 'text-sky-500',
    glow: '0 0 8px rgba(14,165,233,0.3)',
  },
  pink: {
    border: 'border-l-pink-500',
    bg: 'bg-pink-950/20',
    icon: 'text-pink-400',
    label: 'text-pink-500',
    glow: '0 0 8px rgba(236,72,153,0.3)',
  },
  lime: {
    border: 'border-l-lime-500',
    bg: 'bg-lime-950/20',
    icon: 'text-lime-400',
    label: 'text-lime-500',
    glow: '0 0 8px rgba(132,204,22,0.3)',
  },
  fuchsia: {
    border: 'border-l-fuchsia-500',
    bg: 'bg-fuchsia-950/20',
    icon: 'text-fuchsia-400',
    label: 'text-fuchsia-500',
    glow: '0 0 8px rgba(217,70,239,0.3)',
  },
  teal: {
    border: 'border-l-teal-500',
    bg: 'bg-teal-950/20',
    icon: 'text-teal-400',
    label: 'text-teal-500',
    glow: '0 0 8px rgba(20,184,166,0.3)',
  },
  red: {
    border: 'border-l-red-500',
    bg: 'bg-red-950/20',
    icon: 'text-red-400',
    label: 'text-red-500',
    glow: '0 0 8px rgba(239,68,68,0.3)',
  },
};

/** DJB2 hash — deterministic, fast, good distribution */
function hashId(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

/** Get palette color entry for an effect ID */
export function getEffectColor(effectId: string): EffectColor {
  const index = hashId(effectId) % PALETTE.length;
  return PALETTE[index];
}

/** Get full Tailwind styles for an effect ID */
export function getEffectStyles(effectId: string): EffectColorStyles {
  const color = getEffectColor(effectId);
  return COLOR_STYLE_MAP[color.name];
}
