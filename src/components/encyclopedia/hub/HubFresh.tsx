import Link from 'next/link';

/**
 * «// НОВОЕ В АРХИВЕ» — витрина последних пополнений. The list is PINNED IN
 * CODE on purpose (an owner-curated showcase, like the history cover's «Читать
 * с начала»): update these rows by hand when a wave of content lands.
 */
const FRESH_ENTRIES: Array<{ label: string; kind: string; href: string }> = [
  { label: 'Димекса 4541', kind: 'КАМПАНИЯ', href: '/encyclopedia/history#wars' },
  { label: 'Периферия', kind: 'ДОСЬЕ', href: '/encyclopedia/world' },
  { label: 'Ордена держав', kind: 'ТЕРМИНЫ', href: '/encyclopedia/world' },
  { label: 'Косары', kind: 'ГЛАВА', href: '/encyclopedia/history' },
];

export function HubFresh() {
  return (
    <section aria-label="Новое в архиве" className="folded-paper military-corners px-4 py-3.5 md:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2.5 pb-2.5 border-b border-military-steel/20">
        <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80">
          {'// НОВОЕ В АРХИВЕ'}
        </p>
        <p className="font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-steel/50">
          последние пополнения
        </p>
      </div>
      <ul data-testid="hub-fresh">
        {FRESH_ENTRIES.map((e) => (
          <li key={e.label}>
            <Link
              href={e.href}
              data-testid="hub-fresh-entry"
              className="group flex min-h-[44px] items-center gap-3 no-underline touch-manipulation"
            >
              <span className="shrink-0 font-ibm-mono text-[9px] uppercase tracking-[0.2em] text-military-rust/60 w-[74px]">
                {e.kind}
              </span>
              <span className="font-oswald text-sm text-military-sand group-hover:text-military-amber transition-colors">
                {e.label}
              </span>
              <span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-military-steel/25" />
              <span
                aria-hidden
                className="shrink-0 font-ibm-mono text-[11px] text-military-steel/40 group-hover:text-military-amber transition-colors"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
