import { SITE_URL } from './constants';

/**
 * Build an absolute, canonical URL for a route path.
 * `path` is the App-Router route WITHOUT basePath (e.g. '/encyclopedia/unit/hunter').
 * SITE_URL already includes basePath, so the result is the real public URL.
 */
export function absoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/** Site-wide brand name (openGraph.siteName / applicationName). */
export const SITE_NAME = 'Бронепехота';

/** Default social card — a 1200×630 screenshot of the landing hero
 *  (regenerate via tools/regen-og-image.mjs + tools/regen-og-crop.py when the
 *  landing changes). Fully-absolute so it survives any og consumer. */
export const DEFAULT_OG_IMAGE = absoluteUrl('/og-image.png');

export interface JsonLdThing {
  '@type': string;
  [key: string]: unknown;
}

/** WebApplication schema for the landing page (helps rich results / entity recognition). */
export function webApplicationJsonLd(): JsonLdThing {
  return {
    '@type': 'WebApplication',
    '@id': absoluteUrl('/#webapp'),
    name: 'Бронепехота',
    alternateName: 'Bronepehota',
    description:
      'Помощник для настольного варгейма «Бронепехота»: энциклопедия отрядов и техники, фракции, миссии, кампании и калькулятор боя.',
    url: absoluteUrl('/'),
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    inLanguage: 'ru-RU',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'RUB',
    },
    publisher: { '@id': absoluteUrl('/#org') },
  };
}

/** Organization/brand schema referenced from WebApplication. */
export function organizationJsonLd(): JsonLdThing {
  return {
    '@type': 'Organization',
    '@id': absoluteUrl('/#org'),
    name: 'Бронепехота',
    url: absoluteUrl('/'),
  };
}

/** BreadcrumbList schema for nested pages (encyclopedia → unit/mission). */
export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): JsonLdThing {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Per-page Open Graph + description derivation                               */
/* -------------------------------------------------------------------------- */

/**
 * IMPORTANT: a page-level `openGraph` object REPLACES the root-layout one
 * entirely — Next.js merges only top-level metadata fields, not nested ones.
 * A page that sets `openGraph: { title, description }` silently loses the
 * inherited og:image card / locale / siteName (observed on campaign pages).
 * `pageOpenGraph` reassembles the FULL set so any page can own its og:url
 * without dropping the site-wide social card.
 */
export interface PageOpenGraph {
  type: 'website' | 'article';
  locale: string;
  siteName: string;
  url: string;
  title: string;
  description: string;
  images: Array<{ url: string; width?: number; height?: number; alt?: string }>;
}

export function pageOpenGraph({
  title,
  description,
  path,
  type = 'website',
  images,
}: {
  title: string;
  description: string;
  /** Canonical route path (no basePath) — becomes og:url. */
  path: string;
  /** Long-form content (history chapters, campaigns) → 'article'. */
  type?: 'website' | 'article';
  /** Defaults to the site-wide 1200×630 landing card. */
  images?: PageOpenGraph['images'];
}): PageOpenGraph {
  return {
    type,
    locale: 'ru_RU',
    siteName: SITE_NAME,
    url: absoluteUrl(path),
    title,
    description,
    images:
      images ?? [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: 'Бронепехота — настольный варгейм',
        },
      ],
  };
}

/** Named HTML entities we may encounter in sanitized markdown HTML. */
const HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

/** Strip tags and decode entities — turn rendered HTML into plain text
 *  (source for meta descriptions; markdown syntax never survives the HTML
 *  render, so no markdown handling is needed here). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&([a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/g, (match, entity: string) => {
      if (entity.startsWith('#')) {
        const isHex = entity[1] === 'x' || entity[1] === 'X';
        // '#32;' → 32 (decimal), '#x20;' → 0x20 (hex — skip '#x')
        const code = isHex
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
        // Number.isFinite is not enough: String.fromCodePoint throws RangeError
        // on code points beyond Unicode's 0x10FFFF — replace those with a space
        // (collapsed by the whitespace pass below). Codes are non-negative by
        // the regex construction (digits only).
        return code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
      }
      return HTML_ENTITIES[entity] ?? ' ';
    })
    .replace(/\s+/g, ' ')
    // Tag removal inserts spaces next to punctuation («мир !» after </strong>!)
    // — tighten them back so descriptions read naturally.
    .replace(/\s+([,.!?;:…»])/g, '$1')
    .replace(/«\s+/g, '«')
    .trim();
}

/** Truncate plain text to ≤`max` characters on a word boundary with an
 *  ellipsis — for meta descriptions («первые ~150 символов тела»). */
export function metaDescription(text: string, max = 150): string {
  if (text.length <= max) return text;
  const lastSpace = text.slice(0, max + 1).lastIndexOf(' ');
  const boundary = lastSpace > max * 0.6 ? lastSpace : max;
  return `${text.slice(0, boundary).replace(/[\s,;:.!?…—-]+$/, '')}…`;
}

/* -------------------------------------------------------------------------- */
/* Article schema                                                             */
/* -------------------------------------------------------------------------- */

export interface ArticleJsonLdOptions {
  /** Article headline — the chapter/campaign title. */
  title: string;
  description: string;
  /** App-Router path (no basePath), e.g. '/encyclopedia/history/tungusskiy-artefakt'. */
  path: string;
  /** ISO 8601 publication date, when known (all current chapters predate
   *  the site and carry no per-chapter date — usually omitted). */
  datePublished?: string;
  /** Named human author (credit.author). Omitted → defaults to the
   *  «Технолог» publishing house (an Organization, not a Person). */
  authorName?: string;
  /** Hub this article belongs to (e.g. '/encyclopedia/history') — entity
   *  linkage to the reader-facing longread. */
  isPartOfPath?: string;
  /** og:image-quality article image. */
  image?: string;
}

/** Article schema for long-form content pages (history chapters, campaigns). */
export function articleJsonLd({
  title,
  description,
  path,
  datePublished,
  authorName,
  isPartOfPath,
  image,
}: ArticleJsonLdOptions): JsonLdThing {
  const url = absoluteUrl(path);
  return {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'ru-RU',
    author: authorName
      ? { '@type': 'Person', name: authorName }
      : { '@type': 'Organization', name: 'Издательство «Технолог»' },
    // References the Organization node — render organizationJsonLd() in the
    // same <JsonLd> graph so the @id resolves on this page.
    publisher: { '@id': absoluteUrl('/#org') },
    ...(isPartOfPath ? { isPartOf: { '@id': absoluteUrl(isPartOfPath) } } : {}),
    ...(image ? { image: [image] } : {}),
    ...(datePublished ? { datePublished } : {}),
  };
}
