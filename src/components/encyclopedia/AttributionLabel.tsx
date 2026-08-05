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
 */
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Shield, Star, Megaphone, ExternalLink, Check, Bot, Layers, Heart, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { isProvenanceUniform, isAlternativeVersion, type LoreSource, type Provenance, type LoreCredit } from '@/lib/provenance';

/** VK channel for data contributions / error reports (lore, painters, provenance). */
export const CONTRIBUTION_VK_URL = 'https://vk.ru/lastbpcoder';

/** Tooltip for the «АВБ» badge — the disclaimer that this is alternative, not replacement,
 *  lore/miniatures. Shown on every non-Технолог provenance row. */
export const ALTERNATIVE_VERSION_HINT =
  'АВБ — Альтернативная Версия Бронепехоты. Не является заменой оригинальным миниатюрам «Технолога», а расширяет игровой и коллекционный опыт вселенной «Бронепехота».';

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

/** Display metadata for each lore source bucket. */
const LORE_SOURCE_META: Record<
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
  /** Hex tone for the icon and border tint (ignored when `logo` is set). */
  tone?: string;
  /** Compact sizing for dense surfaces (faction cards). */
  compact?: boolean;
}

export function SourceChip({ name, role, icon, logo, url, tone, compact }: SourceChipProps) {
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
        <span className="font-ibm-mono text-[9px] normal-case tracking-normal text-military-steel/60">
          · {role}
        </span>
      )}
      {url && <ExternalLink className={cn(compact ? 'w-2.5 h-2.5' : 'w-3 h-3', 'text-military-steel/50')} aria-hidden />}
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
        rel="noopener noreferrer"
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
      rel="noopener noreferrer"
      onClick={handleClick}
      title={title}
      aria-label={title}
      data-testid="contribute-link"
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border transition-colors',
        copied
          ? 'border-military-amber/60 text-military-amber'
          : 'border-military-steel/30 text-military-steel/60 hover:text-military-amber hover:border-military-amber/50',
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

/** Tone for the named-author («автор лора») chip — warm bronze, distinct from every
 *  org-source tone: the citation credits a human author/work, not a faction source. */
const LORE_CREDIT_TONE = '#c2924a';

/** Renders a `LoreCredit` (a named author + work the lore was adapted from) as a
 *  dossier chip, visually unified with the org-source chips but flagged by a BookOpen
 *  icon. Orthogonal to the origin/loreAuthor chips — e.g. «Технолог» canon adapted
 *  from Chertischev's «Битва за Велиан» shows both the org badge and this citation. */
function loreCreditChip(credit: LoreCredit, compact?: boolean) {
  const name = credit.author ?? credit.work ?? 'Источник лора';
  // When the author is named, the work + year go to the role sub-label
  // («Chertischev · Битва за Велиан, 2022»); with no author, the work is the name.
  const role = credit.author
    ? [credit.work, credit.year].filter(Boolean).join(', ')
    : credit.year
      ? String(credit.year)
      : undefined;
  return (
    <span data-testid="lore-credit-chip">
      <SourceChip
        name={name}
        role={role || undefined}
        icon={BookOpen}
        tone={LORE_CREDIT_TONE}
        url={credit.url}
        compact={compact}
      />
    </span>
  );
}

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
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
          {'// ИСТОЧНИК'}
        </span>
      )}
      {chips}
      {/* Named-author citation (a specific book/novel the lore was adapted from) —
          shown on top of the org chips when `provenance.credit` is set. */}
      {provenance.credit && loreCreditChip(provenance.credit, compact)}
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
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
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
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
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
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
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
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
          {'// СПОНСОР'}
        </span>
      )}
      <SourceChip name={name ?? 'Спонсор отряда'} icon={Heart} tone="#f43f5e" url={url} compact={compact} />
    </div>
  );
}
