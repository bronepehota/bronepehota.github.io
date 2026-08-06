'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, Skull, Star, Anchor, Target, AlertTriangle } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EnrichedUnit } from '@/lib/encyclopedia-utils';
import { getEncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { cn } from '@/lib/utils';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { SoldierImages } from './UnitDetail/SoldierImages';
import { MachineImages } from './UnitDetail/MachineImages';
import { SQUAD_GROUP_IMAGE, getPhotoCredit, getCredit } from '@/lib/painted-images';
import { resolveUnitProvenance } from '@/lib/provenance';
import { UnitLore } from './UnitDetail/UnitLore';
import { UnitSpecs } from './UnitDetail/UnitSpecs';
import { UnitLoreDetail } from './UnitDetail/UnitLoreDetail';
import type { UnitLoreDoc } from '@/lib/unit-lore';
import { SourceAvailability } from './SourceAvailability';
import { PainterChip, ProvenanceRow, ImageSourceChip, MiniatureChip, SponsorChip, ALTERNATIVE_VERSION_HINT } from './AttributionLabel';
import { FactionLogo } from '@/components/FactionLogo';
import { getFactionColors, factionLogos, factionDisplayNames } from '@/lib/faction-colors';
import { UnitStatTable } from './UnitDetail/UnitStatTable';
import type { Squad, Machine } from '@/lib/types';

interface UnitDetailPageProps {
  unit: EnrichedUnit;
  bySource: Record<string, EnrichedUnit>;
  sourceOrder: string[];
  /** Optional long-form lore doc (rendered by <UnitLoreDetail>). Null when absent. */
  loreDoc?: UnitLoreDoc | null;
}

const factionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  polaris: Shield,
  protectorate: Zap,
  mercenaries: Skull,
  rutenia: Star,
  dead_fleet: Anchor,
};

const factionBadges: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
  rutenia: 'РУТ',
  dead_fleet: 'ФЛОТ',
};

// Faction display name resolves from the faction DATA (canonical full name,
// e.g. «Мёртвый Флот») — NOT a local copy that goes stale when factions are
// added. `factionDisplayNames` is the short-name fallback.

