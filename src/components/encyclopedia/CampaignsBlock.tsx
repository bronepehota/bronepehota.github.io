import Link from 'next/link';
import type { CampaignMeta } from '@/lib/campaigns';

const FACTION_COLORS: Record<string, string> = {
  polaris: '#DC2626',
  protectorate: '#06b6d4',
  mercenaries: '#EAB308',
};
const FACTION_LABELS: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
};

/**
 * «Хроники войн» — the campaigns section of the encyclopedia history page.
 *
 * The standalone /campaigns list page redirects here (#wars); the section
 * keeps the dossier idiom of the history page (folded-paper section, rust
 * mono marker, era labels) while cards carry the chronicle cues from the
 * former list page: hud-green epoch tags, faction pips and the
 * «Читать хронику →» affordance. Order = getAllCampaigns() (chronological).
 */
export function CampaignsBlock({ campaigns }: { campaigns: CampaignMeta[] }) {
  if (campaigns.length === 0) return null;

  return (
    <section
      id="wars"
      data-testid="campaigns-section"
      className="folded-paper military-corners p-6 mb-8 scroll-mt-6"
    >
      {/* Section header — dossier idiom of the history chapters */}
      <div className="flex items-baseline gap-3 mb-1">
        <span className="font-ibm-mono text-xs text-military-rust">{'// WARS'}</span>
        <h2
          data-testid="campaigns-title"
          className="font-oswald text-xl md:text-2xl text-military-sand uppercase tracking-wide"
        >
          ХРОНИКИ ВОЙН
        </h2>
      </div>
      <p className="text-sm text-military-taupe mt-2 mb-5">
        Связные истории войн за ресурсы и корпоративных конфликтов — с привязкой
        к отрядам и миссиям энциклопедии.
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {campaigns.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/campaigns/${c.slug}`}
              data-testid="campaign-card"
              className="group block p-4 md:p-5 border border-military-steel/20 hover:border-military-amber/40 bg-black/20 hover:bg-black/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                {c.era && (
                  <span className="font-ibm-mono text-[10px] text-hud-green tracking-widest uppercase">
                    ЭПОХА {c.era}
                  </span>
                )}
                {c.factions && c.factions.length > 0 && (
                  <span className="flex gap-1.5 shrink-0">
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
              <h3 className="font-russo text-base md:text-lg text-military-sand group-hover:text-military-amber transition-colors">
                {c.title}
              </h3>
              {c.subtitle && (
                <p className="text-xs md:text-sm text-military-taupe mt-1.5">
                  {c.subtitle}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 font-ibm-mono text-[10px] uppercase tracking-widest text-military-rust/70 group-hover:text-military-amber transition-colors">
                Читать хронику
                <span className="transition-transform group-hover:translate-x-1">
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
