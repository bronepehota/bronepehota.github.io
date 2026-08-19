import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Хроники войн — Энциклопедия Бронепехоты',
  description:
    'Хроники войн переехали: кампании теперь размещены секцией на странице «История вселенной».',
  alternates: { canonical: '/encyclopedia/history' },
};

/**
 * «Хроники войн» merged into the encyclopedia history page (variant A): the
 * section lives at /encyclopedia/history#wars, this route only keeps the old
 * URL working.
 *
 * Why not `redirect()` from next/navigation: with `output: 'export'` the App
 * Router emits no meta-refresh — only a client-side NEXT_REDIRECT payload in
 * the RSC script — so no-JS visitors (and dumb crawlers) would face a blank
 * page. A plain page with `<meta http-equiv="refresh">` (hoisted to <head> by
 * React) redirects everyone; the visible card is the no-meta fallback.
 */
export default function CampaignsPage() {
  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden flex items-center justify-center px-4">
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

      <meta httpEquiv="refresh" content="0; url=/encyclopedia/history#wars" />

      <div className="relative z-10 w-full max-w-md">
        <div className="folded-paper military-corners p-6 md:p-8 text-center">
          <div className="font-ibm-mono text-xs tracking-[0.3em] text-hud-green/80 uppercase mb-3">
            {'// ПЕРЕЕЗД РАЗДЕЛА'}
          </div>
          <h1 className="font-russo font-black military-text-gradient text-2xl md:text-3xl tracking-wide mb-3">
            ХРОНИКИ ВОЙН
          </h1>
          <p className="text-sm text-military-taupe mb-6">
            Раздел переехал в Историю — кампании теперь открываются секцией
            в конце страницы «История вселенной».
          </p>
          <Link
            href="/encyclopedia/history#wars"
            className="inline-flex items-center gap-2 font-ibm-mono text-xs uppercase tracking-widest text-military-amber border border-military-amber/40 hover:border-military-amber hover:bg-military-amber/10 transition-all duration-300 px-5 py-3"
          >
            Открыть Хроники войн
            <span>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
