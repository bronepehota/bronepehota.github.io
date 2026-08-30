interface EraStripProps {
  /** First year on record in the archive (history chapters + campaigns). */
  from: number | null;
  /** Last year on record. */
  to: number | null;
}

/**
 * Статичная лента эпох — a plain ruler with the archive's time span. This is
 * deliberately NOT the sticky EraRibbon (that one binds to scroll timelines
 * of the history page); the hub is short, so its strip is a quiet static
 * artefact between the cover and the sections.
 */
export function EraStrip({ from, to }: EraStripProps) {
  if (from === null || to === null) return null;
  return (
    <div
      data-testid="hub-era-strip"
      className="flex items-center gap-3 px-1"
      role="img"
      aria-label={`Эпохи архива: ${from}–${to}`}
    >
      <span className="font-ibm-mono text-[10px] md:text-[11px] tabular-nums text-military-amber/90 shrink-0">
        {from}
      </span>
      <div aria-hidden className="relative flex-1 h-px bg-military-steel/30">
        {/* Quarter ticks — static ruler marks */}
        {[0, 25, 50, 75].map((left) => (
          <span
            key={left}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-military-steel/40"
            style={{ left: `${left}%` }}
          />
        ))}
        {/* The present era — center diamond */}
        <span className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-military-rust/80 bg-military-dark" />
      </div>
      <span className="font-ibm-mono text-[10px] md:text-[11px] tabular-nums text-military-amber/90 shrink-0">
        {to}
      </span>
    </div>
  );
}
