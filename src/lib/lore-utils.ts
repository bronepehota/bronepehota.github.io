import { KeyBattle, Location } from '@/lib/types';

export function hasLoreExpansion(encyclopedia?: any): boolean {
  return Boolean(
    encyclopedia?.traditions ||
    (encyclopedia?.keyBattles && encyclopedia.keyBattles.length > 0) ||
    (encyclopedia?.locations && encyclopedia.locations.length > 0)
  );
}

export function formatBattleYear(year: string): string {
  // Could add formatting logic later
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
