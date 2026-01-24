export type FactionID = 'polaris' | 'protectorate' | 'mercenaries';

// Rules version selection
export type RulesVersionID = 'tehnolog' | 'fan';

export interface Faction {
  id: FactionID;
  name: string;
  color: string;
  symbol?: string;
  description: string;
  homeWorld: string;
  motto: string;
}

export interface Soldier {
  rank: number;
  speed: number;
  range: string;
  power: string;
  melee: number;
  props: string[];
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
  soldiers: Soldier[];
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
}

export interface Machine {
  id: string;
  name: string;
  shortName?: string;
  faction: FactionID;
  cost: number;
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
}

export interface Army {
  name: string;
  faction: FactionID;
  units: ArmyUnit[];
  totalCost: number;
  // Army Building Flow extensions
  pointBudget?: number;
  currentStep?: 'faction-select' | 'unit-select' | 'battle';
  isInBattle?: boolean;
  isLoading?: boolean;
  loadError?: string;
  currentTurn?: number; // Starts at 1, increments with each new turn
}

// Rules version selection
export interface HitResult {
  success: boolean;
  roll: number;
  total: number;
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
  calculateHit: CalculateHitFn;
  calculateDamage: CalculateDamageFn;
  calculateMelee: CalculateMeleeFn;
  supportsSpecialEffects: boolean; // Панов поддерживает special-эффекты
}
