import { RulesVersion, RulesVersionID } from './types';
import { tehnologRules } from './rules/tehnolog';
import { communityStarSystemRules } from './rules/community_star_system';

// Rules version registry with type safety
export const rulesRegistry: Record<RulesVersionID, RulesVersion> = {
  tehnolog: tehnologRules,
  community_star_system: communityStarSystemRules,
};

// Get default rules version
export function getDefaultRulesVersion(): RulesVersionID {
  return 'tehnolog';
}

// Get rules version object by ID
export function getRulesVersion(id: RulesVersionID): RulesVersion {
  return rulesRegistry[id];
}

// Get all available rules versions
export function getAllRulesVersions(): RulesVersion[] {
  return Object.values(rulesRegistry);
}

// Validate if a string is a valid rules version ID
export function isValidRulesVersion(id: string): id is RulesVersionID {
  return Object.keys(rulesRegistry).includes(id);
}
