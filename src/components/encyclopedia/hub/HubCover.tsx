import type { ReactNode } from 'react';
import type { HubCounts } from './ArchiveHub';

interface HubCoverProps {
  counts: HubCounts;
  /** Search block (HubSearch) — the cover's centerpiece. */
  children: ReactNode;
}

/**
 * Обложка дела верхнего уровня — the archive box cover, one grade of
 * cardboard denser than the body pages (same treatment as the history
 * cover: folded-paper + military-corners + inner stripes). Carries the
 * гриф, the data-driven ledger line and the universe search.
 */
export function HubCover({ counts, children }: HubCoverProps) {
  return (
    <header
      data-testid="encyclopedia-hub-cover"
      className="relative folded-paper military-corners p-5 md:p-7 overflow-hidden"
    >
      {/* Denser cardboard than the folder cards below */}
      <div aria-hidden className="absolute inset-0 diagonal-stripes opacity-60 pointer-events-none" />
      {/* Classification stamp — dossier flourish, decorational only */}
      <span
        aria-hidden
        className="absolute top-4 right-4 -rotate-6 border-2 border-military-rust/40 px-2 py-0.5 font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust select-none hidden sm:block"
      >
        СТАРСИС
      </span>

      <div className="relative">
        <p className="font-ibm-mono text-[10px] md:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-military-rust pb-3 mb-4 border-b border-military-steel/25">
          {'ДЕЛО № RG-4530 · АРХИВ ВСЕЛЕННОЙ'}
        </p>

        <p className="max-w-[60ch] text-sm md:text-base text-military-taupe leading-relaxed mb-4">
          {`Вселенная настольных игр «Робогир» и «Бронепехота» — летопись от Тунгусского артефакта до звездных войн, досье юнитов и сторон конфликта. Всё каноническое собрано в одном деле.`}
        </p>

        {/* Ledger line — counts from the data, never hardcoded */}
        <dl
          data-testid="hub-counters"
          className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-military-steel/25 border border-military-steel/25 mb-5"
        >
          <div className="bg-military-dark/80 px-3 py-2.5">
            <dt className="font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust mb-1">Глав</dt>
            <dd className="font-ibm-mono tabular-nums text-xl md:text-2xl leading-none text-military-amber">{counts.chapters}</dd>
          </div>
          <div className="bg-military-dark/80 px-3 py-2.5">
            <dt className="font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust mb-1">Войн</dt>
            <dd className="font-ibm-mono tabular-nums text-xl md:text-2xl leading-none text-military-amber">{counts.campaigns}</dd>
          </div>
          <div className="bg-military-dark/80 px-3 py-2.5">
            <dt className="font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust mb-1">Досье</dt>
            <dd className="font-ibm-mono tabular-nums text-xl md:text-2xl leading-none text-military-amber">{counts.world}</dd>
          </div>
          <div className="bg-military-dark/80 px-3 py-2.5">
            <dt className="font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust mb-1">Юнитов</dt>
            <dd className="font-ibm-mono tabular-nums text-xl md:text-2xl leading-none text-military-amber">{counts.units}</dd>
          </div>
        </dl>

        {children}
      </div>
    </header>
  );
}
