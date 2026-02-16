import type { ArmyUnit, Squad, Machine, FactionID } from '@/lib/types';

export type CardMode = 'add' | 'remove' | 'view';

export interface UnifiedCompactCardProps {
  unit: ArmyUnit | Squad | Machine;
  mode: CardMode;
  onAction?: (unit: ArmyUnit | Squad | Machine) => void;
  onClick?: (unit: ArmyUnit | Squad | Machine) => void;
  factionId: FactionID;
  canAfford?: boolean;
  countInArmy?: number;
  dataTestId?: string;
  readonly?: boolean;
}
