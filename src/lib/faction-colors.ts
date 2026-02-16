import type { FactionID } from './types';

export const getFactionColors = (faction: FactionID) => {
  // Default to polaris for unknown factions
  const safeFaction = faction === 'polaris' || faction === 'protectorate' || faction === 'mercenaries'
    ? faction
    : 'polaris';

  return {
    text: safeFaction === 'polaris' ? 'text-red-400' :
          safeFaction === 'protectorate' ? 'text-blue-400' : 'text-yellow-400',
    border: safeFaction === 'polaris' ? 'border-red-500/50' :
             safeFaction === 'protectorate' ? 'border-blue-500/50' : 'border-yellow-500/50',
    bg: safeFaction === 'polaris' ? 'bg-red-500/10' :
         safeFaction === 'protectorate' ? 'bg-blue-500/10' : 'bg-yellow-500/10',
    glow: safeFaction === 'polaris' ? 'shadow-red-500/20' :
           safeFaction === 'protectorate' ? 'shadow-blue-500/20' : 'shadow-yellow-500/20',
    primary: safeFaction === 'polaris' ? '#ef4444' :
              safeFaction === 'protectorate' ? '#3b82f6' : '#eab308',
    borderSolid: safeFaction === 'polaris' ? 'border-red-500' :
                  safeFaction === 'protectorate' ? 'border-blue-500' : 'border-yellow-500',
    bgSolid: safeFaction === 'polaris' ? 'bg-red-500' :
              safeFaction === 'protectorate' ? 'bg-blue-500' : 'bg-yellow-500',
    progress: safeFaction === 'polaris' ? 'bg-red-500' :
               safeFaction === 'protectorate' ? 'bg-blue-500' : 'bg-yellow-500',
    accent: safeFaction === 'polaris' ? 'border-red-500' :
             safeFaction === 'protectorate' ? 'border-blue-500' : 'border-yellow-500',
  };
};

export const factionDisplayNames: Record<FactionID, string> = {
  polaris: 'Полярис',
  protectorate: 'Протекторат',
  mercenaries: 'Наёмники',
};
