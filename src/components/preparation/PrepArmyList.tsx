'use client';

import { Army, Squad } from '@/lib/types';
import SafeImage from '@/components/SafeImage';

interface PrepArmyListProps {
  army: Army;
}

export function PrepArmyList({ army }: PrepArmyListProps) {
  if (army.units.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" data-testid="prep-army-list" role="region" aria-label="Список армии">
        <div className="text-center py-12">
          <p className="text-slate-400">Армия пуста. Вернитесь к сбору армии.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6" data-testid="prep-army-list" role="region" aria-label="Список армии">
      {army.units.map((unit) => {
        const title = unit.instanceNumber && unit.instanceNumber > 1
          ? `${unit.data.name} #${unit.instanceNumber}`
          : unit.data.name;

        if (unit.type === 'squad') {
          const squad = unit.data as Squad;
          return (
            <div key={unit.instanceId} className="space-y-2">
              <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
                {title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {squad.soldiers.map((soldier) => (
                  <div
                    key={soldier.num}
                    className="relative w-[60px] h-[80px] flex-shrink-0"
                  >
                    <SafeImage
                      src={soldier.image || squad.image || '/images/placeholder.png'}
                      alt={`Боец ${soldier.num}`}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Machine
        return (
          <div key={unit.instanceId} className="space-y-2">
            <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
              {title}
            </h3>
            <div className="w-[60px] h-[80px] relative">
              <SafeImage
                src={unit.data.image || '/images/placeholder.png'}
                alt={unit.data.name}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
