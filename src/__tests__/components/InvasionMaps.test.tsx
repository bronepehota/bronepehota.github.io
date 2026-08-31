/**
 * Карты театров войн (серия «СтарСис», Звёздные Системы) — реестр и галерея.
 * Инварианты: файлы карт лежат в public/, связи ведут на существующие
 * сущности, кредит-запись разрешения (лого+ссылка) на месте, галерея
 * переключает периоды и несёт кредит автора.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import {
  INVASION_MAPS,
  CAMPAIGN_MAP,
  INVASION_MAPS_CREDIT_ID,
  getInvasionMap,
} from '@/lib/invasion-maps';
import { CREDITS } from '@/lib/painted-images';
import { InvasionMapsGallery } from '@/components/encyclopedia/history/InvasionMaps';

const ROOT = path.resolve(__dirname, '../../..');

describe('invasion-maps: реестр', () => {
  it('пять периодов в хронологическом порядке', () => {
    expect(INVASION_MAPS).toHaveLength(5);
    const years = INVASION_MAPS.map((m) => Number(m.years.slice(0, 4)));
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it('файлы карт существуют в public/images/maps/', () => {
    for (const m of INVASION_MAPS) {
      expect(fs.existsSync(path.join(ROOT, 'public/images/maps', `${m.slug}.jpg`))).toBe(true);
    }
  });

  it('связи ведут на существующие кампании и world-досье', () => {
    for (const m of INVASION_MAPS) {
      for (const c of m.related.campaigns) {
        expect(fs.existsSync(path.join(ROOT, 'src/content/campaigns', `${c.slug}.md`))).toBe(true);
      }
      for (const w of m.related.world) {
        expect(fs.existsSync(path.join(ROOT, 'src/content/world', `${w.slug}.md`))).toBe(true);
      }
    }
  });

  it('CAMPAIGN_MAP: слаги кампаний существуют, слаги карт валидны', () => {
    for (const [campaignSlug, mapSlug] of Object.entries(CAMPAIGN_MAP)) {
      expect(fs.existsSync(path.join(ROOT, 'src/content/campaigns', `${campaignSlug}.md`))).toBe(true);
      expect(getInvasionMap(mapSlug)).toBeDefined();
    }
  });

  it('кредит серии — Звёздные Системы, с лого и ссылкой', () => {
    const credit = CREDITS[INVASION_MAPS_CREDIT_ID];
    expect(credit.name).toBe('Звёздные Системы');
    expect(credit.url).toMatch(/^https:\/\/vk\.ru\/universestarsys$/);
    expect(credit.logo).toBeTruthy();
    expect(fs.existsSync(path.join(ROOT, 'public', credit.logo))).toBe(true);
  });
});

describe('invasion-maps: галерея', () => {
  it('показывает первый период и переключает карту по табам', () => {
    render(<InvasionMapsGallery />);
    const tabs = screen.getAllByTestId('invasion-map-tab');
    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveTextContent('4451–4461');

    const img = screen.getByTestId('invasion-map-img');
    expect(img).toHaveAttribute('src', expect.stringContaining(INVASION_MAPS[0].slug));

    fireEvent.click(tabs[4]); // Раскол Империи
    expect(screen.getByTestId('invasion-map-img')).toHaveAttribute(
      'src',
      expect.stringContaining('raskol-imperii-4550-4554'),
    );
    expect(screen.getByTestId('invasion-map-figure')).toHaveTextContent('Раскол Империи');
  });

  it('несёт кредит автора со ссылкой на сообщество', () => {
    render(<InvasionMapsGallery />);
    const credit = screen.getByTestId('invasion-map-credit');
    expect(credit).toHaveAttribute('href', 'https://vk.ru/universestarsys');
    expect(credit).toHaveTextContent('ЗВЁЗДНЫЕ СИСТЕМЫ');
  });
});
