'use client';

import React from 'react';
import { Army, FactionID } from '@/lib/types';
import { CompactArmyCard } from '../CompactArmyCard';

export interface PrepArmyListProps {
  army: Army;
  factionId: FactionID;
}

/**
 * PrepArmyList - Readonly army list component for battle preparation screen
 *
 * Displays:
 * - Army summary (unit count with proper Russian pluralization, total cost)
 * - Readonly list of army units using CompactArmyCard
 * - Empty state when army has no units
 */
export function PrepArmyList({ army, factionId }: PrepArmyListProps) {
  // Get unit count with proper Russian pluralization
  const getUnitCountText = (count: number): string => {
    if (count === 1) return '1 юнит';
    if (count >= 2 && count <= 4) return `${count} юнита`;
    return `${count} юнитов`;
  };

  // Get cost with proper Russian pluralization
  const getCostText = (cost: number): string => {
    if (cost === 1) return '1 очко';
    if (cost >= 2 && cost <= 4) return `${cost} очка`;
    return `${cost} очков`;
  };

  return (
    <div
      className="space-y-4"
      data-testid="prep-army-list"
    >
      {/* Header with army stats */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
          Состав армии
        </h3>
        <span className="text-xs font-mono text-slate-500">
          {getUnitCountText(army.units.length)} • {getCostText(army.totalCost)}
        </span>
      </div>

      {/* Unit list */}
      <div className="space-y-2" data-testid="army-list-prep">
        {army.units.map((unit) => (
          <CompactArmyCard
            key={unit.instanceId}
            unit={unit}
            onRemove={() => {}}
            onClick={undefined}
            factionId={factionId}
            dataTestId={`prep-unit-${unit.instanceId}`}
            readonly
          />
        ))}
      </div>

      {/* Empty state */}
      {army.units.length === 0 && (
        <div className="text-center py-12 px-4">
          <p className="text-slate-400">Армия пуста. Вернитесь к сбору армии.</p>
        </div>
      )}
    </div>
  );
}
