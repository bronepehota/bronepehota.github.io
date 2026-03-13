import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { Squad } from '@/lib/types';
import { getFactionColors } from '@/lib/faction-colors';

interface UnitCardProps {
  unit: UnitWithType;
}

const factionBadges: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
};

export function UnitCard({ unit }: UnitCardProps) {
  const factionColors = getFactionColors(unit.faction);
  const factionStyle = {
    bg: factionColors.bgSolid,
    border: factionColors.primary,
    glow: factionColors.primary.replace('#', 'rgba(').replace(/[^,]+/g, (m, i) => {
      if (i === 0) return m;
      const hex = parseInt(m, 16);
      return hex.toString();
    }) + ', 0.3)',
  };

  // Get display image: unit image, first soldier's image (for squads), or placeholder
  const displayImage = unit.image ||
    (unit.type === 'squad' ? (unit as Squad).soldiers[0]?.image : null) ||
    '/images/placeholder.png';

  return (
    <Link
      href={`/encyclopedia/unit/${unit.id}`}
      className="block group"
      data-testid={`unit-card-${unit.id}`}
    >
      <div className="relative folded-paper military-corners overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        {/* Image container with tactical overlay */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {/* Unit image */}
          <SafeImage
            src={displayImage}
            alt={unit.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-military-dark via-military-dark/50 to-transparent opacity-80" />

          {/* Scanline effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(234,88,12,0.05)_50%)] bg-[length:100%_4px]" />
          </div>

          {/* Faction badge - top left */}
          <div className="absolute top-2 left-2">
            <div
              className="px-2 py-1 backdrop-blur-sm rounded-sm"
              style={{
                backgroundColor: `${factionStyle.glow}`,
                border: `1px solid ${factionStyle.border}`,
              }}
            >
              <span className="font-ibm-mono text-[9px] font-bold text-white tracking-wider">
                {factionBadges[unit.faction]}
              </span>
            </div>
          </div>

          {/* Unit type indicator - top right */}
          <div className="absolute top-2 right-2">
            <div className="px-2 py-1 backdrop-blur-sm bg-military-amber/20 border border-military-amber/40 rounded-sm">
              <span className="text-xs">
                {unit.type === 'squad' ? '◆' : '▲'}
              </span>
            </div>
          </div>

          {/* Cost badge - bottom left */}
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1 backdrop-blur-sm bg-military-dark/80 px-2 py-1 rounded border border-military-rust/30">
              <span className="text-military-amber text-sm">⬡</span>
              <span className="font-ibm-mono text-xs font-bold text-white">
                {unit.cost}
              </span>
            </div>
          </div>

          {/* Classification stamp - bottom right (appears on hover) */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="border-2 border-military-rust/60 px-2 py-1 rotate-[-12deg] backdrop-blur-sm">
              <span className="font-ibm-mono text-[8px] text-military-rust tracking-wider">
                СЕКРЕТНО
              </span>
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-military-dark via-military-dark/95 to-transparent">
          {/* Unit name */}
          <h3 className="font-russo font-bold text-white text-sm mb-1 line-clamp-2 group-hover:text-military-amber transition-colors">
            {unit.name}
          </h3>

          {/* Unit class/type */}
          <div className="flex items-center justify-between">
            <span className="font-oswald text-xs text-military-taupe truncate">
              {unit.encyclopedia?.class || (unit.type === 'squad' ? 'Отряд' : 'Машина')}
            </span>
          </div>

          {/* Tactical decoration line */}
          <div className="mt-2 h-px bg-gradient-to-r from-military-rust/50 via-military-amber/30 to-transparent" />
        </div>

        {/* Corner bracket accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-military-rust/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-military-rust/40" />
      </div>
    </Link>
  );
}
