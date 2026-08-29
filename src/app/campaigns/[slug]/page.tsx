import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAllCampaigns, getCampaign } from '@/lib/campaigns';
import { LoreSourceRow } from '@/components/encyclopedia/LoreSourceRow';
import { ChapterBody } from '@/components/encyclopedia/history/ChapterBody';
import { pageOpenGraph } from '@/lib/seo';

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

/**
 * Campaign chronicle detail — the «ХРОНИКИ ВОЙН» folder opened.
 *
 * Speaks the dossier language of the «ДЕЛО RG-4530» history showcase: a mono
 * requisites header («// ХРОНИКА № NN · 4451–4546»), the body as a folder of
 * the case (folded paper + military corners + vertical spine carrying the
 * campaign `order`, same as the CampaignsBlock cards), the shared ChapterBody
 * longread typography (65ch, drop cap) and the units/missions as archival
 * appendices. prev/next navigates neighboring chronicles by `order`
 * (history/[slug] pattern).
 */
export default async function CampaignDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const metas = getAllCampaigns();
  const index = metas.findIndex((m) => m.slug === params.slug);
  const campaign = index >= 0 ? await getCampaign(params.slug) : null;
  if (!campaign) notFound();

  const prev = index > 0 ? metas[index - 1] : undefined;
  const next = index >= 0 && index < metas.length - 1 ? metas[index + 1] : undefined;
  // Same numbering rule as the CampaignsBlock spines — frontmatter `order`,
  // list position as the fallback.
  const num = campaign.order ?? index + 1;
  const spineNumber = String(num).padStart(2, '0');

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers — shared with the history pages / encyclopedia */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14 pb-16">
        {/* Back to the wars section of the history longread + case stamp */}
        <nav aria-label="Навигация по хроникам войн" className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/encyclopedia/history#wars"
            className="inline-flex items-center gap-2 font-ibm-mono text-xs text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase"
          >
            <span className="text-lg">←</span>
            <span>К хроникам войн</span>
          </Link>
          <p className="font-ibm-mono text-[10px] text-military-steel/50 tracking-wide hidden sm:block">
            {'// ХРОНИКИ ВОЙН'}
          </p>
        </nav>

        {/* ——— Requisites header: the opened chronicle's filing line ——— */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3 mb-4 border-b border-military-steel/25">
            <span aria-hidden className="font-ibm-mono text-[10px] text-military-rust">
              {'//'}
            </span>
            <p className="font-ibm-mono text-[11px] uppercase tracking-[0.25em] text-military-sand">
              {`ХРОНИКА № ${spineNumber}`}
            </p>
            {campaign.era && (
              <span className="font-ibm-mono text-[10px] tabular-nums text-military-steel/60">
                {`· ${campaign.era}`}
              </span>
            )}
          </div>
          <h1 className="font-russo font-black military-text-gradient text-3xl md:text-4xl uppercase tracking-wide">
            {campaign.title}
          </h1>
          {campaign.subtitle && (
            <p className="mt-2 font-oswald text-base md:text-lg text-military-taupe">
              {campaign.subtitle}
            </p>
          )}
          {campaign.factions && campaign.factions.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {campaign.factions.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 font-ibm-mono text-[10px] uppercase tracking-wider text-military-taupe"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: FACTION_COLORS[f] ?? '#A8A29E' }}
                  />
                  {FACTION_LABELS[f] ?? f}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ——— The chronicle sheet: folder with the numbered spine, shared
            longread typography (65ch, drop cap; h2 subheads get the dossier
            «//» prefix via .campaign-body in globals.css). ——— */}
        <article className="folded-paper military-corners relative pl-10 pr-5 py-6 mb-8">
          <span aria-hidden className="history-spine">
            {spineNumber}
          </span>
          {/* Build-time sanitized HTML (campaigns pipeline). */}
          <ChapterBody
            html={campaign.bodyHtml}
            chapterNumber={null}
            chronicle
            className="campaign-body"
          />
          {/* Source attribution — the novel / official edition the chronicle
              retells. Renders only when the frontmatter carries one. */}
          <LoreSourceRow loreAuthor={campaign.loreAuthor} credit={campaign.credit} className="mt-4" />
        </article>

        {/* ——— Appendix: participants of the campaign (encyclopedia units) ——— */}
        {campaign.units && campaign.units.length > 0 && (
          <section className="mb-8">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80 pb-3 mb-2 border-b border-military-steel/25">
              {'// ПРИЛОЖЕНИЕ · УЧАСТНИКИ'}
            </p>
            <ul>
              {campaign.units.map((u) => {
                const f = factionOf(u.id);
                return (
                  <li key={u.id} className="border-b border-military-steel/15 last:border-b-0">
                    <Link
                      href={`/encyclopedia/unit/${u.id}`}
                      className="group flex items-center gap-3 py-2.5"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: FACTION_COLORS[f] ?? '#A8A29E' }}
                      />
                      <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                        {u.role}
                      </span>
                      <span className="ml-auto font-ibm-mono text-[10px] uppercase tracking-widest text-military-steel/50 group-hover:text-military-amber transition-colors shrink-0">
                        досье ↗
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ——— Appendix: missions of the campaign ——— */}
        {campaign.missions && campaign.missions.length > 0 && (
          <section className="mb-10">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80 pb-3 mb-3 border-b border-military-steel/25">
              {'// ПРИЛОЖЕНИЕ · МИССИИ'}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {campaign.missions.map((m, i) => (
                <li key={i} className="folded-paper military-corners p-4">
                  <div className="font-ibm-mono text-[10px] tracking-widest text-military-rust mb-1">
                    {`МИССИЯ ${String(i + 1).padStart(2, '0')}`}
                  </div>
                  <div className="font-russo text-military-amber">{m.name}</div>
                  <div className="text-xs text-military-taupe mt-1">
                    Коробка: {m.box}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* prev/next chronicle by `order` — neighboring folder titles */}
        <nav aria-label="Соседние хроники" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prev ? (
            <Link
              href={`/campaigns/${prev.slug}`}
              data-testid="campaign-prev"
              className="folded-paper military-corners p-4 group"
            >
              <span className="block font-ibm-mono text-[10px] text-military-rust mb-1">
                ← предыдущая хроника
              </span>
              <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/campaigns/${next.slug}`}
              data-testid="campaign-next"
              className="folded-paper military-corners p-4 group sm:text-right"
            >
              <span className="block font-ibm-mono text-[10px] text-military-rust mb-1">
                следующая хроника →
              </span>
              <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}
