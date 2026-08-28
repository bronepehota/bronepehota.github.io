import { buildSearchHaystack, matchesSearch, matchLoreTitles } from '@/lib/unit-search';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = {
  id: 'test_hunter',
  name: 'Охотник',
  shortName: 'Хантер',
  faction: 'protectorate',
  type: 'machine',
  sources: [],
  encyclopedia: {
    manufacturer: 'Робогир Индастриз',
    lore: 'Машина времён Битвы за Блауд.',
  },
} as unknown as EncyclopediaUnit;

describe('unit-search', () => {
  it('haystack включает название, фракцию, производителя и лор', () => {
    const h = buildSearchHaystack(unit);
    expect(h).toContain('охотник');
    expect(h).toContain('протекторат');
    expect(h).toContain('робогир');
    expect(h).toContain('блауд');
  });

  it('matchesSearch: регистронезависимо, пустой запрос пропускает всех', () => {
    expect(matchesSearch(unit, 'РОБОГИР')).toBe(true);
    expect(matchesSearch(unit, 'Блауд')).toBe(true);
    expect(matchesSearch(unit, 'нет такого слова')).toBe(false);
    expect(matchesSearch(unit, '')).toBe(true);
  });

  it('matchLoreTitles: подстрока в заголовке, минимум 3 символа, до 3 результатов не режется тут', () => {
    const pages = [
      { title: 'Легендарные Имперские Лорды', href: '/encyclopedia/history#legendarnye-imperskie-lordy', kind: 'chapter' as const },
      { title: 'Красная ярость', href: '/encyclopedia/history#krasnaya-yarost', kind: 'chapter' as const },
      { title: 'Имперские войны', href: '/encyclopedia/history#wars', kind: 'campaign' as const },
    ];
    expect(matchLoreTitles('Лорд', pages)).toHaveLength(1);
    expect(matchLoreTitles('Имперск', pages)).toHaveLength(2);
    expect(matchLoreTitles('яр', pages)).toHaveLength(0);   // < 3 символов
    expect(matchLoreTitles('', pages)).toHaveLength(0);
  });
});
