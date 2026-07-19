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
