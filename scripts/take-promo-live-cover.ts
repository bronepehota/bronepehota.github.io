#!/usr/bin/env tsx
/**
 * Generate VK live cover slides (5 images, 1920x768 each)
 * Each slide highlights one feature with a phone mockup.
 * Usage: npx tsx scripts/take-promo-live-cover.ts
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'promo', 'screenshots');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'promo', 'live-cover');

function imgB64(name: string) {
  const data = fs.readFileSync(path.join(SCREENSHOTS_DIR, name));
  return `data:image/png;base64,${data.toString('base64')}`;
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

interface Slide {
  file: string;
  tagline: string;
  title: string;
  description: string;
  features: string[];
  phone1: string;
  phone2?: string;
}

const slides: Slide[] = [
  {
    file: 'live-01-intro.png',
    tagline: 'Веб-приложение для настольного варгейма',
    title: 'БРОНЕПЕХОТА',
    description: 'Собирайте армию. Отслеживайте состояние отрядов в бою. Рассчитывайте попадания и урон. Создавайте собственные фракции и отряды.',
    features: ['Конструктор армии', 'Навигатор по карточкам', 'Боевой калькулятор', 'Энциклопедия', 'Редактор отрядов'],
    phone1: '02-army.png',
    phone2: '05-squad-card-battle.png',
  },
  {
    file: 'live-02-army.png',
    tagline: 'Конструктор армии',
    title: 'СБОР АРМИИ',
    description: 'Выберите фракцию, установите бюджет и добавьте отряды и технику. Всё сохраняется в браузере автоматически.',
    features: ['Выбор фракции', 'Лимит очков', 'Автонумерация', 'Автосохранение'],
    phone1: '02-army.png',
  },
  {
    file: 'live-03-navigator.png',
    tagline: 'Карточки в бою',
    title: 'НАВИГАТОР',
    description: 'Все карточки отрядов и машин на экране телефона. Прочность, боеприпасы, потери, действия.',
    features: ['Карточки отрядов', 'Карточки машин', 'Отслеживание состояния', 'Модификаторы'],
    phone1: '03-navigator.png',
    phone2: '05-squad-card-battle.png',
  },
  {
    file: 'live-04-calculator.png',
    tagline: 'Расчёт боя',
    title: 'КАЛЬКУЛЯТОР',
    description: 'Автоматический расчёт попаданий и урона с учётом модификаторов. Или ручной ввод для гипотетических боёв.',
    features: ['Выстрел / Ближний бой / Граната', 'Баффы и дебаффы', 'D6, D12, D20', 'Два свода правил'],
    phone1: '04-combat-modifiers.png',
    phone2: '07-calculator.png',
  },
  {
    file: 'live-05-encyclopedia.png',
    tagline: 'База знаний',
    title: 'ЭНЦИКЛОПЕДИЯ',
    description: 'Полный справочник всех отрядов, машин и фракций с портретами и описаниями. И редактор для создания собственных.',
    features: ['Портреты и описания', 'Лор и тактика', 'Редактор отрядов', 'Google Drive'],
    phone1: '08-encyclopedia.png',
  },
];

function renderSlide(slide: Slide): string {
  const phone2Html = slide.phone2
    ? `<div class="phone p2"><img src="${imgB64(slide.phone2)}" /></div>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1920px; height: 768px; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }

  .cover {
    width: 1920px; height: 768px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 100px;
    position: relative; color: white;
  }
  .cover::before {
    content: ''; position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .cover::after {
    content: ''; position: absolute; left: 100px; right: 100px; bottom: 0; height: 3px;
    background: linear-gradient(90deg, #ef4444, #06b6d4, #eab308);
  }

  .left { position: relative; z-index: 1; max-width: 850px; }
  .tagline { font-size: 18px; color: #64748b; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 20px; }
  .title {
    font-size: 76px; font-weight: 800; letter-spacing: -1px; line-height: 1; margin-bottom: 24px;
    background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .description { font-size: 24px; color: #94a3b8; line-height: 1.5; margin-bottom: 36px; max-width: 660px; }
  .features { display: flex; gap: 32px; list-style: none; flex-wrap: wrap; }
  .features li {
    font-size: 16px; color: #cbd5e1;
    display: flex; align-items: center; gap: 8px;
  }
  .features li::before { content: ''; width: 5px; height: 5px; background: #38bdf8; border-radius: 50%; flex-shrink: 0; }

  .right {
    position: relative; z-index: 1;
    display: flex; gap: 24px; align-items: center;
  }
  .phone {
    width: 240px; height: 500px;
    border-radius: 24px; overflow: hidden;
    border: 2px solid #334155;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  }
  .phone.p2 { margin-top: 60px; }
  .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; }

  .url { position: absolute; bottom: 20px; left: 100px; font-size: 16px; color: #475569; letter-spacing: 1px; }
  .slide-num { position: absolute; bottom: 20px; right: 100px; font-size: 16px; color: #334155; }
</style>
</head>
<body>
<div class="cover">
  <div class="left">
    <div class="tagline">${slide.tagline}</div>
    <div class="title">${slide.title}</div>
    <div class="description">${slide.description}</div>
    <ul class="features">
      ${slide.features.map(f => `<li>${f}</li>`).join('\n      ')}
    </ul>
  </div>
  <div class="right">
    <div class="phone p1"><img src="${imgB64(slide.phone1)}" /></div>
    ${phone2Html}
  </div>
  <div class="url">luxor.github.io/bronepehota</div>
</div>
</body>
</html>`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 768 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    console.log(`${i + 1}/${slides.length} ${slide.file}`);

    await page.setContent(renderSlide(slide), { waitUntil: 'load' });
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, slide.file),
      type: 'png',
      clip: { x: 0, y: 0, width: 1920, height: 768 },
    });
  }

  await browser.close();
  console.log(`\nDone. ${slides.length} slides saved to ${OUTPUT_DIR}`);
}

main().catch(console.error);
