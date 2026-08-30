/**
 * Server-safe (hook-free) attribution atoms for Markdown-backed content.
 *
 * Extracted from `AttributionLabel.tsx` (which stays hook-ful: its
 * <ContributeButton> uses useState) so SERVER components — the campaigns
 * «Хроники войн» page and the «История вселенной» page — can render
 * <LoreSourceRow> without pulling a hook-using module into the RSC graph.
 *
 * This module must contain NO React hooks and NO "use client" directive.
 * The only client reference inside is <GitHubPagesImage>, a proper
 * `'use client'` component a server component may legally render.
 */
import type { LucideIcon } from 'lucide-react';
import { Shield, Star, ExternalLink, BookOpen, Bot, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import type { LoreSource, LoreCredit } from '@/lib/provenance';

/** Tooltip for the «АВБ» badge — the disclaimer that this is alternative, not replacement,
 *  lore/miniatures. Shown on every non-Технолог provenance row. */
export const ALTERNATIVE_VERSION_HINT =
  'АВБ — Альтернативная Версия Бронепехоты. Не является заменой оригинальным миниатюрам «Технолога», а расширяет игровой и коллекционный опыт вселенной «Бронепехота».';

/** Display metadata for each lore source bucket. */
export const LORE_SOURCE_META: Record<
  LoreSource,
  { name: string; short: string; icon: LucideIcon; tone: string; logo: string; url: string }
> = {
  tehnolog: { name: 'Технолог', short: 'ТЕХНОЛОГ', icon: Shield, tone: '#06b6d4', logo: '/images/credits/tehnolog.png', url: 'https://www.tehnolog.ru' },
  star_system: { name: 'Star System', short: 'STAR SYSTEM', icon: Star, tone: '#f59e0b', logo: '/images/credits/star_system.jpg', url: 'https://vk.com/bp_bnp' },
  // Звёздные Системы (vk.ru/universestarsys) — сообщество-создатель Мёртвого Флота.
  universestarsys: { name: 'Звёздные Системы', short: 'ЗВЁЗДНЫЕ СИСТЕМЫ', icon: Star, tone: '#e11d48', logo: '/images/credits/universestarsys.jpg', url: 'https://vk.ru/universestarsys' },
  // ИИ — лор сгенерирован нейросетью (Z.AI / GLM), не написан человеком.
  ai: { name: 'ИИ', short: 'ИИ', icon: Bot, tone: '#8b5cf6', logo: '/images/credits/ai.svg', url: 'https://chatglm.cn' },
  // АВБ — generic alternative-version content with no single named community (user-authored fan lore).
  // No external link (abstract lore, not a brand); the chip renders as a non-link span.
  avb: { name: 'АВБ', short: 'АВБ', icon: Layers, tone: '#10b981', logo: '/images/credits/avb.svg', url: '' },
};

/* -------------------------------------------------------------------------- */
/* Atomic chip — used for lore sources AND painters (icon | logo)             */
/* -------------------------------------------------------------------------- */

interface SourceChipProps {
  /** Display name (rendered uppercased in dossier style). */
  name: string;
  /** Optional role sub-label, e.g. «оригинал», «лор», «покрас». */
  role?: string;
  /** Lucide icon (lore sources). Mutually exclusive with `logo`. */
  icon?: LucideIcon;
  /** Logo image path (painters). Mutually exclusive with `icon`. */
  logo?: string;
  /** When set, the chip becomes a link. */
  url?: string;
  /** Link relation. Default keeps primary-source credits follow;
   *  CTAs and sponsor chips pass a nofollow variant. */
  rel?: string;
  /** Hex tone for the icon and border tint (ignored when `logo` is set). */
  tone?: string;
  /** Compact sizing for dense surfaces (faction cards). */
  compact?: boolean;
}

export function SourceChip({ name, role, icon, logo, url, rel = 'noopener noreferrer', tone, compact }: SourceChipProps) {
  const Icon = icon;
  const padX = compact ? 'px-1.5' : 'px-2';
  const padY = compact ? 'py-0.5' : 'py-1';
  const nameCls = compact
    ? 'font-ibm-mono text-[9px] tracking-wider'
    : 'font-ibm-mono text-[10px] tracking-wider';

  const inner = (
    <>
      {logo ? (
        <GitHubPagesImage
          src={logo}
          alt=""
          width={compact ? 12 : 16}
          height={compact ? 12 : 16}
          className="rounded-[2px]"
        />
      ) : (
        Icon && <Icon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} style={{ color: tone }} aria-hidden />
      )}
      <span className={cn(nameCls, 'uppercase text-military-sand')}>{name}</span>
      {role && (
        <span className="font-ibm-mono text-[9px] normal-case tracking-normal text-military-taupe/80">
          · {role}
        </span>
      )}
      {url && <ExternalLink className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3', 'text-military-taupe/80')} aria-hidden />}
    </>
  );

  const cls = cn(
    'inline-flex items-center gap-1.5 rounded-sm border bg-military-charcoal/70 transition-colors',
    padX,
    padY,
    url ? 'cursor-pointer hover:border-military-amber/50' : 'border-military-steel/40',
  );
  const style = !logo && tone ? { borderColor: `${tone}55` } : undefined;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel={rel}
        className={cls}
        style={style}
        title={url}
      >
        {inner}
      </a>
    );
  }
  return (
    <span className={cls} style={style}>
      {inner}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* «АВБ» mini mark for named-author credits                                   */
/* -------------------------------------------------------------------------- */

/** Tone for the named-author («автор лора») chip — warm bronze, distinct from every
 *  org-source tone: the citation credits a human author/work, not a faction source. */
const LORE_CREDIT_TONE = '#c2924a';

/** Mini АВБ mark for the named-author credit chip — icon-only sibling of the full
 *  <AlternativeVersionBadge>. Flags that the *book* the lore was adapted from is a
 *  non-Технолог work (a V.Chertischev novel etc.) WITHOUT claiming the whole entity
 *  is alternative: official units keep their Технолог origin and get only this mark
 *  on the source. Carries the same disclaimer tooltip as the full badge. */
export function CreditAvbMark({ compact }: { compact?: boolean }) {
  return (
    <span
      title={ALTERNATIVE_VERSION_HINT}
      aria-label="АВБ"
      data-testid="credit-avb-mark"
      className={cn(
        'inline-flex items-center justify-center rounded-sm border border-emerald-500/40 bg-emerald-500/10',
        compact ? 'w-[18px] h-[18px]' : 'w-5 h-5',
      )}
    >
      <GitHubPagesImage
        src="/images/credits/avb.svg"
        alt=""
        width={compact ? 12 : 14}
        height={compact ? 12 : 14}
        className="rounded-[2px]"
      />
    </span>
  );
}

interface LoreCreditChipOptions {
  /** Org-level author of the adapted text — a non-tehnolog source adds the mini АВБ mark. */
  loreAuthor?: LoreSource;
  /** Dedup: suppress the mini АВБ mark when the SAME row already shows an org chip
   *  that reads «АВБ» (e.g. <ProvenanceRow> with `origin: 'avb'` — the entity-level
   *  chip already says АВБ, the mark would repeat it). Used only on rows that render
   *  org chips alongside; <LoreSourceRow> never needs it (credit chip XOR org chip). */
  hideAvbMark?: boolean;
  compact?: boolean;
}

/** Renders a `LoreCredit` (a named author + work the lore was adapted from) as a
 *  dossier chip, visually unified with the org-source chips but flagged by a BookOpen
 *  icon. Orthogonal to the origin/loreAuthor chips — e.g. «Технолог» canon adapted
 *  from V.Chertischev's «Битва за Велиан» shows both the org badge and this citation.
 *  When the book itself is non-Технолог (`loreAuthor ≠ tehnolog`), the chip carries
 *  the mini АВБ mark right next to it (unless suppressed via `hideAvbMark` — dedup
 *  against an already-«АВБ»-reading org chip in the same row). */
export function loreCreditChip(
  credit: LoreCredit,
  { loreAuthor, hideAvbMark, compact }: LoreCreditChipOptions = {},
) {
  const name = credit.author ?? credit.work ?? 'Источник лора';
  // When the author is named, the work + year go to the role sub-label
  // («V.Chertischev · Битва за Велиан, 2022»); with no author, the work is the name.
  const role = credit.author
    ? [credit.work, credit.year].filter(Boolean).join(', ')
    : credit.year
      ? String(credit.year)
      : undefined;
  return (
    <span data-testid="lore-credit-chip" className="inline-flex items-center gap-1">
      <SourceChip
        name={name}
        role={role || undefined}
        icon={BookOpen}
        tone={LORE_CREDIT_TONE}
        url={credit.url}
        compact={compact}
      />
      {loreAuthor && loreAuthor !== 'tehnolog' && !hideAvbMark && <CreditAvbMark compact={compact} />}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Standalone lore-source row — campaigns / history chapters                  */
/* -------------------------------------------------------------------------- */

interface LoreSourceRowProps {
  /** Org-level author of the text (frontmatter of the .md). Absent = tehnolog. */
  loreAuthor?: LoreSource;
  /** Named citation — the specific book/novel the text retells. */
  credit?: LoreCredit;
  /** Show the `// ИСТОЧНИК` section header. Default true. */
  withHeader?: boolean;
  /** Compact sizing for dense surfaces. */
  compact?: boolean;
  /** Extra className for the wrapper. */
  className?: string;
}

/** Compact «// ИСТОЧНИК» row for Markdown-backed content (campaigns of the
 *  «Хроники войн», chapters of the «История вселенной»). Same dossier idiom as
 *  <ProvenanceRow>, but for pages that have no unit-style origin axis: the row
 *  shows either the named-author chip (a novel the text retells — with the mini
 *  АВБ mark when the book is non-Технолог) or an org chip («Издание „Технолог“»
 *  for the official chronicle). Renders nothing without any attribution — content
 *  with no established source must not show an invented one. */
export function LoreSourceRow({ loreAuthor, credit, withHeader = true, compact, className }: LoreSourceRowProps) {
  if (!loreAuthor && !credit) return null;
  const author: LoreSource = loreAuthor ?? 'tehnolog';
  const meta = LORE_SOURCE_META[author];
  return (
    <div data-testid="lore-source-row" className={cn('flex flex-wrap items-center gap-2', className)}>
      {withHeader && (
        <span className="font-ibm-mono text-[10px] text-military-rust uppercase tracking-wider">
          {'// ИСТОЧНИК'}
        </span>
      )}
      {credit ? (
        loreCreditChip(credit, { loreAuthor: author, compact })
      ) : (
        <>
          <SourceChip
            name={author === 'tehnolog' ? 'Издание „Технолог“' : meta.short}
            icon={meta.icon}
            tone={meta.tone}
            url={meta.url}
            compact={compact}
          />
          {author !== 'tehnolog' && <CreditAvbMark compact={compact} />}
        </>
      )}
    </div>
  );
}
