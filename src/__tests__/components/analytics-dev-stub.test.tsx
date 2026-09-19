import { render } from '@testing-library/react';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import YandexMetrica from '@/components/YandexMetrica';

// ID заданы (как в e2e-окружении) — проверяем ветку по NODE_ENV.
// Статический jest.mock: переопределение env на файл — отдельным файлом
// (см. гоччу про hoisted-моки в CLAUDE.md).
jest.mock('@/lib/constants', () => ({
  GA_MEASUREMENT_ID: 'G-TEST',
  YANDEX_METRICA_ID: '111302711',
}));

// process.env.NODE_ENV типизирован read-only — пишем через Object.assign
const setNodeEnv = (v: string) => Object.assign(process.env, { NODE_ENV: v });

/** next/script инжектит теги в document (не в контейнер RTL) — ищем там */
const scriptTexts = () =>
  Array.from(document.querySelectorAll('script')).map(
    (s) => `${s.id} ${s.getAttribute('src') ?? ''} ${s.textContent ?? ''}`
  );

describe('аналитика вне прода: стабы вместо реальных загрузчиков', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  afterEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV!);
    document.querySelectorAll('script').forEach((s) => s.remove());
  });

  it('дев: GA — no-op стаб, googletagmanager.com не грузится', () => {
    setNodeEnv('development');
    render(<GoogleAnalytics />);
    const scripts = scriptTexts().join('\n');
    expect(scripts).toContain('ga-e2e-stub');
    expect(scripts).toContain('dataLayer');
    expect(scripts).not.toContain('googletagmanager.com');
  });

  it('дев: Метрика — no-op стаб, mc.yandex.ru не грузится', () => {
    setNodeEnv('development');
    render(<YandexMetrica />);
    const scripts = scriptTexts().join('\n');
    expect(scripts).toContain('ym-e2e-stub');
    expect(scripts).not.toContain('mc.yandex.ru');
  });

  it('прод: GA грузит настоящий gtag.js', () => {
    setNodeEnv('production');
    render(<GoogleAnalytics />);
    const scripts = scriptTexts().join('\n');
    expect(scripts).toContain('googletagmanager.com/gtag/js');
    expect(scripts).not.toContain('ga-e2e-stub');
  });

  it('прод: Метрика грузит настоящий tag.js', () => {
    setNodeEnv('production');
    render(<YandexMetrica />);
    const scripts = scriptTexts().join('\n');
    expect(scripts).toContain('mc.yandex.ru/metrika/tag.js');
    expect(scripts).not.toContain('ym-e2e-stub');
  });
});
