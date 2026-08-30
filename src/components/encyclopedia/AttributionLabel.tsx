/**
 * Attribution ("источник") labels for the encyclopedia.
 *
 * One visual family for three uses — lore *origin*, lore *author*, and the
 * *painter* of a miniature — so the page reads as a single "where does all this
 * come from" layer. Aesthetic: dossier metadata chips, consistent with the
 * existing `// ОПИСАНИЕ` / «Источник фото:» / «ДОСТУПНОСТЬ В ИСТОЧНИКАХ» idiom.
 *
 * Also renders a subtle «дополнить данные» affordance linking to the VK community,
 * so anyone can contribute missing lore / painters / provenance info.
 *
 * NOTE: this module is NOT server-safe — <ContributeButton> below calls useState.
 * Server components must import <LoreSourceRow> from `./LoreSourceRow` (hook-free)
 * directly; it is re-exported here only for backward compatibility of existing
 * (client-graph) imports.
 */
import { Fragment, useState } from 'react';
import { Megaphone, Check, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import {
  isProvenanceUniform,
  isAlternativeVersion,
  creditList,
  type LoreSource,
  type Provenance,
} from '@/lib/provenance';
import {
  LORE_SOURCE_META,
  SourceChip,
  loreCreditChip,
  ALTERNATIVE_VERSION_HINT,
} from './LoreSourceRow';

// Backward-compatible re-exports of the server-safe atoms (see header note).
export { LoreSourceRow, CreditAvbMark, SourceChip, ALTERNATIVE_VERSION_HINT } from './LoreSourceRow';

/** VK channel for data contributions / error reports (lore, painters, provenance). */
export const CONTRIBUTION_VK_URL = 'https://vk.ru/lastbpcoder';

/** Prefilled message template copied to the clipboard when «Дополнить» is pressed,
 *  so the user can paste it straight into VK (VK has no prefilled-message URL). */
export function contributionTemplate(subject?: string): string {
  return [
    'Здравствуйте! Сообщение по энциклопедии «Бронепехота».',
    `Раздел: ${subject ?? '___'}`,
    'Где (отряд / миссия / фракция): ___',
    'Что заметил (ошибка / неточность): ___',
    'Предлагаю (исправить / дополнить): ___',
  ].join('\n');
}

/* -------------------------------------------------------------------------- */
/* «Дополнить данные» affordance → VK community                              */
/* -------------------------------------------------------------------------- */

interface ContributeButtonProps {
  compact?: boolean;
  /** Override the target (defaults to the VK contribution channel). */
  url?: string;
  /** Inserted into the copied message template (e.g. the unit / section name). */
  subject?: string;
}

export function ContributeButton({ compact, url = CONTRIBUTION_VK_URL, subject }: ContributeButtonProps) {
  const [copied, setCopied] = useState(false);
  const title = 'Сообщить об ошибке или дополнить данные — скопируется шаблон сообщения и откроется VK';
  const handleClick = () => {
    try {
      navigator.clipboard?.writeText(contributionTemplate(subject));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the link still opens */
    }
  };
  return (
    <a
      href={url}
      target="_blank"
      // nofollow: repeated CTA (~200 sitewide links to one VK profile), not a
      // source credit — primary-source credits stay follow by design.
      rel="noopener noreferrer nofollow"
      onClick={handleClick}
      title={title}
      aria-label={title}
      data-testid="contribute-link"
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border transition-colors',
        copied
          ? 'border-military-amber/60 text-military-amber'
          : 'border-military-steel/30 text-military-taupe/80 hover:text-military-amber hover:border-military-amber/50',
        compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
      )}
    >
      {copied ? (
        <Check className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} aria-hidden />
      ) : (
        <Megaphone className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} aria-hidden />
      )}
      {!compact && (
        <span className="font-ibm-mono text-[9px] uppercase tracking-wider">
          {copied ? 'Шаблон скопирован' : 'Дополнить'}
        </span>
      )}
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* «АВБ» badge — marks every non-Технолог (community/alternative) entity      */
/* -------------------------------------------------------------------------- */

interface AlternativeVersionBadgeProps {
  compact?: boolean;
}

/** «АВБ» marker — shown on provenance rows whose content is NOT official «Технолог»
 *  (i.e. community concept/minis: Star System, Звёздные Системы, …). Carries the
 *  disclaimer as a tooltip: alternative lore/miniatures that diversify the game, never
 *  a replacement for Технолог originals. Rendered by `ProvenanceRow`; not a `LoreSource`
 *  in its own right — it derives from `origin !== 'tehnolog'`. */
