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
  CHAPTER_MAP,
  INVASION_MAPS_CREDIT_ID,
  getInvasionMap,
} from '@/lib/invasion-maps';
import { CREDITS } from '@/lib/painted-images';
import {
  InvasionMapShowcase,
  CampaignMapFigure,
} from '@/components/encyclopedia/history/InvasionMaps';

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

  it('CHAPTER_MAP: главы существуют, слаги карт валидны', () => {
    for (const [chapterSlug, mapSlug] of Object.entries(CHAPTER_MAP)) {
      expect(fs.existsSync(path.join(ROOT, 'src/content/history', `${chapterSlug}.md`))).toBe(true);
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

describe('invasion-maps: витрина (карта + период, зум)', () => {
  it('клик по карте открывает оригинал в новой вкладке', () => {
    render(<InvasionMapShowcase />);
    const open = screen.getByTestId('invasion-map-open');
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).toHaveAttribute('href', expect.stringContaining('/images/maps/pervaya-volna-4451-4461.jpg'));
  });

  it('несёт кредит автора со ссылкой на сообщество', () => {
    render(<InvasionMapShowcase />);
    const credit = screen.getByTestId('invasion-map-credit');
    expect(credit).toHaveAttribute('href', 'https://vk.ru/universestarsys');
    expect(credit).toHaveTextContent('ЗВЁЗДНЫЕ СИСТЕМЫ');
  });

  it('управляемый режим: prop active доминирует над внутренним состоянием', () => {
    render(<InvasionMapShowcase active="raskol-imperii-4550-4554" onSelect={() => {}} />);
    expect(screen.getByTestId('invasion-showcase-text')).toHaveTextContent('Раскол Империи');
  });
});

describe('invasion-maps: инлайн-фигура кампании', () => {
  it('рендерит карту и зум-ссылку_CAMPAIGN_MAP', () => {
    render(<CampaignMapFigure mapSlug="vtoraya-volna-4478-4495" />);
    expect(screen.getByTestId('invasion-map-figure')).toHaveTextContent('Вторая волна вторжения');
    expect(screen.getByTestId('invasion-map-open')).toHaveAttribute(
      'href',
      expect.stringContaining('vtoraya-volna-4478-4495.jpg'),
    );
  });

  it('неизвестный слаг — ничего не рендерит', () => {
    const { container } = render(<CampaignMapFigure mapSlug="no-such-map" />);
    expect(container).toBeEmptyDOMElement();
  });
});
