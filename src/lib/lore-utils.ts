import { Location } from '@/lib/types';

interface EncyclopediaLoreCheck {
  traditions?: string;
  keyBattles?: { length: number };
  locations?: { length: number };
}

export function hasLoreExpansion(encyclopedia?: EncyclopediaLoreCheck): boolean {
  return Boolean(
    encyclopedia?.traditions ||
    (encyclopedia?.keyBattles && encyclopedia.keyBattles.length > 0) ||
    (encyclopedia?.locations && encyclopedia.locations.length > 0)
  );
}

// TODO: Implement year formatting logic (e.g., "3410 год" -> "3410")
// Kept for future enhancement when we standardize date formats
export function formatBattleYear(year: string): string {
  return year;
}

export function getLocationIcon(type: Location['type']): string {
  const icons = {
    base: '🏠',
    academy: '🎓',
    battlefield: '⚔️',
    homeworld: '🌍'
  };
  return icons[type] || '📍';
}