export function AlternativeVersionBadge({ compact }: AlternativeVersionBadgeProps) {
  const padX = compact ? 'px-1.5' : 'px-2';
  const padY = compact ? 'py-0.5' : 'py-1';
  return (
    <span
      title={ALTERNATIVE_VERSION_HINT}
      data-testid="avb-badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border border-emerald-500/40 bg-emerald-500/10 transition-colors hover:border-emerald-400/70',
        padX,
        padY,
      )}
    >
      <GitHubPagesImage
        src="/images/credits/avb.svg"
        alt=""
        width={compact ? 12 : 16}
        height={compact ? 12 : 16}
        className="rounded-[2px]"
      />
      <span
        className={cn(
          compact ? 'font-ibm-mono text-[9px]' : 'font-ibm-mono text-[10px]',
          'uppercase tracking-wider text-emerald-300',
        )}
      >
        АВБ
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Lore provenance row — // ИСТОЧНИК + origin/author chips + contribute       */
/* -------------------------------------------------------------------------- */

interface ProvenanceRowProps {
  provenance: Provenance;
  /** Makes the (collapsed) chip a link — e.g. a mission's sourceUrl. */
  linkUrl?: string;
  /** Show the `// ИСТОЧНИК` section header. Default true. */
  withHeader?: boolean;
  /** Show the «Дополнить» affordance. Default true. */
  withContribute?: boolean;
  /** Render only the origin chip (for entities with no lore text — loreAuthor is moot). */
  originOnly?: boolean;
  /** Compact sizing for faction cards. */
  compact?: boolean;
  /** Extra className for the wrapper. */
  className?: string;
}

