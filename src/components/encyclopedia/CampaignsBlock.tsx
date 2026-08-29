import Link from 'next/link';
import { warsEraSpan, type CampaignMeta } from '@/lib/campaigns';

const FACTION_COLORS: Record<string, string> = {
  polaris: '#DC2626',
  protectorate: '#06b6d4',
  mercenaries: '#EAB308',
  // Same blue as the campaign detail page (campaigns/[slug]) — «Первая волна»
  // and «Падение Мидгаарда» roster the Snow Wolves.
  snow_wolves: '#2563eb',
};
const FACTION_LABELS: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
  snow_wolves: 'ВОЛКИ',
};

/**
 * «Хроники войн» — the campaigns section of the encyclopedia history page.
 *
 * The standalone /campaigns list page redirects here (#wars). The block speaks
 * the dossier language of the «ДЕЛО RG-4530» page: the header is a mono
 * requisites line («// ХРОНИКИ ВОЙН · 4451–4546») that ties into the «ВОЙНЫ»
 * stamp of the full-bleed zone divider above (the stamp is NOT repeated
 * here), and each card is a folder of the case — folded paper, military
 * corners and a vertical spine numbered by `order`. Order =
 * getAllCampaigns() (chronological).
 */
export function CampaignsBlock({ campaigns }: { campaigns: CampaignMeta[] }) {
  if (campaigns.length === 0) return null;
  const eraSpan = warsEraSpan(campaigns);

  return (
    <section id="wars" data-testid="campaigns-section" className="mb-8 scroll-mt-6">
      {/* Requisites line (cover mono idiom) — the «ВОЙНЫ» stamp itself lives
          on the era divider of this zone; don't duplicate it as a heading. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3 mb-2 border-b border-military-steel/25">
        <span aria-hidden className="font-ibm-mono text-[10px] text-military-rust">
          {'//'}
        </span>
        <h2
          data-testid="campaigns-title"
          className="font-ibm-mono text-[11px] uppercase tracking-[0.25em] text-military-sand"
        >
          ХРОНИКИ ВОЙН
        </h2>
        {eraSpan && (
          <span className="font-ibm-mono text-[10px] tabular-nums text-military-steel/60">
            {`· ${eraSpan}`}
          </span>
        )}
      </div>
      <p className="text-sm text-military-taupe mt-2 mb-5">
        Связные истории войн за ресурсы и корпоративных конфликтов — с привязкой
        к отрядам и миссиям энциклопедии.
      </p>

      <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
        {campaigns.map((c, i) => (
          <li key={c.slug}>
            {/* Folder of the case: same paper/corners as the chapter sections,
                vertical spine carries the ordinal (frontmatter `order`). */}
            <Link
              href={`/campaigns/${c.slug}`}
              data-testid="campaign-card"
              className="group block folded-paper military-corners relative pl-10 pr-4 py-4 md:pl-11 md:pr-5 md:py-5"
            >
              <span aria-hidden className="history-spine">
                {String(c.order ?? i + 1).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-2 mb-1.5">
                {c.era && (
                  <span className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60">
                    {c.era}
                  </span>
                )}
                {c.factions && c.factions.length > 0 && (
                  <span className="ml-auto flex gap-1.5 shrink-0">
                    {c.factions.map((f) => (
                      <span
                        key={f}
                        title={FACTION_LABELS[f] ?? f}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: FACTION_COLORS[f] ?? '#A8A29E' }}
                      />
                    ))}
                  </span>
                )}
              </div>
              <h3 className="font-oswald text-base md:text-lg uppercase tracking-wide text-military-sand group-hover:text-military-amber transition-colors">
                {c.title}
              </h3>
              {c.subtitle && (
                <p className="text-[13px] md:text-sm leading-relaxed text-military-taupe mt-1.5">
                  {c.subtitle}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 font-ibm-mono text-[10px] uppercase tracking-widest text-military-rust/70 group-hover:text-military-amber transition-colors">
                Читать хронику
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
