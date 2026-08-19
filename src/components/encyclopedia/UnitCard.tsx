import Link from 'next/link';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EncyclopediaUnit, getUnitCostForSource } from '@/lib/encyclopedia-registry';
import { getFactionColors, factionLogos } from '@/lib/faction-colors';
import { SQUAD_GROUP_IMAGE, getCredit } from '@/lib/painted-images';
import { resolveUnitProvenance } from '@/lib/provenance';
import { ALTERNATIVE_VERSION_HINT } from './AttributionLabel';

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
  const provenance = resolveUnitProvenance(unit);
  const isOfficial = provenance.origin === 'tehnolog';

  // Provenance badge: official → Tehnolog logo; fan → specific community logo
  // (from miniatureSource/imageSource), fallback to Star System.
  const sourceCreditId = isOfficial ? 'tehnolog' : (unit.miniatureSource || unit.imageSource || 'star_system');
  const sourceCredit = getCredit(sourceCreditId);
  const badgeLogo = sourceCredit?.logo || '/images/credits/star_system.jpg';
  const badgeName = sourceCredit?.name || (isOfficial ? 'Технолог' : 'Звёздные Системы');

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
          {/* Unit image — lazy: the catalog renders 100+ cards (~360 img /
              ~11 MB); off-screen cards must not compete with the first paint.
              The unit DETAIL hero stays eager (it is the LCP element there). */}
          <GitHubPagesImage
            src={displayImage}
            alt={unit.name}
            fill
            loading="lazy"
            decoding="async"
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
                  <GitHubPagesImage src={logo} alt={unit.faction} fill loading="lazy" decoding="async" className="object-contain" />
                </div>
              ) : (
                <span className="font-ibm-mono text-[9px] font-bold text-white tracking-wider">
                  {factionBadges[unit.faction]}
                </span>
              )}
            </div>
          </div>

          {/* Provenance badge — official (Технолог) / fan (specific community logo) */}
          <div className="absolute top-2 right-2" title={isOfficial ? `Официальный (${badgeName})` : `Фанатское (${badgeName})`}>
            <div
              className="relative h-6 w-6 overflow-hidden rounded-sm backdrop-blur-md border"
              style={{
                backgroundColor: isOfficial ? 'rgba(6, 182, 212, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                borderColor: isOfficial ? 'rgba(6, 182, 212, 0.5)' : 'rgba(245, 158, 11, 0.5)',
              }}
            >
              <GitHubPagesImage
                src={badgeLogo}
                alt={badgeName}
                fill
                loading="lazy"
                decoding="async"
                className="object-contain p-0.5"
              />
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

          {/* Bottom-right: АВБ mark for non-official units (always visible);
              official units keep the decorative «СЕКРЕТНО» hover stamp. */}
          {!isOfficial ? (
            <div className="absolute bottom-2 right-2 z-10" title={ALTERNATIVE_VERSION_HINT}>
              <div className="flex items-center gap-1 rounded border border-emerald-500/50 bg-military-dark/80 px-1.5 py-1 backdrop-blur-sm">
                <GitHubPagesImage
                  src="/images/credits/avb.svg"
                  alt="АВБ"
                  width={14}
                  height={14}
                  loading="lazy"
                  decoding="async"
                  className="shrink-0 rounded-[1px]"
                />
                <span className="font-ibm-mono text-[8px] font-bold tracking-wider text-emerald-300">
                  АВБ
                </span>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="border-2 border-military-rust/60 px-2 py-1 rotate-[-12deg] backdrop-blur-sm">
                <span className="font-ibm-mono text-[8px] text-military-rust tracking-wider">
                  СЕКРЕТНО
                </span>
              </div>
            </div>
          )}
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
