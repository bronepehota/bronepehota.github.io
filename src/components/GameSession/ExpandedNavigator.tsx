'use client';

import { useMemo } from 'react';
import { Army, ArmyUnit, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { deriveUnitStatus, UnitStatus } from '@/lib/unit-status';
import { ExpandedUnitCard } from './ExpandedUnitCard';

interface ExpandedNavigatorProps {
  army: Army;
  focusedUnitIdx: number;
  onSelectUnit: (idx: number) => void;
}

interface SectionConfig {
  key: UnitStatus;
  label: string;
  indicatorColor: string;
  borderColor: string;
  countBg: string;
  countText: string;
}

const sections: SectionConfig[] = [
  {
    key: 'active',
    label: 'Активные',
    indicatorColor: '',
    borderColor: '',
    countBg: '',
    countText: '',
  },
  {
    key: 'done',
    label: 'Походили',
    indicatorColor: '#22c55e',
    borderColor: 'border-b-green-900',
    countBg: 'bg-green-500/15',
    countText: 'text-green-400',
  },
  {
    key: 'dead',
    label: 'Убитые',
    indicatorColor: '#991b1b',
    borderColor: 'border-b-red-900',
    countBg: 'bg-red-500/15',
    countText: 'text-red-400',
  },
];

export function ExpandedNavigator({ army, focusedUnitIdx, onSelectUnit }: ExpandedNavigatorProps) {
  const faction = (army.faction || 'polaris') as FactionID;
  const factionColors = getFactionColors(faction);

  const grouped = useMemo(() => {
    const groups: Record<UnitStatus, Array<{ unit: ArmyUnit; idx: number }>> = {
      active: [],
      done: [],
      dead: [],
    };
    army.units.forEach((unit, idx) => {
      const status = deriveUnitStatus(unit);
      groups[status].push({ unit, idx });
    });
    return groups;
  }, [army.units]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" data-testid="expanded-navigator">
      <div className="flex items-center px-3.5 py-2.5 bg-gradient-to-b from-[#0f1623] to-[#0a0e17] border-b border-slate-800">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">
          Полевой обзор
        </span>
        <span className="ml-auto text-slate-600 text-[11px]">
          ⟷ свайп вниз
        </span>
      </div>

      {sections.map((sectionConfig) => {
        const items = grouped[sectionConfig.key];
        const isActiveSection = sectionConfig.key === 'active';

        return (
          <div
            key={sectionConfig.key}
            className="px-3.5 py-2.5"
            role="region"
            aria-label={`${sectionConfig.label} юниты`}
          >
            <div className={cn(
              'flex items-center gap-2 mb-2.5 pb-1.5 border-b',
              isActiveSection ? 'border-b-slate-700' : sectionConfig.borderColor
            )}>
              <div
                className="w-2 h-2 shrink-0"
                style={{
                  backgroundColor: isActiveSection ? factionColors.primary : sectionConfig.indicatorColor,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                }}
              />
              <span className={cn(
                'text-[11px] uppercase tracking-[2px] font-semibold',
                isActiveSection ? 'text-slate-400' :
                sectionConfig.key === 'done' ? 'text-green-300' : 'text-red-300'
              )}>
                {sectionConfig.label}
              </span>
              <span
                className={cn(
                  'ml-auto text-[10px] px-2 py-0.5 rounded-sm font-bold',
                  isActiveSection
                    ? cn('bg-slate-500/15', factionColors.text)
                    : cn(sectionConfig.countBg, sectionConfig.countText)
                )}
                aria-label={`${items.length} юнитов`}
              >
                {items.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {items.map(({ unit, idx }) => (
                <ExpandedUnitCard
                  key={unit.instanceId}
                  unit={unit}
                  isActive={focusedUnitIdx === idx}
                  section={sectionConfig.key}
                  isMachine={unit.type === 'machine'}
                  onClick={() => onSelectUnit(idx)}
                  faction={faction}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
