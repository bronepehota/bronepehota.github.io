import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Squad, Machine } from '@/lib/types';
import { Shield, Zap, Users, Wrench } from 'lucide-react';

interface UnitStatsProps {
  unit: UnitWithType;
}

export function UnitStats({ unit }: UnitStatsProps) {
  const isSquad = (u: UnitWithType): u is Squad & { type: 'squad' } => {
    return u.type === 'squad';
  };

  const isMachine = (u: UnitWithType): u is Machine & { type: 'machine' } => {
    return u.type === 'machine';
  };

  if (isSquad(unit)) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Характеристики отряда</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem icon={<Users className="w-5 h-5" />} label="Солдат" value={unit.soldiers.length.toString()} />
          <StatItem icon={<Shield className="w-5 h-5" />} label="Броня" value={`${unit.soldiers[0]?.armor || '-'}`} />
          <StatItem icon={<Zap className="w-5 h-5" />} label="Скорость" value={`${unit.soldiers[0]?.speed || '-'}`} />
          <StatItem icon={<Wrench className="w-5 h-5" />} label="Ранг" value={`${unit.soldiers[0]?.rank || '-'}`} />
        </div>
      </div>
    );
  }

  if (isMachine(unit)) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Характеристики машины</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem icon={<Shield className="w-5 h-5" />} label="Прочность" value={unit.durability_max.toString()} />
          <StatItem icon={<Zap className="w-5 h-5" />} label="Скорость" value={getMaxSpeed(unit).toString()} />
          <StatItem icon={<Wrench className="w-5 h-5" />} label="Боекомплект" value={unit.ammo_max.toString()} />
          <StatItem icon={<Users className="w-5 h-5" />} label="Ранг" value={unit.rank.toString()} />
        </div>
        {unit.crew && <div className="text-slate-400 mt-2">Экипаж: {unit.crew}</div>}
        {unit.mass && <div className="text-slate-400">Масса: {unit.mass}</div>}
      </div>
    );
  }

  return null;
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-slate-400">{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-lg font-bold text-white">{value}</div>
      </div>
    </div>
  );
}

function getMaxSpeed(machine: Machine): number {
  return machine.speed_sectors?.[0]?.speed || 0;
}
