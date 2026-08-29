import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAllCampaigns, getCampaign } from '@/lib/campaigns';
import { LoreSourceRow } from '@/components/encyclopedia/LoreSourceRow';
import { BASE_PATH } from '@/lib/constants';
import { pageOpenGraph } from '@/lib/seo';

const CHRONICLE_BG = `${BASE_PATH}/images/campaigns/chronicle-bg.jpg`;

const FACTION_COLORS: Record<string, string> = {
  polaris: '#DC2626',
  protectorate: '#06b6d4',
  mercenaries: '#EAB308',
  snow_wolves: '#2563eb',
  // Unit-list dots are keyed by the id prefix (factionOf) — cover it too.
  snow: '#2563eb',
};
const FACTION_LABELS: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
  snow_wolves: 'ВОЛКИ',
};
const factionOf = (id: string) => id.split('_')[0];

export function generateStaticParams() {
  return getAllCampaigns().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const campaign = await getCampaign(params.slug);
  if (!campaign) return { title: 'Кампания не найдена — Бронепехота' };
  const description = campaign.subtitle
    || `Хроника войны: ${campaign.title}${campaign.era ? ` (${campaign.era})` : ''}`;
  return {
    title: `${campaign.title} — Хроники войн | Бронепехота`,
    description,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    // Full OG set via pageOpenGraph — a bare {title, description} object would
    // REPLACE the layout's og:image card (Next merges only top-level fields).
    // Long-form chronicle → og:type article, plus this page's own og:url.
    openGraph: pageOpenGraph({
      title: campaign.title,
      description,
      path: `/campaigns/${campaign.slug}`,
      type: 'article',
    }),
  };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const campaign = await getCampaign(params.slug);
  if (!campaign) notFound();

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers (content area) — shared with the encyclopedia */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      <article className="relative z-10">
        {/* Header */}
        <header className="relative py-8 md:py-14 px-4 overflow-hidden">
          {/* Battle hero backdrop (visible), fading into the dark content area */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${CHRONICLE_BG})` }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(12,10,9,0.5) 0%, rgba(12,10,9,0.4) 60%, rgba(12,10,9,0.95) 100%)' }} />
          <div className="absolute inset-0 diagonal-stripes opacity-20" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/60 to-transparent animate-pulse" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <Link
              href="/encyclopedia/history#wars"
              className="fade-in-up inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase mb-6"
              style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
            >
              <span className="text-lg">←</span>
              <span>Хроники войн</span>
            </Link>

            <div
              className="fade-in-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
            >
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {campaign.era && (
                  <span className="font-ibm-mono text-xs text-hud-green tracking-[0.3em]">
                    ЭПОХА {campaign.era}
                  </span>
                )}
                {campaign.factions?.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 font-ibm-mono text-[10px] tracking-widest text-military-taupe"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: FACTION_COLORS[f] }}
                    />
                    {FACTION_LABELS[f] ?? f}
                  </span>
                ))}
              </div>
              <h1 className="font-russo font-black military-text-gradient text-3xl md:text-4xl tracking-wide">
                {campaign.title}
              </h1>
              {campaign.subtitle && (
                <p className="text-military-taupe mt-2">{campaign.subtitle}</p>
              )}
            </div>
          </div>
        </header>

        {/* Rendered Markdown body. Content is first-party/trusted (authored .md). */}
        <section className="px-4 pb-10">
          <div
            className="fade-in-up max-w-3xl mx-auto prose prose-invert max-w-none prose-headings:font-russo prose-headings:text-military-amber prose-h2:mt-8 prose-h2:tracking-wide prose-p:text-military-sand/90 prose-strong:text-military-sand prose-a:text-hud-green"
            style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
            dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
          />
        </section>

        {/* Source attribution — the novel / official edition the chronicle retells.
            Rendered only when the frontmatter carries one (no invented sources). */}
        {(campaign.loreAuthor || campaign.credit) && (
          <section className="px-4 pb-8">
            <div
              className="fade-in-up max-w-3xl mx-auto"
              style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
            >
              <LoreSourceRow loreAuthor={campaign.loreAuthor} credit={campaign.credit} />
            </div>
          </section>
        )}

        {/* Participants — link out to encyclopedia unit pages */}
        {campaign.units && campaign.units.length > 0 && (
          <section className="px-4 pb-6">
            <div className="max-w-3xl mx-auto">
              <h2
                className="fade-in-up font-russo text-sm tracking-[0.3em] text-military-rust uppercase mb-4"
                style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
              >
                Участники
              </h2>
              <ul
                className="fade-in-up flex flex-wrap gap-2"
                style={{ animationDelay: '0.45s', animationFillMode: 'both' }}
              >
                {campaign.units.map((u) => {
                  const f = factionOf(u.id);
                  return (
                    <li key={u.id}>
                      <Link
                        href={`/encyclopedia/unit/${u.id}`}
                        className="folded-paper group inline-flex items-center gap-2 px-3 py-2 text-sm text-military-sand hover:text-military-amber transition-colors"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: FACTION_COLORS[f] ?? '#A8A29E' }}
                        />
                        {u.role}
                        <span className="font-ibm-mono text-[10px] text-military-taupe group-hover:text-military-amber">
                          ↗
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* Missions */}
        {campaign.missions && campaign.missions.length > 0 && (
          <section className="px-4 pb-16">
            <div className="max-w-3xl mx-auto">
              <h2
                className="fade-in-up font-russo text-sm tracking-[0.3em] text-military-rust uppercase mb-4 mt-10"
                style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
              >
                Миссии
              </h2>
              <ul
                className="fade-in-up grid sm:grid-cols-2 gap-3"
                style={{ animationDelay: '0.55s', animationFillMode: 'both' }}
              >
                {campaign.missions.map((m, i) => (
                  <li key={i} className="folded-paper military-corners p-4">
                    <div className="font-ibm-mono text-[10px] text-hud-green tracking-widest mb-1">
                      МИССИЯ {i + 1}
                    </div>
                    <div className="font-russo text-military-amber">{m.name}</div>
                    <div className="text-xs text-military-taupe mt-1">
                      Коробка: {m.box}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
