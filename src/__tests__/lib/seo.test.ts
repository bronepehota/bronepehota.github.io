import {
  absoluteUrl,
  articleJsonLd,
  htmlToPlainText,
  metaDescription,
  pageOpenGraph,
} from '@/lib/seo';

describe('htmlToPlainText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Привет <strong>мир</strong>!</p>')).toBe('Привет мир!');
    expect(htmlToPlainText('<h3>Заголовок</h3>\n\n<p>Текст</p>')).toBe('Заголовок Текст');
  });

  it('decodes named and numeric entities', () => {
    expect(htmlToPlainText('а&nbsp;б &amp; в')).toBe('а б & в');
    expect(htmlToPlainText('&laquo;кавычки&raquo;')).toBe('«кавычки»');
    expect(htmlToPlainText('a&#32;b')).toBe('a b');
    expect(htmlToPlainText('a&#x20;b')).toBe('a b');
  });

  it('leaves unknown entities as separators', () => {
    expect(htmlToPlainText('x&unknownentity;y')).toBe('x y');
  });

  it('does not throw on out-of-range numeric entities (> 0x10FFFF)', () => {
    // String.fromCodePoint(9999999999) would throw RangeError — replaced with a space
    expect(() => htmlToPlainText('a&#9999999999;b')).not.toThrow();
    expect(htmlToPlainText('a&#9999999999;b')).toBe('a b');
  });
});

describe('metaDescription', () => {
  it('passes short text through unchanged', () => {
    expect(metaDescription('короткий текст')).toBe('короткий текст');
  });

  it('truncates long text on a word boundary with an ellipsis', () => {
    const text = 'слово '.repeat(60).trim();
    const result = metaDescription(text, 150);
    expect(result.length).toBeLessThanOrEqual(151); // 150 chars + «…»
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/\s…$/);
  });
});

describe('pageOpenGraph', () => {
  it('builds the full OG set — absolute og:url + the site og:image card', () => {
    const og = pageOpenGraph({
      title: 'История вселенной',
      description: 'Хроника',
      path: '/encyclopedia/history',
    });
    expect(og.type).toBe('website');
    expect(og.locale).toBe('ru_RU');
    expect(og.siteName).toBe('Бронепехота');
    // og:url must be absolute (a bare path would leak into the meta tag as-is)
    expect(og.url).toBe(absoluteUrl('/encyclopedia/history'));
    // The default site card must survive — a page-level openGraph object
    // replaces the root-layout one, so the builder always includes it.
    expect(og.images[0]).toMatchObject({
      url: absoluteUrl('/og-image.png'),
      width: 1200,
      height: 630,
    });
  });

  it('supports article type and custom images', () => {
    const og = pageOpenGraph({
      title: 'Тунгусский артефакт',
      description: 'д',
      path: '/encyclopedia/history/tungusskiy-artefakt',
      type: 'article',
      images: [{ url: absoluteUrl('/images/squads/x.png') }],
    });
    expect(og.type).toBe('article');
    expect(og.images).toHaveLength(1);
    expect(og.images[0].url).toBe(absoluteUrl('/images/squads/x.png'));
  });
});

describe('articleJsonLd', () => {
  it('renders headline/url/author from a named credit author (Person)', () => {
    const ld = articleJsonLd({
      title: 'Красная ярость',
      description: 'Описание главы',
      path: '/encyclopedia/history/krasnaya-yarost',
      authorName: 'Найтрос',
    });
    expect(ld['@type']).toBe('Article');
    expect(ld.headline).toBe('Красная ярость');
    expect(ld.url).toBe(absoluteUrl('/encyclopedia/history/krasnaya-yarost'));
    expect(ld.mainEntityOfPage).toBe(absoluteUrl('/encyclopedia/history/krasnaya-yarost'));
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Найтрос' });
    expect(ld.publisher).toEqual({ '@id': absoluteUrl('/#org') });
    expect(ld.isPartOf).toBeUndefined();
    expect(ld.datePublished).toBeUndefined();
  });

  it('falls back to the «Технолог» publishing house (Organization) without an author', () => {
    const ld = articleJsonLd({
      title: 'Тунгусский артефакт',
      description: 'д',
      path: '/encyclopedia/history/tungusskiy-artefakt',
    });
    expect(ld.author).toEqual({
      '@type': 'Organization',
      name: 'Издательство «Технолог»',
    });
  });

  it('includes isPartOf and datePublished only when provided', () => {
    const ld = articleJsonLd({
      title: 't',
      description: 'd',
      path: '/campaigns/shturm-velyana',
      isPartOfPath: '/encyclopedia/history',
      datePublished: '2026-08-01',
    });
    expect(ld.isPartOf).toEqual({ '@id': absoluteUrl('/encyclopedia/history') });
    expect(ld.datePublished).toBe('2026-08-01');
  });
});