export function ProvenanceRow({
  provenance,
  linkUrl,
  withHeader = true,
  withContribute = true,
  originOnly = false,
  compact,
  className,
}: ProvenanceRowProps) {
  const uniform = originOnly || isProvenanceUniform(provenance);
  const metaOf = (s: LoreSource) => LORE_SOURCE_META[s];
  const chip = (s: LoreSource, role: string, url?: string) => (
    <SourceChip
      name={metaOf(s).short}
      role={role}
      logo={metaOf(s).logo}
      icon={metaOf(s).icon}
      tone={metaOf(s).tone}
      url={url ?? metaOf(s).url}
      compact={compact}
    />
  );

  // Collapsed (origin === loreAuthor, or originOnly): one chip describing the source.
  const chips = uniform ? (
    chip(
      provenance.origin,
      originOnly
        ? 'оригинал'
        : provenance.origin === 'tehnolog'
          ? 'оригинал и лор'
          : 'сообщество',
      linkUrl,
    )
  ) : (
    <>
      {chip(provenance.origin, 'оригинал')}
      {chip(provenance.loreAuthor, 'лор')}
    </>
  );

  return (
    <div data-testid="provenance-row" className={cn('flex flex-wrap items-center gap-2', className)}>
      {withHeader && (
        <span className="font-ibm-mono text-[10px] text-military-rust uppercase tracking-wider">
          {'// ИСТОЧНИК'}
        </span>
      )}
      {chips}
      {/* Named-author citations (a specific book/novel the lore was adapted from) —
          shown on top of the org chips when `provenance.credit` is set. An entity
          assembled from SEVERAL works carries an array → one chip per work
          (`creditList`). A non-Технолог book flags itself with the mini АВБ mark
          (`loreAuthor` axis) — except when the row's own org chip already reads
          «АВБ» (`origin: 'avb'`, e.g. штурмовая киберпехота): dedup, symmetric to
          the full-badge suppression below. */}
      {creditList(provenance.credit).map((credit, i) => (
        <Fragment key={i}>
          {loreCreditChip(credit, {
            loreAuthor: provenance.loreAuthor,
            hideAvbMark: provenance.origin === 'avb',
            compact,
          })}
        </Fragment>
      ))}
      {/* АВБ badge — added on top of NAMED community sources (Star System, Звёздные Системы…).
          Skipped when the source is already 'avb' (its chip already reads «АВБ» → no double mark). */}
      {isAlternativeVersion(provenance) && provenance.origin !== 'avb' && (
        <AlternativeVersionBadge compact={compact} />
      )}
      {withContribute && <ContributeButton compact={compact} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Painter credit — reuses SourceChip with a logo                            */
/* -------------------------------------------------------------------------- */

interface PainterChipProps {
  name: string;
  logo: string;
  url: string;
  compact?: boolean;
  withHeader?: boolean;
  /** Show the «Дополнить» affordance. Default false (the lore row already has one). */
  withContribute?: boolean;
}

/** Painter / photo-source chip, visually unified with lore provenance. */
export function PainterChip({ name, logo, url, compact, withHeader = true, withContribute = false }: PainterChipProps) {
  return (
    <div data-testid="painter-chip" className="flex flex-wrap items-center gap-2">
      {withHeader && (
        <span className="font-ibm-mono text-[10px] text-military-rust uppercase tracking-wider">
          {'// ПОКРАС'}
        </span>
      )}
      {/* No `role` here: the name already says what this is ("Покрасы Шнайдера" /
          "Миниатюры Лисицина"), and a "· миниатюра" tag would collide with the
          separate sculptor chip's "· модель" in the same row. */}
      <SourceChip name={name} logo={logo} url={url} compact={compact} />
      {withContribute && <ContributeButton compact={compact} />}
    </div>
  );
}

interface ImageSourceChipProps {
  withHeader?: boolean;
  compact?: boolean;
  /** The render/card-art artist (resolved from `unit.imageSource`, defaulting to Star System). */
  source?: { name: string; logo: string; url: string };
}

/**
 * Image-source for UNPAINTED squads (painted squads instead show a <PainterChip>).
 * `source` is the card-art render artist — normally passed in from `unit.imageSource`,
 * which defaults to Star System (every unpainted squad render is community Star System art).
 */
export function ImageSourceChip({ withHeader = true, compact, source }: ImageSourceChipProps) {
  const meta = LORE_SOURCE_META['star_system'];
  return (
    <div data-testid="image-source-chip" className="flex flex-wrap items-center gap-2">
      {withHeader && (
        <span className="font-ibm-mono text-[10px] text-military-rust uppercase tracking-wider">
          {'// ИЗОБРАЖЕНИЯ'}
        </span>
      )}
      <SourceChip
        name={source ? source.name : meta.short}
        logo={source ? source.logo : meta.logo}
        icon={!source ? meta.icon : undefined}
        tone={!source ? meta.tone : undefined}
        url={source ? source.url : meta.url}
        compact={compact}
      />
      <ContributeButton compact={compact} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Miniature source — who made the physical sculpt (≠ image creator)          */
/* -------------------------------------------------------------------------- */

interface MiniatureChipProps {
  name: string;
  logo: string;
  url: string;
  compact?: boolean;
  withHeader?: boolean;
  headerText?: string;
  role?: string;
}

/** Who made the PHYSICAL miniature / sculpt. When the same creator also made the
 *  images/paint, pass a combined headerText (e.g. '// ИЗОБРАЖЕНИЯ И МИНИАТЮРЫ'). */
export function MiniatureChip({ name, logo, url, compact, withHeader = true, headerText = '// МИНИАТЮРЫ', role = 'модель' }: MiniatureChipProps) {
  return (
    <div data-testid="miniature-chip" className="flex flex-wrap items-center gap-2">
      {withHeader && (
        <span className="font-ibm-mono text-[10px] text-military-rust uppercase tracking-wider">
          {headerText}
        </span>
      )}
      <SourceChip name={name} role={role || undefined} logo={logo} url={url} compact={compact} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sponsor — who funded/commissioned the squad's miniatures or lore           */
/* -------------------------------------------------------------------------- */

interface SponsorChipProps {
  /** Optional display name; falls back to a generic «Спонсор отряда» label. */
  name?: string;
  /** Sponsor's profile URL (VK, etc.). The chip is always a link. */
  url: string;
  withHeader?: boolean;
  compact?: boolean;
}

/** Squad sponsor credit — a person who funded/commissioned the squad (miniatures
 *  or lore). Visually unified with the other dossier chips; uses a Heart icon
 *  (sponsorship = support) in rose, distinct from every lore-source tone. */
export function SponsorChip({ name, url, withHeader = true, compact }: SponsorChipProps) {
  return (
    <div data-testid="sponsor-chip" className="flex flex-wrap items-center gap-2">
      {withHeader && (
        <span className="font-ibm-mono text-[10px] text-military-rust uppercase tracking-wider">
          {'// СПОНСОР'}
        </span>
      )}
      {/* nofollow — a sponsor chip is promo, not a source credit. */}
      <SourceChip
        name={name ?? 'Спонсор отряда'}
        icon={Heart}
        tone="#f43f5e"
        url={url}
        rel="noopener noreferrer nofollow"
        compact={compact}
      />
    </div>
  );
}
