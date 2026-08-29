import { cn } from '@/lib/utils';

interface ChapterBodyProps {
  /** Build-time sanitized HTML (campaigns pipeline). */
  html: string;
  /** Chronological chapter number (01–11); `null` for grouped sections. */
  chapterNumber: number | null;
  /** Chronicle chapters (no `group` in frontmatter) get the drop cap. */
  chronicle?: boolean;
  className?: string;
}

/**
 * Longread body of a history chapter — shared by the hub section
 * (/encyclopedia/history) and the standalone chapter page so the reading
 * typography stays identical:
 *  - measure 65ch, 15px→16px, leading 1.75 (direction 2 «Подшивка»);
 *  - drop cap on the first paragraph of CHRONICLE chapters;
 *  - `h3` sub-numbering «// 07.1» — CSS counters, the per-section `chapter`
 *    counter is set inline (`counter-reset: chapter N`).
 */
export function ChapterBody({ html, chapterNumber, chronicle, className }: ChapterBodyProps) {
  return (
    <div
      style={chapterNumber != null ? { counterReset: `chapter ${chapterNumber}` } : undefined}
      className={cn(
        'history-body max-w-[65ch] mx-auto',
        'text-[15px] md:text-base leading-[1.75] space-y-5',
        'text-military-sand/85',
        '[&_h3]:font-oswald [&_h3]:text-military-sand [&_h3]:text-lg [&_h3]:tracking-wide',
        chapterNumber != null && 'history-body--numbered',
        chronicle && 'history-dropcap',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
