import Link from 'next/link';
import { getAllCampaigns } from '@/lib/campaigns';

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

export default async function CampaignsPage() {
  const campaigns = getAllCampaigns();

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers — shared with the encyclopedia */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.7) 100%)',
        }}
      />

      <div className="relative z-10">
        {/* Hero header */}
        <header className="relative py-6 md:py-16 px-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/60 to-transparent animate-pulse" />
          <div className="max-w-7xl mx-auto">
            <Link
              href="/encyclopedia"
              className="fade-in-up inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase mb-4 md:mb-8"
              style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
            >
              <span className="text-lg">←</span>
              <span>К энциклопедии</span>
            </Link>

            <div
              className="fade-in-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
            >
              <div className="font-ibm-mono text-xs tracking-[0.3em] text-hud-green/80 uppercase mb-2">
                Архив кампаний
              </div>
              <h1
                data-testid="campaigns-title"
                className="font-russo font-black military-text-gradient text-3xl sm:text-4xl md:text-6xl tracking-wide"
              >
                ХРОНИКИ ВОЙН
              </h1>
              <p className="mt-3 text-military-taupe max-w-2xl text-sm md:text-base">
                Связные истории войн за ресурсы и корпоративных конфликтов —
                с привязкой к отрядам и миссиям энциклопедии.
              </p>
            </div>
          </div>
        </header>

        {/* Campaign cards */}
        <section className="px-4 pb-16">
          <div className="max-w-7xl mx-auto">
            {campaigns.length === 0 ? (
              <p className="text-military-taupe">Пока нет опубликованных историй.</p>
            ) : (
              <ul className="grid gap-5 md:grid-cols-2">
                {campaigns.map((c, i) => (
                  <li
                    key={c.slug}
                    className="fade-in-up"
                    style={{
                      animationDelay: `${0.3 + i * 0.1}s`,
                      animationFillMode: 'both',
                    }}
                  >
                    <Link
                      href={`/campaigns/${c.slug}`}
                      data-testid="campaign-card"
                      className="folded-paper military-corners group block p-6 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        {c.era && (
                          <span className="font-ibm-mono text-xs text-hud-green tracking-widest">
                            ЭПОХА {c.era}
                          </span>
                        )}
                        {c.factions && c.factions.length > 0 && (
                          <span className="flex gap-1.5">
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
                      <h2 className="font-russo text-xl md:text-2xl text-military-sand group-hover:text-military-amber transition-colors">
                        {c.title}
                      </h2>
                      {c.subtitle && (
                        <p className="text-sm text-military-taupe mt-1.5">
                          {c.subtitle}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-2 font-ibm-mono text-xs uppercase tracking-widest text-military-rust/70 group-hover:text-military-amber transition-colors">
                        Читать хронику
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
