// Army List Source types
export type SourceID = string; // 'star_system', 'tehnolog', or custom IDs
export type FactionID = string; // Dynamic per source (was union type)

// Rules version selection
export type RulesVersionID = 'tehnolog' | 'community_star_system';

// UI Control types
export type ViewMode = 'browse' | 'army';
export type DisplayMode = 'compact' | 'detailed';
export type FilterType = 'all' | 'squad' | 'machine' | 'mercenary' | 'selected';

export interface Faction {
  id: FactionID;
  name: string;
  color: string;
  symbol?: string;
  description: string;
  homeWorld: string;
  motto: string;
}

export interface KeyBattle {
  name: string;
  year: string;
  description: string;
  outcome: string;
}

export interface Location {
  name: string;
  type: 'base' | 'academy' | 'battlefield' | 'homeworld';
  description: string;
}

export interface EncyclopediaData {
  class?: string;
  lore?: string;
  tactics?: string;
  history?: string;
  manufacturer?: string;
  sourceUrl?: string;
  // NEW FIELDS - all optional:
  traditions?: string;
  keyBattles?: KeyBattle[];
  locations?: Location[];
}

export interface ArmyListSource {
  id: SourceID;
  name: string;
  description: string;
  link?: string;
  version: string;
}

export interface SourceData {
  source: ArmyListSource;
  factions: Faction[];
  squads: Squad[];
  machines: Machine[];
}

export interface Soldier {
  num?: number;         // Soldier number in squad (from Excel)
  rank: number;
  speed: number;
  range: string;
  power: string;
  melee: number;
  modifiers?: string[];  // Modifier IDs from catalog
  armor: number;
  image?: string;
  isPilot?: boolean;        // Marks soldier as currently piloting a machine
  pilotOfInstanceId?: string; // Which machine instance this soldier is piloting
}

export interface Squad {
  id: string;
  name: string;
  shortName?: string;
  faction: FactionID;
  cost: number;
  encyclopedia?: EncyclopediaData;
  soldiers: Soldier[];
  buffs?: import('./modifier-types').BuffDefinition[];
  image?: string;
  originalUrl?: string;
}

export interface SpeedSector {
  min_durability: number;
  max_durability: number;
  speed: number;
}

// Special weapon effects (Panov rules)
export interface AoEEffect {
  type: 'aoe';
  radius: number; // Количество hex-ов радиуса
  damage: string; // Формула урона для зоны
}

export interface RepairEffect {
  type: 'repair';
  amount: number; // Количество восстанавливаемой прочности
  range?: number; // Радиус действия (для ремонта соседних юнитов)
}

export interface BurstEffect {
  type: 'burst';
  count: number; // Количество выстрелов
  directions: string[]; // Направления ['вперёд', 'влево-вперёд', 'вправо-вперёд']
}

export type WeaponSpecial = AoEEffect | RepairEffect | BurstEffect | string;

// Fortification types for cover mechanics (feature 003)
export type FortificationType = 'none' | 'light' | 'heavy';

export interface FortificationModifiers {
  armor: number;     // For official rules (tehnolog) - adds to target armor
  distance: number;  // For fan rules (panov) - adds to effective distance
}

export const FORTIFICATION_MODIFIERS: Record<FortificationType, FortificationModifiers> = {
  none: { armor: 0, distance: 0 },
  light: { armor: 1, distance: 1 },
  heavy: { armor: 2, distance: 2 } // >50% cover (bunker, fortified)
};

// Durability zones for fan rules vehicle damage (feature 003)
export interface DurabilityZone {
  max: number;
  color: 'green' | 'yellow' | 'red';
  damagePerDie: {
    D6: number;
    D12: number;
    D20: number;
  };
}

export interface Weapon {
  name: string;
  range: string;
  power: string;
  special?: WeaponSpecial;
  description?: string;    // Описание оружия (история, характеристики)
  manufacturer?: string;   // Производитель оружия
  ammo?: number;           // Per-weapon ammo (only for community_star_system)
}

export interface Machine {
  id: string;
  name: string;
  shortName?: string;
  faction: FactionID;
  cost: number;
  encyclopedia?: EncyclopediaData;
  rank: number;
  fire_rate: number;
  ammo_max: number;
  durability_max: number;
  currentDurability?: number; // Runtime durability state (for game sessions)
  speed_sectors: SpeedSector[];
  weapons: Weapon[];
  image?: string;
  originalUrl?: string;
  durabilityZones?: DurabilityZone[]; // Optional for fan rules vehicle damage
  // New fields for lore and detailed descriptions
  class?: string;           // Класс техники (например, "Линейная бронетехника", "Штурмовая бронетехника")
  type?: string;            // Тип (например, "Шагающий танк", "Гусеничная машина", "Гравилет")
  developer?: string;       // Разработчик/производитель
  monoblock?: string;       // Тип моноблока (например, "РМ-1", "УМ-2")
  mass?: string;            // Масса
  crew?: string;            // Экипаж
  description?: string;     // Краткое описание машины (1-2 предложения)
  sourceUrl?: string;       // Ссылка на оригинальную статью с полным описанием
  lore?: string;            // Полная история и лор (не используется, оставлен для совместимости)
  buffs?: import('./modifier-types').BuffDefinition[];
}

