import type { FactionID } from './types';

export const getFactionColors = (faction: FactionID) => {
  // Default to polaris for unknown factions
  const safeFaction = faction === 'polaris' || faction === 'protectorate' || faction === 'mercenaries'
    ? faction
    : 'polaris';

  return {
    text: safeFaction === 'polaris' ? 'text-red-400' :
          safeFaction === 'protectorate' ? 'text-cyan-400' : 'text-yellow-400',
    border: safeFaction === 'polaris' ? 'border-red-500/50' :
             safeFaction === 'protectorate' ? 'border-cyan-500/50' : 'border-yellow-500/50',
    bg: safeFaction === 'polaris' ? 'bg-red-500/10' :
         safeFaction === 'protectorate' ? 'bg-cyan-500/10' : 'bg-yellow-500/10',
    glow: safeFaction === 'polaris' ? 'shadow-red-500/20' :
           safeFaction === 'protectorate' ? 'shadow-cyan-500/20' : 'shadow-yellow-500/20',
    primary: safeFaction === 'polaris' ? '#ef4444' :
              safeFaction === 'protectorate' ? '#06b6d4' : '#eab308',
    borderSolid: safeFaction === 'polaris' ? 'border-red-500' :
                  safeFaction === 'protectorate' ? 'border-cyan-500' : 'border-yellow-500',
    bgSolid: safeFaction === 'polaris' ? 'bg-red-500' :
              safeFaction === 'protectorate' ? 'bg-cyan-500' : 'bg-yellow-500',
    progress: safeFaction === 'polaris' ? 'bg-red-500' :
               safeFaction === 'protectorate' ? 'bg-cyan-500' : 'bg-yellow-500',
    accent: safeFaction === 'polaris' ? 'border-red-500' :
             safeFaction === 'protectorate' ? 'border-cyan-500' : 'border-yellow-500',
    ring: safeFaction === 'polaris' ? 'ring-red-500' :
           safeFaction === 'protectorate' ? 'ring-cyan-500' : 'ring-yellow-500',
  };
};

export const factionDisplayNames: Record<FactionID, string> = {
  polaris: 'Полярис',
  protectorate: 'Протекторат',
  mercenaries: 'Наёмники',
};
