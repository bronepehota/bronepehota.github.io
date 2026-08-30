import type { HistoryDividerInfo } from '@/lib/history';

interface HistoryDividerProps {
  info: HistoryDividerInfo;
}

/**
 * Full-bleed divider at era/group seams — the «перфорация» of the dossier.
 *
 * A giant outlined Russo glyph (era start year, `§`, `//` or `†`) sits behind
 * a slightly rotated archival stamp. Rendered at the head of each reading
 * zone; the ZONE wrapper (not this divider) carries the named view-timeline
 * that drives the active-epoch highlight on the sticky era ribbon.
 */
export function HistoryDivider({ info }: HistoryDividerProps) {
  return (
    <div
      id={info.anchorId}
      data-testid="history-divider"
      className="relative w-full border-y border-military-steel/15 py-10 md:py-14 my-10 md:my-14 overflow-hidden scroll-mt-12"
    >
      <span
        aria-hidden
        className="history-era-outline block text-center text-[19vw] md:text-[10rem] leading-none"
      >
        {info.outline}
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-block -rotate-2 bg-military-dark/85 border-2 border-military-rust/40 px-3 py-1 font-ibm-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-military-rust shadow-[0_0_18px_rgba(12,10,9,0.9)]">
          {info.stamp}
        </span>
      </div>
      {info.sub && (
        <p className="relative text-center font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-taupe/80 mt-2">
          {info.sub}
        </p>
      )}
    </div>
  );
}