export default function UnitDetailPage({ unit, bySource, sourceOrder, loreDoc }: UnitDetailPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSource, setActiveSource] = useState<string>(sourceOrder[0] ?? unit.sources[0]?.id ?? '');
  const activeUnit = bySource[activeSource] ?? unit;
  const factionColors = getFactionColors(unit.faction);
  const detailLogo = factionLogos[unit.faction];
  // Rank shown next to class — follows the active source (machine.rank / squad soldier ranks).
  const rankLabel = (() => {
    if (activeUnit.type === 'machine') return activeUnit.rank != null ? String(activeUnit.rank) : undefined;
    const rs = (activeUnit.soldiers ?? []).map(s => s.rank).filter(r => r != null);
    if (!rs.length) return undefined;
    const lo = Math.min(...rs), hi = Math.max(...rs);
    return lo === hi ? String(lo) : `${lo}–${hi}`;
  })();
  const faction = {
    name: getEncyclopediaFaction(unit.faction)?.name ?? factionDisplayNames[unit.faction] ?? unit.faction,
    color: factionColors.primary,
    icon: factionIcons[unit.faction] || Shield,
    badge: factionBadges[unit.faction] || '',
  };
  const FactionIcon = faction.icon;
  // Wide group photo shown as a hero banner at the top (only some squads have one)
  const groupPhoto = SQUAD_GROUP_IMAGE[unit.id];
  // АВБ — marks non-«Технолог» units on the hero image (top-left, under the faction badge).
  const isOfficial = resolveUnitProvenance(unit).origin === 'tehnolog';
  const avbStamp = !isOfficial ? (
    <div
      title={ALTERNATIVE_VERSION_HINT}
      className="absolute top-16 left-3 z-10 inline-flex items-center gap-1 rounded border border-emerald-500/50 bg-military-dark/80 px-1.5 py-1 backdrop-blur-sm"
    >
      <GitHubPagesImage src="/images/credits/avb.svg" alt="АВБ" width={14} height={14} className="shrink-0 rounded-[1px]" />
      <span className="font-ibm-mono text-[8px] font-bold tracking-wider text-emerald-300">АВБ</span>
    </div>
  ) : null;
  // Painter credit — shown whenever the squad is attributed (painted), independent
  // of whether a wide group photo exists.
  const photoCredit = getPhotoCredit(unit.id);
  // Render artist for unpainted card-art (from `unit.imageSource`). Absent → Star System,
  // since every unpainted squad render in the app is community Star System art.
  const imageSourceCredit = unit.imageSource ? getCredit(unit.imageSource) : getCredit('star_system');
  // Physical miniature / sculpt maker (from `unit.miniatureSource`, default Tehnolog).
  const miniatureSourceCredit = unit.miniatureSource ? getCredit(unit.miniatureSource) : getCredit('tehnolog');
  const imageCredit = photoCredit ?? imageSourceCredit;
  // Show the sculptor as its OWN chip only when it differs from whoever made the
  // image/paint — otherwise it's redundant (e.g. Lisitsin both rendered & sculpted).
  const sculptorDiffers = !!miniatureSourceCredit && !!imageCredit && miniatureSourceCredit.name !== imageCredit.name;
  // One shared header for the whole attribution strip — painted squads otherwise
  // rendered two stacked `// ПОКРАС` / `// МИНИАТЮРЫ` blocks that looked broken
  // under a wide group photo.
  const attributionHeader = photoCredit
    ? '// ПОКРАС'
    : (sculptorDiffers ? '// ИЗОБРАЖЕНИЯ' : '// ИЗОБРАЖЕНИЯ И МИНИАТЮРЫ');
  // Whether this unit has a lore block rendered by <UnitLore>. When it doesn't,
  // we still attribute the concept origin in the header (loreAuthor is moot).
  const enc = unit.encyclopedia;
  const hasLore = !!(
    enc?.lore || enc?.history || enc?.traditions ||
    (enc?.keyBattles && enc.keyBattles.length > 0) ||
    (enc?.locations && enc.locations.length > 0)
  );

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />

      {/* Radial gradient vignette */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)'
      }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="relative py-6 md:py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back link */}
            <Link
              href="/encyclopedia"
              className={cn(
                'inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm',
                'text-military-rust/60 hover:text-military-amber transition-colors',
                'tracking-widest uppercase mb-5 md:mb-8',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>К энциклопедии</span>
            </Link>

            {/* Title section */}
            <div className={cn('flex gap-6 items-start', groupPhoto ? 'flex-col' : 'flex-col md:flex-row')}>
              {/* Image: wide group-photo hero for some squads, else 3:4 portrait */}
              {groupPhoto ? (
                <figure
                  className={cn(
                    'relative aspect-[3/2] w-full',
                    'folded-paper military-corners overflow-hidden',
                    'fade-in-up opacity-0',
                    isLoaded && 'opacity-100'
                  )}
                  style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
                >
                  <GitHubPagesImage
                    src={groupPhoto}
                    alt={`${unit.name} — отряд в сборе`}
                    fill
                    className="object-cover object-center"
                  />
                  {/* Faction badge - logo (or text fallback for mercenaries) */}
                  <div className="absolute top-3 left-3">
                    <div
                      className="relative w-11 h-11 flex items-center justify-center backdrop-blur-md rounded-sm overflow-hidden"
                      style={{
                        backgroundColor: `${factionColors.primary}33`,
                        border: `1px solid ${factionColors.primary}`,
                      }}
                    >
                      {detailLogo ? (
                        <div className="absolute inset-1">
                          <GitHubPagesImage src={detailLogo} alt={unit.faction} fill className="object-contain" />
                        </div>
                      ) : (
                        <span className="font-ibm-mono text-xs font-bold text-white tracking-wider">
                          {faction.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {avbStamp}
                  <figcaption className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-military-dark/90 to-transparent">
                    <span className="font-ibm-mono text-[10px] text-military-amber/90 uppercase tracking-wider">
                      ◆ Отряд в сборе
                    </span>
                  </figcaption>
                </figure>
              ) : unit.image && (
                <div
                  className={cn(
                    'relative aspect-[3/4] w-full md:w-64 lg:w-80',
                    'folded-paper military-corners overflow-hidden',
                    'fade-in-up opacity-0',
                    isLoaded && 'opacity-100'
                  )}
                  style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
                >
                  {/* Image */}
                  <div className="relative w-full h-full">
                    <GitHubPagesImage
                      src={unit.image}
                      alt={unit.name}
                      fill
                      className="object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-military-dark/60 to-transparent" />
                  </div>

                  {/* Faction badge - logo (or text fallback for mercenaries) */}
                  <div className="absolute top-3 left-3">
                    <div
                      className="relative w-11 h-11 flex items-center justify-center backdrop-blur-md rounded-sm overflow-hidden"
                      style={{
                        backgroundColor: `${factionColors.primary}33`,
                        border: `1px solid ${factionColors.primary}`,
                      }}
                    >
                      {detailLogo ? (
                        <div className="absolute inset-1">
                          <GitHubPagesImage src={detailLogo} alt={unit.faction} fill className="object-contain" />
                        </div>
                      ) : (
                        <span className="font-ibm-mono text-xs font-bold text-white tracking-wider">
                          {faction.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {avbStamp}
                </div>
              )}

              {/* Info section */}
              <div className={cn('flex-1', groupPhoto && 'w-full')}>
                <div
                  className={cn(
                    'fade-in-up opacity-0',
                    isLoaded && 'opacity-100'
                  )}
                  style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
                >
                  {/* Classification stamp */}
                  <div className="mb-3 md:mb-4 inline-block">
                    <div className="border-2 border-military-rust/60 px-3 py-1 rotate-[-2deg]">
                      <span className="font-ibm-mono text-xs text-military-rust tracking-wider">
                        СЕКРЕТНО
                      </span>
                    </div>
                  </div>

                  {/* Unit name */}
                  <h1 className="font-russo font-black text-3xl md:text-4xl lg:text-5xl text-white mb-2 md:mb-3 military-text-gradient">
                    {unit.name}
                  </h1>

                  {/* Faction */}
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${faction.color}20` }}
                    >
                      <div className="w-5 h-5" style={{ color: faction.color }}>
                        <FactionLogo faction={unit.faction} className="w-full h-full" fallback={FactionIcon} />
                      </div>
                    </div>
                    <span
                      className="font-oswald text-lg md:text-xl"
                      style={{ color: faction.color }}
                    >
                      {faction.name}
                    </span>
                  </div>

                  {/* Class + Rank */}
                  {(unit.encyclopedia?.class || rankLabel) && (
                    <div className="mb-4 md:mb-6 flex flex-wrap items-center gap-x-5 gap-y-1">
                      {unit.encyclopedia?.class && (
                        <span>
                          <span className="font-ibm-mono text-xs text-military-steel/60 uppercase tracking-wider mr-2">
                            CLASS
                          </span>
                          <span className="font-oswald text-military-sand">
                            {unit.encyclopedia.class}
                          </span>
                        </span>
                      )}
                      {rankLabel && (
                        <span>
                          <span className="font-ibm-mono text-xs text-military-steel/60 uppercase tracking-wider mr-2">
                            РАНГ
                          </span>
                          <span className="font-oswald text-military-amber">
                            {rankLabel}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attribution: ONE metadata strip (shared header + chips in a single
                      flex-wrap row), mirroring the ProvenanceRow idiom. Painted squads
                      with a separate painter + sculptor previously stacked two
                      double-header blocks — which looked broken under a wide group photo. */}
                  <div className="mb-4 md:mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
                      {attributionHeader}
                    </span>
                    {photoCredit ? (
                      // PAINTED squad → the painter is the salient attribution.
                      <PainterChip
                        name={photoCredit.name}
                        logo={photoCredit.logo}
                        url={photoCredit.url}
                        withHeader={false}
                        withContribute={!hasLore}
                      />
                    ) : sculptorDiffers ? (
                      // UNPAINTED, distinct render + sculpt artists.
                      <ImageSourceChip source={imageSourceCredit} withHeader={false} />
                    ) : (
                      // UNPAINTED, single creator for both render & sculpt → one merged chip.
                      miniatureSourceCredit && (
                        <MiniatureChip
                          name={miniatureSourceCredit.name}
                          logo={miniatureSourceCredit.logo}
                          url={miniatureSourceCredit.url}
                          withHeader={false}
                          role=""
                        />
                      )
                    )}
                    {/* Sculptor — only when it differs from the image/paint creator. Gets its own
                        `// МИНИАТЮРЫ` prefix so it reads as the physical-sculpt credit, NOT part
                        of the paint/image line (otherwise "· модель" was lost under `// ПОКРАС`).
                        Label + chip grouped so they don't split when the strip wraps on mobile. */}
                    {sculptorDiffers && miniatureSourceCredit && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
                          {'// МИНИАТЮРЫ'}
                        </span>
                        <MiniatureChip
                          name={miniatureSourceCredit.name}
                          logo={miniatureSourceCredit.logo}
                          url={miniatureSourceCredit.url}
                          withHeader={false}
                          role=""
                        />
                      </span>
                    )}
                    {/* Squad sponsor — who funded/commissioned the squad (miniatures/lore). */}
                    {unit.sponsor && (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
                          {'// СПОНСОР'}
                        </span>
                        <SponsorChip name={unit.sponsor.name} url={unit.sponsor.url} withHeader={false} />
                      </span>
                    )}
                  </div>

                  {/* Concept-origin attribution for units with NO lore block (loreAuthor is moot then). */}
                  {!hasLore && (
                    <div className="mb-6">
                      <ProvenanceRow
                        provenance={resolveUnitProvenance(unit)}
                        originOnly
                        withHeader={false}
                      />
                    </div>
                  )}

                  {/* Divider */}
                  <div className="military-divider max-w-xs mb-4 md:mb-6" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content sections */}
        <main className="px-4 pb-20">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Provisional-stats disclaimer (heroes): stats are approximate, not canon */}
            {unit.statsNote && (
              <section
                className={cn(
                  'folded-paper military-corners p-4 border-amber-500/40',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100'
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.45s' }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-oswald text-amber-400 text-sm uppercase tracking-wider mb-1">
                      Предварительные данные
                    </div>
                    <p className="text-military-sand/70 text-sm leading-relaxed">{unit.statsNote}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Common army-list switcher — always shows the source list (a single
                pill for one-source units; clickable pills when 2+). Controls BOTH
                the personnel and the combat stats below it. */}
            <SourceAvailability
              unit={unit}
              variant="detail"
              activeSource={activeSource}
              onSourceChange={unit.sources.length > 1 ? setActiveSource : undefined}
            />

            {/* Личный состав — personnel portraits, follows the active source */}
            <SoldierImages unit={activeUnit} />

            {/* Характеристики — spec plate (ТТХ): physical specs (mass, crew, моноблок,
                разработчик). Constants of the machine, so base `unit` (not source-switched). */}
            <UnitSpecs unit={unit} />

            {/* Боевой расчёт — full stat table, follows the active source */}
            <UnitStatTable unit={activeUnit as unknown as Squad | Machine} type={unit.type} />

            {/* Tactics */}
            {activeUnit.encyclopedia?.tactics && (
              <section className="folded-paper military-corners p-6">
                <h2 className="font-oswald text-lg text-military-sand mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-military-rust" /> Тактика применения
                </h2>
                <p className="text-military-sand/80 leading-relaxed text-sm">
                  {activeUnit.encyclopedia.tactics}
                </p>
              </section>
            )}

            {/* Lore, Traditions, Battles, Locations sections */}
            <UnitLore unit={unit} />

            {/* Long-form lore («Читать подробнее») — only when a .md doc exists for this unit. */}
            {loreDoc && <UnitLoreDetail doc={loreDoc} />}

            {/* Buffs section */}
            {unit.buffs && unit.buffs.length > 0 && (
              <section
                className={cn(
                  'folded-paper military-corners p-6',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100'
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.75s' }}
              >
                <h2 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
                  <ModifierIcon size={20} className="text-emerald-500" />
                  Бафы
                </h2>
                <div className="space-y-3">
                  {unit.buffs.map(buff => (
                    <div key={buff.id} className="flex items-start gap-3 p-3 rounded-lg bg-military-dark/50 border border-military-steel/30">
                      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-900/30 text-emerald-500">
                        <ModifierIcon name={buff.icon} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-oswald text-sm text-white">{buff.name}</span>
                          {buff.applyTo.map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-ibm-mono bg-emerald-900/40 border border-emerald-600/30 text-emerald-400 uppercase">
                              {t === 'army' ? 'армия' : t === 'machine' ? 'машина' : 'солдат'}
                            </span>
                          ))}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-ibm-mono bg-military-steel/30 border border-military-steel/40 text-military-steel uppercase">
                            {buff.phase === 'always' ? 'всегда' : buff.phase === 'shot' ? 'стрельба' : buff.phase === 'melee' ? 'ББ' : buff.phase}
                          </span>
                        </div>
                        <p className="text-xs text-military-sand/60 mt-1">{buff.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Machine Images section */}
            <section
              className={cn(
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.85s' }}
            >
              <MachineImages unit={unit} />
            </section>
          </div>
        </main>

        {/* Footer */}
        <div className="max-w-6xl mx-auto">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