// Pilot information for machines
export interface PilotInfo {
  squadInstanceId: string;  // Which squad the pilot comes from
  soldierIndex: number;     // Which soldier in that squad
  pilotArmor: number;       // Armor value of the pilot (Бр)
  alive: boolean;           // Is pilot alive
}

export interface ArmyUnit {
  instanceId: string;
  type: 'squad' | 'machine';
  data: Squad | Machine;
  // Unit numbering for identification
  instanceNumber?: number; // Sequential number per unit type, e.g., 1, 2, 3...
  // Current state in game
  currentDurability?: number;
  currentAmmo?: number;
  weaponAmmo?: number[];  // Current ammo per weapon [weapon0Ammo, weapon1Ammo, ...]
  grenadesUsed?: boolean;
  deadSoldiers?: number[]; // indices of dead soldiers
  actionsUsed?: {
    moved: boolean;
    shot: boolean;
    melee: boolean;
    done: boolean;
  }[]; // for soldiers or single for machine
  isMachineMoved?: boolean;
  isMachineShot?: boolean;
  isMachineMelee?: boolean;
  isMachineDone?: boolean;
  machineShotsUsed?: number; // количество выстрелов в этом ходу
  machineWeaponShots?: { [weaponIndex: number]: number }; // количество выстрелов из каждого оружия
  pilotInfo?: PilotInfo;     // Pilot information for machines
  // Selected weapon indices for machines (optional for backward compatibility)
  // undefined = all weapons selected (backward compatible)
  // [] = no weapons selected (unarmed variant)
  // [0, 2, 4] = only weapons at indices 0, 2, 4 are equipped
  selectedWeaponIndices?: number[]; // Indices into machine.weapons array
  panicState?: PanicState[]; // Список паникующих солдат
  panicTestUsed?: boolean;   // Паника проведена (единожды за игру для Star System)
  // Modifier system
  activeDebuffs?: import('./modifier-types').ActiveDebuff[];
  activeBuffs?: import('./modifier-types').ActiveBuff[];  // Temporary buffs applied during battle
  soldierModifiers?: import('./modifier-types').SoldierModifier[];  // Modifiers applied to individual soldiers
  buffsUsed?: string[];      // IDs of consumed one-time-use buffs
  soldierAbilitiesUsed?: string[];  // "catalogId_soldierIndex" — abilities consumed this battle
}

export type ArmyCurrentStep = 'faction-select' | 'unit-select' | 'preparation' | 'battle';

export interface Army {
  name: string;
  faction?: FactionID; // Optional during army building flow
  sourceId?: SourceID; // Track which source this army uses
  units: ArmyUnit[];
  totalCost: number;
  // Army Building Flow extensions
  pointBudget?: number;
  currentStep?: ArmyCurrentStep;
  isInBattle?: boolean;
  isLoading?: boolean;
  loadError?: string;
  currentTurn?: number; // Starts at 1, increments with each new turn
  lastBattleDate?: string; // ISO timestamp when battle was started
  missionId?: string | null; // Selected mission id, FREE_PLAY_MISSION_ID, or null
}

// Rules version selection
export interface HitResult {
  success: boolean;
  roll: number;
  total: number;
  rolls?: number[];  // All dice rolls for visualization (e.g., [4, 6] for "2D6+1")
  bonus?: number;     // Bonus added to max roll (e.g., +1 for "2D6+1")
  isGrenade?: boolean; // For grenade throws, marks that this is a distance check
}

export interface DamageResult {
  damage: number;
  rolls: number[];
  special?: {
    type: 'aoe' | 'repair' | 'burst';
    description: string;
    additionalDamage?: number;
    targets?: string[];
  };
  isSurpriseAttack?: boolean; // Surprise attack from behind (rolled twice)
  bothRolls?: number[][]; // Both damage roll sets when surprise attack
}

export interface MeleeResult {
  attackerRoll: number;
  attackerTotal: number;
  defenderRoll: number;
  defenderTotal: number;
  winner: 'attacker' | 'defender' | 'draw';
  isSurpriseAttack?: boolean; // Fan rules: surprise attack from behind
  attackerRolls?: number[]; // Fan rules: both attacker rolls when surprise attack
}

// Panic system types
export interface PanicState {
  soldierIndex: number;
  testRoll: number;
  rank: number;
  triggeredAtTurn: number;
}

export interface PanicTestResult {
  soldierIndex: number;
  isPanic: boolean;
  roll: number;
  rank: number;
}

export type CalculateHitFn = (rangeStr: string, distanceSteps: number, fortification?: FortificationType) => HitResult;
export type CalculateDamageFn = (powerStr: string, targetArmor: number, fortification?: FortificationType, special?: WeaponSpecial, isVehicle?: boolean, currentDurability?: number, durabilityMax?: number, vehicleData?: Machine) => DamageResult;
export type CalculateMeleeFn = (attackerMelee: number, defenderMelee: number) => MeleeResult;

export interface RulesVersion {
  id: RulesVersionID;
  name: string;
  source: string;
  description?: string;      // 2-3 sentence explanation in Russian
  features?: string[];       // Array of key differences/abilities in Russian
  color?: string;            // Hex color code for visual theme (e.g., "#ef4444")
  link?: string;             // External link (e.g., VK community)
  calculateHit: CalculateHitFn;
  calculateDamage: CalculateDamageFn;
  calculateMelee: CalculateMeleeFn;
  supportsSpecialEffects: boolean; // Community rules support special-effects (AoE, Repair, Burst)
}
