// src/__tests__/components/ArchiveHub.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ArchiveHub, { type HubCounts } from '@/components/encyclopedia/hub/ArchiveHub';
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import { getAllMissions } from '@/lib/missions-registry';
import { getAllWorldEntries } from '@/lib/world';
import { getSourcesCatalog } from '@/lib/sources-catalog';
import { buildLorePages } from '@/lib/lore-pages';

const replaceMock = jest.fn();

// Хаб читает useRouter для легаси-форварда ?faction=… → /encyclopedia/units.
jest.mock('next/navigation', () => ({
  useRouter: (): { replace: (href: string) => void } => ({ replace: replaceMock }),
}));

describe('ArchiveHub — корень-хаб «Архив вселенной»', () => {
  let units: Awaited<ReturnType<typeof getAllUnits>>;
  let counts: HubCounts;

  beforeAll(async () => {
    units = await getAllUnits();
    counts = {
      chapters: getAllHistoryChapters().length,
      campaigns: getAllCampaigns().length,
      world: getAllWorldEntries().length,
      units: units.length,
      missions: getAllMissions().length,
      sources: getSourcesCatalog().length,
      factions: new Set(units.map((u) => u.faction)).size,
    };
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  /** Пропсы как у серверной страницы /encyclopedia (та же сборка счётчиков). */
  function renderHub() {
    return render(
      <ArchiveHub
        lorePages={buildLorePages(units)}
        counts={counts}
        era={{ from: 1908, to: 4546 }}
      />,
    );
  }

  test('обложка дела рендерит счётчики ИЗ ДАННЫХ (главы/войны/досье/юниты)', async () => {
    renderHub();

    const cover = await screen.findByTestId('encyclopedia-hub-cover');
    expect(cover).toBeVisible();
    expect(cover).toHaveTextContent('ДЕЛО № RG-4530');
    expect(cover).toHaveTextContent('АРХИВ ВСЕЛЕННОЙ');

    // Счётчики — реальные числа из реестров, не хардкод.
    const counters = screen.getByTestId('hub-counters');
    expect(counters).toHaveTextContent(String(counts.chapters));
    expect(counters).toHaveTextContent(String(counts.campaigns));
    expect(counters).toHaveTextContent(String(counts.world));
    expect(counters).toHaveTextContent(String(counts.units));
    expect(counts.units).toBeGreaterThan(100);
  });

  test('все 7 разделов-папок ведут по своим адресам', async () => {
    renderHub();
    await screen.findByTestId('hub-sections');

    const expected: Array<[string, string]> = [
      ['history', '/encyclopedia/history'],
      ['wars', '/encyclopedia/history#wars'],
      ['world', '/encyclopedia/world'],
      ['units', '/encyclopedia/units'],
      ['factions', '/encyclopedia/factions'],
      ['missions', '/encyclopedia/missions'],
      ['sources', '/encyclopedia/sources'],
    ];
    for (const [id, href] of expected) {
      const link = screen.getByTestId(`hub-section-${id}`);
      expect(link).toHaveAttribute('href', href);
    }
    // Папка юнитов — акцентная: счётчик карт и фракций из данных.
    expect(screen.getByTestId('hub-section-units')).toHaveTextContent(
      `${counts.units} карт · ${counts.factions} фракций`,
    );
  });

  test('баннер «// РЕЖИМ БОЯ» на месте (тот же data-testid, что был на корне)', async () => {
    renderHub();
    expect(await screen.findByTestId('encyclopedia-battle-banner')).toBeVisible();
    expect(screen.getByTestId('encyclopedia-battle-banner-link')).toHaveAttribute('href', '/app');
  });

  test('лента эпох и футер-гид: юниты — ссылка на каталог', async () => {
    renderHub();
    const strip = await screen.findByTestId('hub-era-strip');
    expect(strip).toHaveTextContent('1908');
    expect(strip).toHaveTextContent('4546');

    // Гид «// С ЧЕГО НАЧАТЬ» переехал на хаб: последний шаг — ссылка.
    const guide = screen.getByTestId('lore-guide');
    expect(guide).toBeVisible();
    expect(screen.getByTestId('lore-guide-units')).toHaveAttribute('href', '/encyclopedia/units');
  });

  test('поиск по вселенной: «Блауд» даёт лор-подсказки, «клон» — строки юнитов', async () => {
    renderHub();
    const input = await screen.findByTestId('hub-search');

    // «Блауд»: титульные совпадения (кампания «Оборона Блауда», досье «Блауд»)
    // ранжируются выше матчей по ТЕЛАМ глав — но и глава «Космография Доминиона»
    // (слово из тела, не из титула) попадает в подсказки.
    fireEvent.change(input, { target: { value: 'Блауд' } });
    const hints = await screen.findAllByTestId('lore-search-hint');
    expect(hints[0]).toHaveAttribute('href', '/campaigns/oborona-blauda');
    expect(
      screen.getAllByTestId('lore-search-hint').some((h) =>
        h.getAttribute('href')?.includes('/encyclopedia/history#kosmografiya-dominiona'),
      ),
    ).toBe(true);

    // «клон» — юниты: строки «имя + точка фракции» (не больше 6) + переход
    // в каталог с тем же запросом.
    fireEvent.change(input, { target: { value: 'клон' } });
    const rows = await screen.findAllByTestId('hub-search-unit');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(6);
    expect(screen.getByTestId('hub-search-more')).toHaveAttribute(
      'href',
      `/encyclopedia/units?q=${encodeURIComponent('клон')}`,
    );
  });

  test('легаси-глубокие ссылки форвардятся на /encyclopedia/units с сохранением строки', async () => {
    window.history.pushState({}, '', '/encyclopedia?faction=polaris&q=x');
    renderHub();

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/encyclopedia/units?faction=polaris&q=x'),
    );
    // Хаб в этот кадр не отрисовался — обложки в DOM нет (нет «мигания»).
    expect(screen.queryByTestId('encyclopedia-hub-cover')).toBeNull();
  });

  test('без параметров хаб рендерится и никуда не форвардится', async () => {
    renderHub();
    expect(await screen.findByTestId('encyclopedia-hub-cover')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  test('«// НОВОЕ В АРХИВЕ»: каждый захардкоженный href существует в реестрах', async () => {
    // FRESH_ENTRIES в HubFresh закреплены в коде (витрина владельца) — ссылка
    // протухает, если слаг переименовали/удалили. Проверяем каждый href против
    // реестров кампаний и world-досье, чтобы падало здесь, а не 404-ом в проде.
    renderHub();
    await screen.findByTestId('hub-fresh');

    const entries = screen.getAllByTestId('hub-fresh-entry');
    expect(entries.length).toBeGreaterThanOrEqual(4);

    const campaignSlugs = new Set(getAllCampaigns().map((c) => c.slug));
    const worldSlugs = new Set(getAllWorldEntries().map((e) => e.slug));

    for (const link of entries) {
      // ?? '' — пропущенный href это тоже протухшая ссылка: не матчит ни один
      // префикс и роняет финальную проверку.
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('/campaigns/')) {
        expect(campaignSlugs.has(href.slice('/campaigns/'.length))).toBe(true);
      } else if (href.startsWith('/encyclopedia/world/')) {
        expect(worldSlugs.has(href.slice('/encyclopedia/world/'.length))).toBe(true);
      } else {
        // Неизвестный префикс — опечатка в href; честно роняем тест.
        expect(href).toMatch(/^\/(campaigns|encyclopedia\/world)\//);
      }
    }
  });
});
