import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Machine } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface SourceLinkProps {
  unit: UnitWithType;
}

export function SourceLink({ unit }: SourceLinkProps) {
  const isMachine = (u: UnitWithType): u is Machine & { type: 'machine' } => {
    return u.type === 'machine';
  };

  const sourceUrl = unit.encyclopedia?.sourceUrl || (isMachine(unit) ? unit.sourceUrl : null);

  if (!sourceUrl) return null;

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors"
    >
      <ExternalLink className="w-4 h-4" />
      Источник
    </a>
  );
}
