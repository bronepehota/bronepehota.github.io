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
import { Shield, Star, Megaphone, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { isProvenanceUniform, type LoreSource, type Provenance } from '@/lib/provenance';

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

/** Display metadata for each lore source bucket. */
const LORE_SOURCE_META: Record<
  LoreSource,
  { name: string; short: string; icon: LucideIcon; tone: string; logo: string; url: string }
> = {
  tehnolog: { name: 'Технолог', short: 'ТЕХНОЛОГ', icon: Shield, tone: '#06b6d4', logo: '/images/credits/tehnolog.png', url: 'https://www.tehnolog.ru' },
  star_system: { name: 'Star System', short: 'STAR SYSTEM', icon: Star, tone: '#f59e0b', logo: '/images/credits/star_system.jpg', url: 'https://vk.com/bp_bnp' },
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
        <span className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider">
          {'// ИСТОЧНИК'}
        </span>
      )}
      {chips}
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
      <SourceChip name={name} role="миниатюра" logo={logo} url={url} compact={compact} />
      {withContribute && <ContributeButton compact={compact} />}
    </div>
  );
}

interface ImageSourceChipProps {
  withHeader?: boolean;
  compact?: boolean;
  /** Override the image source — e.g. the render/model artist (from `unit.miniatureSource`).
   *  Absent → Star System (generic unpainted card-art). */
  source?: { name: string; logo: string; url: string };
}

/**
 * Image-source for UNPAINTED squads. Painted squads instead show a <PainterChip>.
 * If the squad's images are unpainted renders by a known creator (`unit.miniatureSource`),
 * pass `source` to show that creator; otherwise it falls back to Star System.
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
