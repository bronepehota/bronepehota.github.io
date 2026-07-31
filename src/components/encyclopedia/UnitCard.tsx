import Link from 'next/link';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EncyclopediaUnit, getUnitCostForSource } from '@/lib/encyclopedia-registry';
import { getFactionColors, factionLogos } from '@/lib/faction-colors';
import { SQUAD_GROUP_IMAGE } from '@/lib/painted-images';

interface UnitCardProps {
  unit: EncyclopediaUnit;
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

  // Get cost from the unit's first source (single source of truth = the source
  // army list, read via the registry — not a duplicated field on the encyclopedia record)
  const firstSource = unit.sources[0];
  const cost = (firstSource && getUnitCostForSource(unit.id, firstSource.id)) || 0;

  // Get display image: prefer the wide "squad assembled" group photo when available,
  // else fall back to the per-soldier card art (first soldier).
  const hasGroup = !!SQUAD_GROUP_IMAGE[unit.id];
  const displayImage = hasGroup ? SQUAD_GROUP_IMAGE[unit.id] : (unit.image || '/images/placeholder.png');

  // Faction logo (if available); mercenaries falls back to a text badge
  const logo = factionLogos[unit.faction];

  return (
    <Link
      href={`/encyclopedia/unit/${unit.id}`}
      className="block group h-full"
      data-testid={`unit-card-${unit.id}`}
    >
      <div className="relative folded-paper military-corners overflow-hidden transition-all duration-300 hover:scale-[1.02]">
        {/* Image container with tactical overlay. Group-photo units use a wide
            3:2 frame (whole squad visible); others stay portrait 3:4. */}
        <div className={`relative w-full overflow-hidden ${hasGroup ? 'aspect-[3/2]' : 'aspect-[3/4]'}`}>
          {/* Unit image */}
          <GitHubPagesImage
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

          {/* Faction badge - logo (or text fallback for mercenaries) */}
          <div className="absolute top-2 left-2">
            <div
              className="relative w-9 h-9 flex items-center justify-center backdrop-blur-md rounded-sm overflow-hidden"
              style={{
                backgroundColor: `${factionStyle.glow}`,
                border: `1px solid ${factionStyle.border}`,
              }}
            >
              {logo ? (
                <div className="absolute inset-1">
                  <GitHubPagesImage src={logo} alt={unit.faction} fill className="object-contain" />
                </div>
              ) : (
                <span className="font-ibm-mono text-[9px] font-bold text-white tracking-wider">
                  {factionBadges[unit.faction]}
                </span>
              )}
            </div>
          </div>

          {/* Cost badge - bottom left */}
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1 backdrop-blur-sm bg-military-dark/80 px-2 py-1 rounded border border-military-rust/30">
              <span className="text-military-amber text-sm">⬡</span>
              <span className="font-ibm-mono text-xs font-bold text-white">
                {cost}
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
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-10 bg-gradient-to-t from-military-dark via-military-dark/95 to-transparent">
          {/* Unit name */}
          <h3 className="font-russo font-bold text-white text-sm mb-1 line-clamp-2 group-hover:text-military-amber transition-colors">
            {unit.name}
          </h3>

          {/* Short description (one-liner role summary), clamped to 2 lines for mobile safety */}
          <p className="font-oswald text-[11px] leading-snug text-military-taupe/80 mb-1.5 line-clamp-2">
            {unit.encyclopedia?.shortDescription || unit.encyclopedia?.class || (unit.type === 'squad' ? 'Отряд' : unit.type === 'орудие' ? 'Орудие' : 'Машина')}
          </p>

          {/* Tactical decoration line */}
          <div className="h-px bg-gradient-to-r from-military-rust/50 via-military-amber/30 to-transparent" />
        </div>

        {/* Corner bracket accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-military-rust/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-military-rust/40" />
      </div>
    </Link>
  );
}
