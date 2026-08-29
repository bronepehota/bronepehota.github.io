import {
  getAllWorldEntries,
  isWorldKind,
  WORLD_KIND_LABELS,
} from '@/lib/world';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';

describe('world entries («Алфавит вселенной»)', () => {
  const entries = getAllWorldEntries();

  it('возвращает первую партию из 6 записей', () => {
    expect(entries).toHaveLength(6);
    expect(entries.map((e) => e.slug)).toEqual([
      'lord-kross',
      'lord-erkhart',
      'markus-trehglazyy',
      'impireya-polyaris',
      'dominion',
      'gront',
    ]);
  });

  it('каждая запись: валидный kind, title, гриф из WORLD_KIND_LABELS', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (!isWorldKind(e.kind)) invalid.push(`${e.slug}: kind=${String(e.kind)}`);
      if (!/^(ПЕРСОНА|ЛОКАЦИЯ|БИТВА|ТЕРМИН)$/.test(WORLD_KIND_LABELS[e.kind as keyof typeof WORLD_KIND_LABELS] ?? ''))
        invalid.push(`${e.slug}: label`);
      if (!e.title || e.title.length <= 2) invalid.push(`${e.slug}: title`);
    }
    expect(invalid).toEqual([]);
  });

  it('меты первой партии: три персоны, два термина, локация Гронт', () => {
    const byslug = Object.fromEntries(entries.map((e) => [e.slug, e]));
    expect(byslug['lord-kross']).toMatchObject({
      kind: 'person',
      faction: 'polaris',
      subtitle: 'Великий Адмирал Внутренней Империи',
    });
    expect(byslug['lord-erkhart']!.kind).toBe('person');
    expect(byslug['markus-trehglazyy']!.kind).toBe('person');
    expect(byslug['impireya-polyaris']!.kind).toBe('term');
    expect(byslug['dominion']!.kind).toBe('term');
    expect(byslug['gront']).toMatchObject({
      kind: 'location',
      era: '4451',
      subtitle: expect.stringContaining('Нонус'),
    });
  });

  it('related.units ссылаются на реальные юниты энциклопедии', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      for (const id of e.related?.units ?? []) {
        if (!getEncyclopediaUnit(id)) invalid.push(`${e.slug} → unit ${id}`);
      }
    }
    expect(invalid).toEqual([]);
    // Кросс-чек ключевых связей первой партии.
    const kross = entries.find((e) => e.slug === 'lord-kross')!;
    expect(kross.related?.units).toContain('polaris_kross');
    const markus = entries.find((e) => e.slug === 'markus-trehglazyy')!;
    expect(markus.related?.units).toEqual(
      expect.arrayContaining([
        'polaris_markus_trehglazyy',
        'mercenaries_piraty_markusa_novye',
        'mercenaries_piraty_markusa_starye',
        'mercenaries_naytstalkery',
      ]),
    );
  });

  it('related.factions ссылаются на реальные фракции', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      for (const id of e.related?.factions ?? []) {
        if (!getEncyclopediaFaction(id)) invalid.push(`${e.slug} → faction ${id}`);
      }
    }
    expect(invalid).toEqual([]);
    expect(
      entries.find((e) => e.slug === 'impireya-polyaris')!.related?.factions,
    ).toContain('polaris');
  });

  it('related.chapters ссылаются на реальные главы истории', () => {
    const slugs = new Set(getAllHistoryChapters().map((c) => c.slug));
    const invalid: string[] = [];
    for (const e of entries) {
      for (const slug of e.related?.chapters ?? []) {
        if (!slugs.has(slug)) invalid.push(`${e.slug} → chapter ${slug}`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('related.campaigns ссылаются на реальные кампании', () => {
    const slugs = new Set(getAllCampaigns().map((c) => c.slug));
    const invalid: string[] = [];
    for (const e of entries) {
      for (const slug of e.related?.campaigns ?? []) {
        if (!slugs.has(slug)) invalid.push(`${e.slug} → campaign ${slug}`);
      }
    }
    expect(invalid).toEqual([]);
    // Кросс не приписан «Первой волне» (там армгруппой «Запад» командует Харм),
    // но присутствует в «Имперских войнах» («Центр» лорда Кросса).
    const kross = entries.find((e) => e.slug === 'lord-kross')!;
    expect(kross.related?.campaigns).toContain('imperatorskie-voyny');
    expect(kross.related?.campaigns).not.toContain('pervaya-volna-gront-i-rum');
    // Гронт, наоборот, — герой «Первой волны».
    expect(
      entries.find((e) => e.slug === 'gront')!.related?.campaigns,
    ).toContain('pervaya-volna-gront-i-rum');
  });

  it('frontmatter faction (если задан) существует в реестре фракций', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (e.faction && !getEncyclopediaFaction(e.faction)) invalid.push(`${e.slug}: ${e.faction}`);
    }
    expect(invalid).toEqual([]);
  });

  it('сортировка: order, затем алфавит по title (ru locale)', () => {
    // Первая партия полностью пронумерована — порядок стабилен.
    expect(entries.map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('каждая запись несёт sources (прозрачность происхождения сводки)', () => {
    const missing = entries.filter((e) => !e.sources || e.sources.length === 0).map((e) => e.slug);
    expect(missing).toEqual([]);
  });
});
