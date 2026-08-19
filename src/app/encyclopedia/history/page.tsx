import { getAllHistoryChapters, getHistoryChapter } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import { CampaignsBlock } from '@/components/encyclopedia/CampaignsBlock';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { LoreSourceRow } from '@/components/encyclopedia/LoreSourceRow';

export const metadata = {
  title: 'История вселенной — Энциклопедия Бронепехоты',
  description:
    'Хроника человечества: от Тунгусского артефакта и первых прыжков к звёздам до Доминиона, двух сверхдержав и хроник войн 4451–4546 годов.',
};

export default async function HistoryPage() {
  const metas = getAllHistoryChapters();
  const chapters = (await Promise.all(metas.map((m) => getHistoryChapter(m.slug)))).filter(
    (c): c is NonNullable<typeof c> => c !== null,
  );
  // «Хроники войн» live as the closing section of the history page (#wars) —
  // chronological order, the standalone /campaigns list redirects here.
  const campaigns = getAllCampaigns();
  // Era span of the whole wars block (TOC badge): first campaign's opening
  // year → last campaign's closing year, e.g. 4451–4546.
  const firstWar = campaigns[0]?.era?.match(/\d{4}/)?.[0];
  const lastWar = campaigns[campaigns.length - 1]?.era?.match(/(\d{4})\s*$/)?.[1];
  const warsEra = firstWar && lastWar ? `${firstWar}–${lastWar}` : undefined;

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14">
        {/* Header */}
        <header className="mb-8">
          <h1
            data-testid="history-title"
            className="font-russo font-black text-3xl md:text-5xl text-white military-text-gradient uppercase mb-4"
          >
            История вселенной
          </h1>
          <EncyclopediaTabs className="mb-6" />
        </header>

        {/* Anchor TOC */}
        <nav data-testid="history-toc" className="folded-paper military-corners p-6 mb-8">
          <ol className="space-y-2">
            {chapters.map((c, i) => (
              <li key={c.slug}>
                <a
                  href={`#${c.slug}`}
                  className="flex items-baseline gap-3 group"
                >
                  <span className="font-ibm-mono text-[10px] text-military-rust">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                    {c.title}
                  </span>
                  {c.era && (
                    <span className="font-ibm-mono text-[10px] text-military-steel/50">
                      {c.era}
                    </span>
                  )}
                </a>
              </li>
            ))}
            {/* Wars chronicle — not a chapter; separated entry anchoring #wars */}
            <li className="pt-2 mt-2 border-t border-military-steel/20">
              <a href="#wars" className="flex items-baseline gap-3 group">
                <span className="font-ibm-mono text-[10px] text-military-rust">{'//'}</span>
                <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                  Хроники войн
                </span>
                {warsEra && (
                  <span className="font-ibm-mono text-[10px] text-military-steel/50">
                    {warsEra}
                  </span>
                )}
              </a>
            </li>
          </ol>
        </nav>

        {/* Chapters */}
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            id={c.slug}
            data-testid="history-chapter"
            className="folded-paper military-corners p-6 mb-8 scroll-mt-6"
          >
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-ibm-mono text-xs text-military-rust">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="font-oswald text-xl md:text-2xl text-military-sand">{c.title}</h2>
            </div>
            {c.era && (
              <p className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/50 mb-4">
                {c.era}
              </p>
            )}
            {/* Chapter body — build-time sanitized HTML (campaigns pipeline). */}
            <div
              className="prose-invert text-military-sand/80 leading-relaxed space-y-4 text-sm md:text-base [&_h3]:font-oswald [&_h3]:text-military-sand"
              dangerouslySetInnerHTML={{ __html: c.bodyHtml }}
            />
            {/* Source row — «Летопись» chapters cite the official edition; chapter VIII
                cites the «Косары» novel (non-Технолог → carries the mini АВБ mark).
                Renders nothing for a chapter without attribution. */}
            <LoreSourceRow loreAuthor={c.loreAuthor} credit={c.credit} className="mt-4" />
          </section>
        ))}

        {/* «Хроники войн» — campaigns as the closing section (anchor #wars) */}
        <CampaignsBlock campaigns={campaigns} />
      </div>
    </main>
  );
}
