# Расширение энциклопедии: вооружения, БМР/УМ, 4 книги, «История» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Смержить застрявшую ветку машинного лора и расширить энциклопедию: оружейные таблицы и индексы БМР/УМ из «Справочника техники», лор четырёх книг, страница «История вселенной».

**Architecture:** Всё на ветке `feat/encyclopedia-novel-lore` (сначала ребейз на `origin/main`), один PR. Новые лор-ТТХ — в `encyclopedia`-объект JSON машин + рендер `<UnitArmament>`/`DesignationChip` на карточке; книги — в существующие сущности (кампании, фракции, отряды) с `provenance.credit`; «Летопись» — новый контент-слой `src/content/history/*.md` с лоадером по образцу `campaigns.ts` и одним роутом `/encyclopedia/history`.

**Tech Stack:** Next.js 14 App Router (static export), TypeScript, Jest + @testing-library, Playwright (E2E — CI-only), gray-matter + remark-конвейер кампаний, Python (pdftotext + декод CP1251).

**Спека:** `docs/superpowers/specs/2026-08-18-encyclopedia-lore-expansion-design.md`

## Global Constraints

- UI-текст русский, код/идентификаторы английские. Mobile-first (320px+).
- **E2E локально НЕ запускать** (`npm run test:e2e` падает в этом окружении — CI-only). Верификация локально: `npm run type-check && npm run test`.
- `npm run validate` = type-check + lint + unit. Запускать перед каждым коммитом пачки.
- Пуш: `git -c credential.helper='!gh auth git-credential' push` (гоча с кредами). Никогда не коммитить в `main`.
- Тексты книг — **пересказ своими словами**, не дословный копипаст (авторские права). Исключение — короткие устоявшиеся названия/термины.
- Latin-bleed guard (`src/__tests__/lib/encyclopedia-squad-lore.test.ts`, `LATIN_WORD = /\b[A-Za-z]{4,}\b/`) сканирует **текстовые поля** JSON-лора. В `armament`/`designation` допустимы только коды моделей (`LG-25`, `Mk56` — без 4+ букв подряд); английские прозвища («Lightsword», «Dragon fire») — только в `src/content/unit-lore/*.md`.
- `armament`/`designation` кладём **только машинам**; guard-тест «every squad has exactly the target encyclopedia shape» фильтрует `type === 'squad'` — отрядов не касаемся.
- Коммиты: conventional (`feat(encyclopedia): …`), в конце `Co-Authored-By: Claude <noreply@anthropic.com>`. Стейджить конкретные пути (не `git add -A`).
- Селекторы в E2E: `getByTestId` > `getByRole` > `getByText`.

---

### Task 1: Ребейз ветки на origin/main, пуш, черновой PR

**Files:** — (только git-операции)

**Interfaces:**
- Produces: рабочая база всех следующих тасков — ветка `feat/encyclopedia-novel-lore` на текущем `origin/main`, remote-branch + draft PR.

- [ ] **Step 1: Ребейз**

```bash
git fetch origin main
git rebase origin/main
```

Ожидаемо: конфликты в `src/data/encyclopedia/units/*/machines.json|squads.json` (main добавлял dead_fleet/поля, ветка — лор) и, возможно, `src/components/encyclopedia/UnitDetailPage.tsx`. Разрешение: **объединение обеих сторон** (у юнита — все поля JSON обеих сторон; в компоненте — обе фичи). `git status` подскажет список; после каждого файла `git add <path>`; `git rebase --continue`.

- [ ] **Step 2: Верификация базы**

```bash
npm run type-check && npm run test
```

Expected: type-check 0 errors; Jest — все сьюты зелёные (1364+ тестов).

- [ ] **Step 3: Пуш (первый раз для этой ветки) + черновой PR**

```bash
git -c credential.helper='!gh auth git-credential' push -u origin feat/encyclopedia-novel-lore
gh pr create --draft --base main --head feat/encyclopedia-novel-lore \
  --title "feat(encyclopedia): машинный лор + 4 книги + История вселенной" \
  --body "WIP. Спека: docs/superpowers/specs/2026-08-18-encyclopedia-lore-expansion-design.md" 2>&1 | cat
```

(gh в песочнице глотает stdout — пайп через `cat`; проверить: `gh pr view feat/encyclopedia-novel-lore 2>&1 | cat`.)

---

### Task 2: Типы `ArmamentEntry`/`designation` + компонент `<UnitArmament>`

**Files:**
- Modify: `src/lib/encyclopedia-registry.ts:34-50` (интерфейс `EncyclopediaLore`)
- Create: `src/components/encyclopedia/UnitDetail/UnitArmament.tsx`
- Modify: `src/components/encyclopedia/UnitDetailPage.tsx` (импорт + рендер после `<UnitSpecs>`, ~строка 426)
- Test: `src/__tests__/components/UnitArmament.test.tsx`

**Interfaces:**
- Produces (для Tasks 3-4): в `EncyclopediaLore` появляются `designation?: string` и `armament?: ArmamentEntry[]`; компонент `UnitArmament({ unit: EncyclopediaUnit })` с `data-testid="unit-armament"` / `data-testid="armament-entry"`.

- [ ] **Step 1: Типы в `encyclopedia-registry.ts`**

Перед `export interface EncyclopediaLore` добавить:

```typescript
/** Позиция вооружения из официального «Справочника техники» (лор-ТТХ, не игровые статы). */
export interface ArmamentEntry {
  /** Русское название + код модели, напр. «Лазерная пушка «Световой меч» (LG-25)». */
  name: string;
  /** «30 мм», «5,6 мм» — как в справочнике, строкой. */
  caliber?: string;
  /** Дальность/особенность эффектом — строкой, если указана. */
  range?: string;
  /** Производитель, монтаж, эффект — кратко. */
  notes?: string;
}
```

Внутрь `EncyclopediaLore` (после `shortDescription?: string;`):

```typescript
  /** Машинный индекс по системе обозначений справочника: «БМР-1Г», «УМ-2Ш», «УМ6-2». */
  designation?: string;
  /** Таблица вооружений из «Справочника техники». */
  armament?: ArmamentEntry[];
```

- [ ] **Step 2: Падающий тест** — создать `src/__tests__/components/UnitArmament.test.tsx` (по образцу `src/__tests__/components/UnitSpecs.test.tsx`):

```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UnitArmament } from '@/components/encyclopedia/UnitDetail/UnitArmament';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = (encyclopedia: Record<string, unknown>): EncyclopediaUnit =>
  ({ encyclopedia } as unknown as EncyclopediaUnit);

describe('UnitArmament — таблица вооружений', () => {
  it('renders weapon entries with name, caliber and notes', () => {
    render(
      <UnitArmament
        unit={unit({
          designation: 'БМР-1Г',
          armament: [
            { name: 'Лазерная пушка «Световой меч» (LG-25)', notes: '«ЭнергоМагнетик Текнолоджиз Центавра Ко»' },
            { name: '3-х ствольный лёгкий пулемёт «Триплет» (Mk56)', caliber: '5,6 мм' },
          ],
        })}
      />,
    );
    expect(screen.getByText('Вооружение')).toBeInTheDocument();
    expect(screen.getByText('Лазерная пушка «Световой меч» (LG-25)')).toBeInTheDocument();
    expect(screen.getByText('5,6 мм')).toBeInTheDocument();
    expect(screen.getAllByTestId('armament-entry')).toHaveLength(2);
  });

  it('is hidden when armament is absent or empty', () => {
    const { container } = render(<UnitArmament unit={unit({ designation: 'УМ-1Ш' })} />);
    expect(container.firstChild).toBeNull();
    const { container: c2 } = render(<UnitArmament unit={unit({ armament: [] })} />);
    expect(c2.firstChild).toBeNull();
  });

  it('is hidden when encyclopedia is empty', () => {
    const { container } = render(<UnitArmament unit={unit({})} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 3: Запустить тест, убедиться в падении**

```bash
npx jest src/__tests__/components/UnitArmament.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/encyclopedia/UnitDetail/UnitArmament'`.

- [ ] **Step 4: Компонент** — создать `src/components/encyclopedia/UnitDetail/UnitArmament.tsx`:

```typescript
import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { Crosshair } from 'lucide-react';

/**
 * «Вооружение» — weapon manifest from the official Справочник техники.
 *
 * A mobile-first table: each row is the weapon's name (with its model code) over
 * a micro-label meta line (caliber / range), plus an optional notes paragraph.
 * Columns without any data across all rows simply never render. Mirrors the
 * dossier idiom of `UnitSpecs` (folded paper, oswald values, ibm-mono labels).
 * Hidden entirely when the machine has no `armament` (squads, machines outside
 * the handbook).
 */
interface UnitArmamentProps {
  unit: EncyclopediaUnit;
}

export function UnitArmament({ unit }: UnitArmamentProps) {
  const armament = unit.encyclopedia?.armament;
  if (!armament || armament.length === 0) return null;

  return (
    <div className="folded-paper military-corners p-6" data-testid="unit-armament">
      <h2 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
        <Crosshair className="w-5 h-5 text-military-rust" />
        Вооружение
      </h2>

      <ul className="divide-y divide-military-steel/15">
        {armament.map((w) => (
          <li key={w.name} className="py-3 first:pt-0 last:pb-0" data-testid="armament-entry">
            <div className="font-oswald text-military-sand text-sm md:text-base leading-tight">
              {w.name}
            </div>
            {(w.caliber || w.range) && (
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60">
                {w.caliber && <span>{w.caliber}</span>}
                {w.range && <span>{w.range}</span>}
              </div>
            )}
            {w.notes && (
              <p className="mt-1 text-military-sand/70 text-sm leading-relaxed">{w.notes}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Прогнать тест — зелёный**

```bash
npx jest src/__tests__/components/UnitArmament.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 6: Встройка в `UnitDetailPage.tsx`**

В блоке импортов (рядом с `import { UnitSpecs } from './UnitDetail/UnitSpecs';`, строки 14-17):

```typescript
import { UnitArmament } from './UnitDetail/UnitArmament';
```

Сразу после `{/* Характеристики … */} <UnitSpecs unit={unit} />` (~строка 426):

```tsx
            {/* Вооружение — weapon manifest from the Справочник техники.
                Constants of the machine, so base `unit` (not source-switched). */}
            <UnitArmament unit={unit} />
```

- [ ] **Step 7: Полная верификация + коммит**

```bash
npm run type-check && npm run test
git add src/lib/encyclopedia-registry.ts src/components/encyclopedia/UnitDetail/UnitArmament.tsx \
  src/components/encyclopedia/UnitDetailPage.tsx src/__tests__/components/UnitArmament.test.tsx
git commit -m "feat(encyclopedia): <UnitArmament> — таблица вооружений из Справочника + типы armament/designation

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Компонент `DesignationChip` в шапке карточки

**Files:**
- Create: `src/components/encyclopedia/UnitDetail/DesignationChip.tsx`
- Modify: `src/components/encyclopedia/UnitDetailPage.tsx:283-290` (блок class-чипа)
- Test: `src/__tests__/components/DesignationChip.test.tsx`

**Interfaces:**
- Consumes: `EncyclopediaLore.designation?: string` (Task 2).
- Produces: `DesignationChip({ unit })`, `data-testid="unit-designation"`.

- [ ] **Step 1: Падающий тест** — `src/__tests__/components/DesignationChip.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DesignationChip } from '@/components/encyclopedia/UnitDetail/DesignationChip';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = (encyclopedia?: Record<string, unknown>): EncyclopediaUnit =>
  ({ encyclopedia } as unknown as EncyclopediaUnit);

describe('DesignationChip — машинный индекс', () => {
  it('renders the designation code', () => {
    render(<DesignationChip unit={unit({ designation: 'БМР-1Г' })} />);
    expect(screen.getByTestId('unit-designation')).toHaveTextContent('БМР-1Г');
  });

  it('renders nothing without a designation', () => {
    const { container } = render(<DesignationChip unit={unit({ monoblock: 'РМ-1' })} />);
    expect(container.firstChild).toBeNull();
    const { container: c2 } = render(<DesignationChip unit={unit()} />);
    expect(c2.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: FAIL-проверка**

```bash
npx jest src/__tests__/components/DesignationChip.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Компонент** — `src/components/encyclopedia/UnitDetail/DesignationChip.tsx`:

```typescript
import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

/**
 * Машинный индекс из системы обозначений «Справочника техники» («БМР-1Г»,
 * «УМ-2Ш», «УМ6-2»). A stamped mono chip next to the unit's class — reads as
 * factory paperwork clipped to the dossier. Absent for squads and machines
 * outside the handbook.
 */
export function DesignationChip({ unit }: { unit: EncyclopediaUnit }) {
  const designation = unit.encyclopedia?.designation;
  if (!designation) return null;
  return (
    <span
      data-testid="unit-designation"
      className="inline-flex items-center rounded border border-military-steel/40 bg-military-charcoal/70 px-2 py-0.5 font-ibm-mono text-[11px] tracking-wider text-military-amber"
    >
      {designation}
    </span>
  );
}
```

- [ ] **Step 4: PASS-проверка**

```bash
npx jest src/__tests__/components/DesignationChip.test.tsx
```

- [ ] **Step 5: Встройка** — в `UnitDetailPage.tsx` импорт + рендер. Найти блок (строки ~283+):

```tsx
                  {(unit.encyclopedia?.class || rankLabel) && (
```

Сразу **после** закрывающей скобки этого условного блока добавить:

```tsx
                  {/* Машинный индекс по системе обозначений справочника («БМР-1Г»). */}
                  <div className="mb-3 md:mb-4">
                    <DesignationChip unit={unit} />
                  </div>
```

(импорт: `import { DesignationChip } from './UnitDetail/DesignationChip';`)

- [ ] **Step 6: Верификация + коммит**

```bash
npm run type-check && npm run test
git add src/components/encyclopedia/UnitDetail/DesignationChip.tsx \
  src/components/encyclopedia/UnitDetailPage.tsx src/__tests__/components/DesignationChip.test.tsx
git commit -m "feat(encyclopedia): DesignationChip — машинный индекс БМР/УМ в шапке карточки

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Извлечение вооружений/индексов/моноблоков из «Справочника техники» → machines.json

**Files:**
- Create: `tools/handbook_armament.py` (скрипт разбора)
- Modify: `src/data/encyclopedia/units/protectorate/machines.json`, `src/data/encyclopedia/units/polaris/machines.json` (поля `armament`, `designation`, значения `monoblock`)
- Test: `src/__tests__/lib/encyclopedia-armament.test.ts`
- Test (E2E, CI-only): дополнение в `e2e/encyclopedia.spec.ts`

**Interfaces:**
- Consumes: типы Task 2.
- Produces: у машин из справочника заполнены `encyclopedia.armament`/`designation`; `monoblock` — с прозвищами.

**Контекст данных** (из справочника, уже проверено): оружейные блоки имеют вид `Вооружение рейдового шагающего танка «Грифон»` + пункты, начинающиеся с `-- `. Известные обозначения: Харрикейн/Торнадо = модификации **БМР-1Г** (моноблок РМ-1, прозвище «Осьминог»); ТиРэкс = **БМР-2Ш** (моноблок «Зверь»); имперские: моноблок №1 = «Сундук», №2 = «Жук» (Хеликс/Спайдер/Локуст → УМ-2Ш); Спайдер = **УМ6-2** (шестиног); Эрайзер/Девастатор/Демолишер = модификации **УМГ-1**. Протекторат использует префикс БМР + буква Ш/Г/Л, империя — УМ + Ш/Г/Л + номер моноблока.

- [ ] **Step 1: Скрипт разбора** — `tools/handbook_armament.py`:

```python
#!/usr/bin/env python3
"""Extract per-machine weapon blocks from the Справочник техники PDF text.

Pipeline: pdftotext -raw (mojibake: cp1251 read as latin-1, re-encoded UTF-8),
then a per-char roundtrip: chars <= U+00FF become bytes, real Unicode passes
through; the byte stream decodes back as cp1251. Finds "Вооружение ... «Name»"
headers and the "-- " weapon entries under them; prints a JSON skeleton for
manual curation into machines.json (armament/designation).

Usage:
  pdftotext -raw ~/Documents/BP/Spravochnik_tekhniki_robogir.pdf /tmp/handbook.txt
  python3 tools/handbook_armament.py /tmp/handbook.txt > /tmp/armament.json
"""
import json
import re
import sys


def decode_roundtrip(text: str) -> str:
    res, buf = [], bytearray()
    for ch in text:
        o = ord(ch)
        if o <= 0xFF:
            buf.append(o)
        else:
            if buf:
                res.append(bytes(buf).decode('cp1251', errors='replace'))
                buf = bytearray()
            res.append(ch)
    if buf:
        res.append(bytes(buf).decode('cp1251', errors='replace'))
    return ''.join(res)


def main(path: str) -> None:
    raw = open(path, encoding='utf-8').read()
    t = decode_roundtrip(raw)
    sections = []
    for m in re.finditer(r'Вооружение[^\n]*?«([^»]+)»[^\n]*\n', t):
        chunk = t[m.end():m.end() + 6000]
        weapons = []
        for e in re.finditer(r'--\s+([^\n]+)\n((?:(?!--\s|\n\s*\n)[^\n]*\n?)*)', chunk):
            first = ' '.join(e.group(1).split())
            desc = ' '.join(e.group(2).split())
            if first:
                weapons.append({'first_line': first, 'description': desc[:500]})
        if weapons:
            sections.append({'machine_ru': m.group(1), 'weapons': weapons})
    print(json.dumps(sections, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/handbook.txt')
```

- [ ] **Step 2: Извлечь и курировать**

```bash
pdftotext -raw /home/atuzov/Documents/BP/Spravochnik_tekhniki_robogir.pdf /tmp/handbook.txt
python3 tools/handbook_armament.py /tmp/handbook.txt > /tmp/armament.json
python3 -c "import json; d=json.load(open('/tmp/armament.json')); [print(s['machine_ru'], len(s['weapons'])) for s in d]"
```

Expected: ~15-25 секций с 2-5 оружиями каждая.

Для сверки контекста по конкретной машине — декодированный текст целиком:

```bash
python3 -c "
import sys; sys.path.insert(0, 'tools')
from handbook_armament import decode_roundtrip
open('/tmp/handbook_utf8.txt', 'w').write(decode_roundtrip(open('/tmp/handbook.txt', encoding='utf-8').read()))
"
grep -n -B2 -A6 '«Грифон»' /tmp/handbook_utf8.txt | head -40
```

Сверить `machine_ru` с ID энциклопедии (реестр соответствий в `docs/ENCYCLOPEDIA_LORE_SOURCES.md` №2: griffin, predator, carnivore, hurricane, trex, tornado, octopus — Протекторат; wildbear, spider, locust, raptor, devastator, superlocust, eraser, helix, thunder — Полярис). Для каждой машины из `/tmp/armament.json` вписать в её `encyclopedia`-объект `armament` (по каждому оружию: `name` = русское имя + код модели из first_line, `caliber` = калибр если есть, `notes` = производитель/эффект одной строкой ≤120 симв.) и `designation` (по правилам БМР/УМ из контекста выше; сверять по grep: `grep -n -B2 -A6 '«<Имя>»' /tmp/handbook_utf8.txt`). Английские прозвища (Lightsword, Dragon fire, Halberd, Beast) в JSON НЕ переносить — только в `src/content/unit-lore/<id>.md` (латиница ≥4 букв ломает latin-bleed guard).

Моноблоки — обновить значения `monoblock` (машины Протектората: РМ-1 → `РМ-1 («Осьминог»)`, 2-я серия → `РМ-2 («Жук»)`, БМР-2 → `РМ-2 («Зверь»)` если текст подтверждает; имперские: `УМ-1 («Сундук»)`, `УМ-2 («Жук»)`). Формат единый: `РМ-1 («Осьминог»)`.

- [ ] **Step 3: Тест данных** — `src/__tests__/lib/encyclopedia-armament.test.ts`:

```typescript
import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';

const names = (id: string) =>
  (getEncyclopediaUnit(id)?.encyclopedia?.armament ?? []).map((w) => w.name).join('|');

describe('encyclopedia machine armament (Справочник техники)', () => {
  it('griffin carries the four handbook weapons', () => {
    const all = names('griffin');
    expect(all).toContain('Световой меч');
    expect(all).toContain('Драконье пламя');
    expect(all).toContain('Триплет');
    expect(all).toContain('Алебарда');
  });

  it('machines outside the handbook have no armament (секции нет — данных нет)', () => {
    // hornet отсутствует в справочнике (реестр источников №2)
    expect(getEncyclopediaUnit('hornet')?.encyclopedia?.armament).toBeUndefined();
  });

  it('every designation follows the БМР/УМ index system', () => {
    for (const id of ['griffin', 'hurricane', 'tornado', 'trex', 'raptor', 'spider', 'locust', 'helix']) {
      const d = getEncyclopediaUnit(id)?.encyclopedia?.designation;
      if (d) expect(d).toMatch(/^(БМР|УМ)/);
    }
  });

  it('armament entries pass the latin-bleed guard (only short model codes)', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    for (const id of ['griffin', 'hurricane', 'tornado', 'trex', 'raptor', 'spider', 'locust', 'helix', 'thunder', 'devastator']) {
      for (const w of getEncyclopediaUnit(id)?.encyclopedia?.armament ?? []) {
        for (const v of [w.name, w.caliber, w.range, w.notes].filter(Boolean) as string[]) {
          expect(`${id}: ${v}`).not.toMatch(LATIN_WORD);
        }
      }
    }
  });
});
```

- [ ] **Step 4: Прогнать тесты**

```bash
npx jest src/__tests__/lib/encyclopedia-armament.test.ts && npx jest src/__tests__/lib/encyclopedia-squad-lore.test.ts
```

Expected: PASS оба (второй — guard не сломался).

- [ ] **Step 5: E2E (CI-only, не запускать локально)** — в `e2e/encyclopedia.spec.ts` добавить:

```typescript
test('карточка машины показывает вооружение из справочника', async ({ page }) => {
  await page.goto('/encyclopedia/unit/griffin');
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('unit-armament')).toBeVisible();
  await expect(page.getByTestId('armament-entry').first()).toContainText('Световой меч');
});
```

- [ ] **Step 6: Верификация + коммит**

```bash
npm run type-check && npm run test
git add tools/handbook_armament.py src/data/encyclopedia/units/protectorate/machines.json \
  src/data/encyclopedia/units/polaris/machines.json src/__tests__/lib/encyclopedia-armament.test.ts \
  e2e/encyclopedia.spec.ts
git commit -m "feat(encyclopedia): таблицы вооружений + индексы БМР/УМ + прозвища моноблоков из Справочника

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: «Имперские войны» → кампания + лор фракций

**Files:**
- Create: `src/content/campaigns/imperatorskie-voyny.md`
- Modify: `src/data/encyclopedia/factions.json` (description `polaris`, `protectorate`)
- Test: дополнение в `src/__tests__/lib/campaigns.test.ts`
- Test (E2E, CI-only): дополнение в `e2e/campaigns.spec.ts`

**Interfaces:**
- Consumes: формат `CampaignMeta` (`src/lib/campaigns.ts`), паттерн `src/content/campaigns/shturm-velyana.md`.

**Источник:** `/home/atuzov/Documents/BP/Khroniki_Imperskikh_Voyn_v2_1-3.pdf` (62 стр.; `pdftotext -layout` читается без декода). Содержание: к середине 45 века Протекторат доминирует в Доминионе; в 4451 внезапное вторжение сотен боевых кораблей — армии солдат-«близнецов»; Доминион впервые встречает Империю Полярис, которая ведёт родословную от Разведкорпуса, изолировавшегося 1600 лет назад.

- [ ] **Step 1: Кампания** — `src/content/campaigns/imperatorskie-voyny.md`. Frontmatter (сверить `order` с существующими: shturm-velyana=3; поставить 1 — самая ранняя эра):

```yaml
---
slug: imperatorskie-voyny
title: Имперские войны
subtitle: Вторжение 4451 года и рождение Империи Полярис
era: "4451–4460-е"
factions: [polaris, protectorate, mercenaries]
order: 1
units:
  - { id: raptor, role: «Имперская линейная танкетка Первой волны» }
  - { id: bronekhod, role: «Гусеничная самоходка Протектората» }
  - { id: mercenaries_kosari, role: «Наёмники на обеих сторонах фронта» }
---
```

(`units` расширить машинами/отрядами, реально упомянутыми в тексте — сверять ID с энциклопедией.) Тело — пересказ своими словами, 5-7 секций `##`: `## Доминион к середине века`, `## Вторжение 4451 года`, `## Армия близнецов`, `## Родословная Разведкорпуса`, `## Контрнаступление и Торговые войны`, `## Итоги`. Каждая секция 2-4 абзаца. В конце — строка первоисточника по образцу shturm-velyana.md.

- [ ] **Step 2: Фракции** — в `factions.json` обогатить `description` у `polaris` и `protectorate` (по 2-3 предложения пересказа об истории 4451 года; существующий текст не удалять, дополнить). Кредит на фракции не ставить (org-level `tehnolog` уже верен; именной кредит живёт на кампании и машинах).

- [ ] **Step 3: Тест** — дополнение в `src/__tests__/lib/campaigns.test.ts`:

```typescript
it('включает кампанию «Имперские войны» с ранним order', () => {
  const all = getAllCampaigns();
  const c = all.find((x) => x.slug === 'imperatorskie-voyny');
  expect(c).toBeDefined();
  expect(c?.order).toBe(1);
  expect(c?.factions).toContain('polaris');
  expect(all[0]?.slug).toBe('imperatorskie-voyny');
});
```

- [ ] **Step 4: E2E (CI-only)** — в `e2e/campaigns.spec.ts`:

```typescript
test('в Хрониках видна «Имперские войны»', async ({ page }) => {
  await page.goto('/campaigns');
  await page.waitForLoadState('networkidle');

  const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Имперские войны' }).first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Имперские войны' })).toBeVisible();
});
```

- [ ] **Step 5: Верификация + коммит**

```bash
npm run type-check && npm run test
git add src/content/campaigns/imperatorskie-voyny.md src/data/encyclopedia/factions.json \
  src/__tests__/lib/campaigns.test.ts e2e/campaigns.spec.ts
git commit -m "feat(encyclopedia): кампания «Имперские войны» (Chertischev) + история фракций

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: «Косары» → лор наёмников

**Files:**
- Modify: `src/data/encyclopedia/factions.json` (description `mercenaries`)
- Modify: `src/data/encyclopedia/units/mercenaries/squads.json` (лор + `provenance.credit` затронутых отрядов — в первую очередь `mercenaries_kosari`)
- Test: дополнение в `src/__tests__/lib/encyclopedia-squad-lore.test.ts` ИЛИ новый `src/__tests__/lib/mercenaries-lore.test.ts`

**Interfaces:**
- Consumes: `provenance.credit: LoreCredit = {author?, work?, year?, url?}` (механизм есть на ветке, см. `docs/ENCYCLOPEDIA_LORE_SOURCES.md`).

**Источник:** `/home/atuzov/Documents/BP/Kosary.pdf` (24 стр., pdftotext -layout читается). Содержание: историческая справка (маяки, товарообмен, Совет Мастеров и **Зал Наёмников** — биржа труда), структура наёмных подразделений, Силы Самообороны планет, экипировка пехоты Доминиона, известные отряды наёмников, прославленные части ССО.

- [ ] **Step 1: Фракция** — `mercenaries.description`: дополнить пересказом (Зал Наёмников как институт, роль наёмников в Торговых войнах, границы Доминиона). Существующее не удалять.

- [ ] **Step 2: Отряды** — для `mercenaries_kosari` и других отрядов, реально названных в книге (сверять по тексту «Известные отряды наемников», стр. 12-18): enrich `encyclopedia.lore`/`history` (пересказ, 3-6 предложений), поставить:

```json
"provenance": { "credit": { "author": "Chertischev", "work": "Косары", "year": 2008 } }
```

(год сверить по тексту книги; если не указан — опустить `year`.)

- [ ] **Step 3: Тест** — `src/__tests__/lib/mercenaries-lore.test.ts`:

```typescript
import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';

describe('лор наёмников из «Косарей»', () => {
  it('фракция описывает Зал Наёмников', () => {
    expect(getEncyclopediaFaction('mercenaries')?.description).toContain('Зал Наёмников');
  });

  it('kosari несут кредит Chertischev', () => {
    const credit = getEncyclopediaUnit('mercenaries_kosari')?.provenance?.credit;
    expect(credit?.author).toBe('Chertischev');
    expect(credit?.work).toBe('Косары');
  });

  it('новый лор отрядов проходит latin-bleed guard', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    const u = getEncyclopediaUnit('mercenaries_kosari');
    for (const v of [u?.encyclopedia?.lore, u?.encyclopedia?.history].filter(Boolean) as string[]) {
      expect(v).not.toMatch(LATIN_WORD);
    }
  });
});
```

- [ ] **Step 4: Верификация + коммит**

```bash
npm run type-check && npm run test
git add src/data/encyclopedia/factions.json src/data/encyclopedia/units/mercenaries/squads.json \
  src/__tests__/lib/mercenaries-lore.test.ts
git commit -m "feat(encyclopedia): лор наёмников из «Косарей» — Зал Наёмников, kosari, кредиты

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: «Штурмовики Протектората» → лор штурмовых отрядов

**Files:**
- Modify: `src/data/encyclopedia/units/protectorate/squads.json` (лор + кредит штурмовых отрядов)
- Modify: `src/data/encyclopedia/factions.json` (дополнение `protectorate.description` — структура ВКС)

**Источник:** `/home/atuzov/Documents/BP/Shturmoviki_Protektorata.pdf` (19 стр., подписан **V.Chertischev**). Содержание: историческая справка (ВКС Протектората: флот, планетарная гвардия, киберпехота, наёмники; молниеносная атака Империи 4451), структура штурмовых подразделений, арсенал, штурмовые подразделения, выдающиеся личности.

- [ ] **Step 1: Отряды** — штурмовые отряды в `protectorate/squads.json` (проверенные ID): `protectorate_shturmovaya_kiber_pehota` (киберпехота — прямо названа в книге как контингент ВКС), `protectorate_shturmovoy_otryad_stervyatniki`, `protectorate_shturmovoy_spetsnaz_novye`/`_starye` (сверить упоминания в тексте, стр. 13-14 «Штурмовые подразделения»). Enrich `encyclopedia.lore`/`history` пересказом (какие задачи решают, из кого набирают, чем вооружены). Кредит:

```json
"provenance": { "credit": { "author": "V.Chertischev", "work": "Штурмовики Протектората" } }
```

- [ ] **Step 2: Фракция** — `protectorate.description`: дополнить структурой ВКС (флот / гвардия / киберпехота / наёмники) 2-3 предложениями пересказа.

- [ ] **Step 3: Тест** — создать `src/__tests__/lib/protectorate-lore.test.ts`:

```typescript
import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';

describe('лор штурмовых отрядов Протектората', () => {
  it('киберпехота несёт кредит V.Chertischev', () => {
    const u = getEncyclopediaUnit('protectorate_shturmovaya_kiber_pehota');
    expect(u?.provenance?.credit?.author).toBe('V.Chertischev');
    expect(u?.provenance?.credit?.work).toBe('Штурмовики Протектората');
  });
});
```

- [ ] **Step 4: Верификация + коммит**

```bash
npm run type-check && npm run test
git add src/data/encyclopedia/units/protectorate/squads.json src/data/encyclopedia/factions.json \
  src/__tests__/lib/protectorate-lore.test.ts
git commit -m "feat(encyclopedia): лор штурмовых отрядов Протектората (V.Chertischev)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Лоадер «Истории» + главы «Летописи»

**Files:**
- Create: `src/lib/history.ts`
- Create: `src/content/history/*.md` (8 глав)
- Test: `src/__tests__/lib/history.test.ts`

**Interfaces:**
- Consumes: `renderMarkdownToSanitizedHtml` из `src/lib/campaigns.ts` (уже экспортирована).
- Produces (для Task 9): `getAllHistoryChapters(): HistoryChapterMeta[]` (sync, Jest-safe), `getHistoryChapter(slug): Promise<HistoryChapter | null>` (async).

**Источник:** `/home/atuzov/Documents/BP/LETOPIS_-_ZVEZDNYE_GEROI.pdf` (65 стр., официальная вёрстка, pdftotext -layout читается; автора в метаданных нет — искать в тексте; если не найден — кредит не ставить). Ось сюжета (проверено): Тунгусский метеорит 1908 → найден в 2398 → антиграв/сверхсвет → сеть маяков 2420-40 → массовая экспансия с 2437, ООН → Единое Земное Правительство, Разведкорпус → пропажа/«заблудившаяся» Земля, распад связей → Лига (почти миллион кубопарсеков) → Доминион → самоизоляция Разведкорпуса → Империя Полярис.

- [ ] **Step 1: Лоадер** — `src/lib/history.ts` (зеркало `campaigns.ts`; рендер переиспользуем):

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { renderMarkdownToSanitizedHtml } from './campaigns';

export interface HistoryChapterMeta {
  slug: string;
  title: string;
  era?: string;
  order?: number;
}

export interface HistoryChapter extends HistoryChapterMeta {
  bodyHtml: string;
}

const HISTORY_DIR = path.join(process.cwd(), 'src', 'content', 'history');

// Sync: frontmatter only (no Markdown rendering). Safe to call in Jest.
export function getAllHistoryChapters(): HistoryChapterMeta[] {
  if (!fs.existsSync(HISTORY_DIR)) return [];
  const files = fs.readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.md'));
  const metas = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(HISTORY_DIR, f), 'utf8');
    return { slug, ...(matter(raw).data as Omit<HistoryChapterMeta, 'slug'>) };
  });
  metas.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return metas;
}

// Async: dynamically imports remark via the campaigns pipeline — module stays Jest-importable.
export async function getHistoryChapter(slug: string): Promise<HistoryChapter | null> {
  const fullPath = path.join(HISTORY_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
  const bodyHtml = await renderMarkdownToSanitizedHtml(content);
  return { slug, ...(data as Omit<HistoryChapterMeta, 'slug'>), bodyHtml };
}
```

- [ ] **Step 2: Главы** — `src/content/history/`, 8 файлов (frontmatter + тело-пересказ 3-6 абзацев каждый):

| Файл | title | era | order |
|---|---|---|---|
| `tungusskiy-artefakt.md` | Тунгусский артефакт | 1908–2398 | 1 |
| `setka-mayakov.md` | Первые прыжки и сеть маяков | 2398–2440 | 2 |
| `velikaya-expansiya.md` | Великая экспансия | 2437–2600-е | 3 |
| `razvedkorpus.md` | Разведывательный Корпус | — | 4 |
| `propavshaya-zemlya.md` | Пропавшая Земля | — | 5 |
| `liga-i-dominion.md` | Лига и Доминион | — | 6 |
| `dve-sily.md` | Две силы | — | 7 |
| `ekipirovka-pehoty-dominiona.md` | Экипировка пехоты Доминиона | — | 8 |

Первые 7 — по «Летописи» (эры уточнить по тексту), 8-я — из «Косарей» (раздел «Экипировка и вооружение пехоты Доминиона», стр. 10-12). Формат главы:

```markdown
---
slug: tungusskiy-artefakt
title: Тунгусский артефакт
era: "1908–2398"
order: 1
---

Пересказ своими словами: падение 1908 года, находка 2398-го в тайге у Подкаменной
Тунгуски, инопланетная двигательная установка, антигравитация и сверхсвет…
```

- [ ] **Step 3: Тест лоадера** — `src/__tests__/lib/history.test.ts` (по образцу `campaigns.test.ts`; только sync-часть):

```typescript
import { getAllHistoryChapters } from '@/lib/history';

describe('history chapters', () => {
  const chapters = getAllHistoryChapters();

  it('возвращает 8 глав, отсортированных по order', () => {
    expect(chapters).toHaveLength(8);
    const orders = chapters.map((c) => c.order ?? 99);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('первая глава — Тунгусский артефакт, восьмая — экипировка пехоты', () => {
    expect(chapters[0]?.slug).toBe('tungusskiy-artefakt');
    expect(chapters[7]?.slug).toBe('ekipirovka-pehoty-dominiona');
  });

  it('каждая глава имеет title', () => {
    for (const c of chapters) expect(c.title.length).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 4: Прогнать** — `npx jest src/__tests__/lib/history.test.ts` → PASS.

- [ ] **Step 5: Коммит**

```bash
npm run type-check && npm run test
git add src/lib/history.ts src/content/history/ src/__tests__/lib/history.test.ts
git commit -m "feat(encyclopedia): лоадер истории + 8 глав «Летописи» и «Косарей»

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Роут `/encyclopedia/history` + таб + sitemap

**Files:**
- Create: `src/app/encyclopedia/history/page.tsx`
- Modify: `src/components/encyclopedia/EncyclopediaTabs.tsx` (4-й таб)
- Modify: `src/app/sitemap.ts` (статический маршрут)
- Test (E2E, CI-only): `e2e/history.spec.ts`

**Interfaces:**
- Consumes: `getAllHistoryChapters`, `getHistoryChapter` (Task 8).

- [ ] **Step 1: Страница** — `src/app/encyclopedia/history/page.tsx` (server component; фоновые слои и структура — по образцу `src/app/campaigns/[slug]/page.tsx`):

```tsx
import { getAllHistoryChapters, getHistoryChapter } from '@/lib/history';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { BASE_PATH } from '@/lib/constants';

const HISTORY_BG = `${BASE_PATH}/images/campaigns/chronicle-bg.jpg`;

export const metadata = {
  title: 'История вселенной — Энциклопедия Бронепехоты',
  description:
    'Хроника человечества: от Тунгусского артефакта и первых прыжков к звёздам до Доминиона и двух сверхдержав.',
};

export default async function HistoryPage() {
  const metas = getAllHistoryChapters();
  const chapters = (await Promise.all(metas.map((m) => getHistoryChapter(m.slug)))).filter(
    (c): c is NonNullable<typeof c> => c !== null,
  );

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14">
        {/* Header */}
        <header className="mb-8">
          <h1
            data-testid="history-title"
            className="font-russo font-black text-3xl md:text-5xl text-white military-text-gradient uppercase mb-4"
          >
            История вселенной
          </h1>
          <EncyclopediaTabs className="mb-6" />
        </header>

        {/* Anchor TOC */}
        <nav data-testid="history-toc" className="folded-paper military-corners p-6 mb-8">
          <ol className="space-y-2">
            {chapters.map((c, i) => (
              <li key={c.slug}>
                <a
                  href={`#${c.slug}`}
                  className="flex items-baseline gap-3 group"
                >
                  <span className="font-ibm-mono text-[10px] text-military-rust">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                    {c.title}
                  </span>
                  {c.era && (
                    <span className="font-ibm-mono text-[10px] text-military-steel/50">
                      {c.era}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Chapters */}
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            id={c.slug}
            data-testid="history-chapter"
            className="folded-paper military-corners p-6 mb-8 scroll-mt-6"
          >
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-ibm-mono text-xs text-military-rust">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2 className="font-oswald text-xl md:text-2xl text-military-sand">{c.title}</h2>
            </div>
            {c.era && (
              <p className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/50 mb-4">
                {c.era}
              </p>
            )}
            {/* Chapter body — build-time sanitized HTML (campaigns pipeline). */}
            <div
              className="prose-invert text-military-sand/80 leading-relaxed space-y-4 text-sm md:text-base [&_h3]:font-oswald [&_h3]:text-military-sand"
              dangerouslySetInnerHTML={{ __html: c.bodyHtml }}
            />
          </section>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Таб** — в `EncyclopediaTabs.tsx`: импорт `ScrollText` из `lucide-react` (в существующий импорт `Shield, Target, Flag` добавить `ScrollText`), в массив `TABS` последним элементом:

```typescript
  {
    id: 'history',
    index: '04',
    href: '/encyclopedia/history',
    label: 'История',
    icon: ScrollText,
    isActive: (p) => p.startsWith('/encyclopedia/history'),
  },
```

- [ ] **Step 3: Sitemap** — в `src/app/sitemap.ts` рядом с `{ path: '/encyclopedia/missions', ... }`:

```typescript
    { path: '/encyclopedia/history', freq: 'monthly', priority: 0.8 },
```

- [ ] **Step 4: E2E (CI-only)** — `e2e/history.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('История вселенной', () => {
  test('страница открывается: оглавление и главы видны', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('history-title')).toBeVisible();
    await expect(page.getByTestId('history-toc')).toBeVisible();
    const first = page.getByTestId('history-chapter').first();
    await expect(first).toBeVisible();
    await expect(first).toContainText('Тунгусский артефакт');
  });

  test('таб «История» ведёт на страницу из энциклопедии', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'История' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/encyclopedia\/history$/);
  });
});
```

- [ ] **Step 5: Верификация + коммит**

```bash
npm run type-check && npm run test
git add src/app/encyclopedia/history/page.tsx src/components/encyclopedia/EncyclopediaTabs.tsx \
  src/app/sitemap.ts e2e/history.spec.ts
git commit -m "feat(encyclopedia): страница «История вселенной» — роут, таб, sitemap, E2E

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Реестр источников, финальная валидация, PR готов

**Files:**
- Modify: `docs/ENCYCLOPEDIA_LORE_SOURCES.md`

**Interfaces:**
- Consumes: всё вышестоящее.

- [ ] **Step 1: Реестр** — в `docs/ENCYCLOPEDIA_LORE_SOURCES.md` после раздела 2 добавить (по формату существующих):

```markdown
### 3. «Имперские войны» — Chertischev
- **Тип**: повесть-хроника. **Канон**: официальный. **Файл**: `~/Documents/BP/Khroniki_Imperskikh_Voyn_v2_1-3.pdf` (62 стр.).
- **Кредит**: `{author:"Chertischev", work:"Имперские войны"}`.
- **Куда перенесено**: кампания `src/content/campaigns/imperatorskie-voyny.md`; description фракций polaris/protectorate.
- **Статус**: ✅ (коммит Task 5). Пересказ, не дословно.

### 4. «Косары» — Chertischev
- **Файл**: `~/Documents/BP/Kosary.pdf` (24 стр.).
- **Куда перенесено**: description фракции mercenaries (Зал Наёмников); лор отрядов (kosari и др. из «Известных отрядов»); глава «Экипировка пехоты Доминиона» → История.
- **Статус**: ✅ (коммит Task 6).

### 5. «Штурмовики Протектората» — V.Chertischev
- **Файл**: `~/Documents/BP/Shturmoviki_Protektorata.pdf` (19 стр.).
- **Куда перенесено**: лор штурмовых отрядов протектората + description фракции (структура ВКС).
- **Статус**: ✅ (коммит Task 7).

### 6. «Летопись: Звёздные герои» — официальное издание
- **Файл**: `~/Documents/BP/LETOPIS_-_ZVEZDNYE_GEROI.pdf` (65 стр., автор в метаданных не указан).
- **Куда перенесено**: 7 глав Истории (`src/content/history/`).
- **Статус**: ✅ (коммит Task 8). Именной кредит не ставился (автор не установлен).

### 7. «Справочник техники» — дополнение
- Таблицы вооружений (`armament`), индексы БМР/УМ (`designation`), прозвища моноблоков. Инструмент: `tools/handbook_armament.py`. **Статус**: ✅ (коммит Task 4).
```

- [ ] **Step 2: Финальная валидация**

```bash
npm run validate
```

Expected: type-check 0 errors, lint без новых error, все unit-тесты зелёные.

- [ ] **Step 3: Пуш и PR ready**

```bash
git add docs/ENCYCLOPEDIA_LORE_SOURCES.md
git commit -m "docs: реестр источников — 4 книги + дополнение справочника

Co-Authored-By: Claude <noreply@anthropic.com>"
git -c credential.helper='!gh auth git-credential' push
gh pr ready feat/encyclopedia-novel-lore 2>&1 | cat
```

Дальше — CI гоняет E2E (armament, история, кампания); после мержа чек-лист GA4/Метрики НЕ требуется (контентные изменения, новых событий аналитики нет).

---

### Task 11 (добавлен по директиве пользователя 2026-08-19): «Везде ссылки на источники + АВБ на не-Технолог источниках»

**Классификация (решение пользователя):** «Технолог» = Справочник техники + «Летопись» (без АВБ). Четыре романа Chertischev («Битва за Велиан», «Имперские войны», «Косары», «Штурмовики Протектората») = не Технолог → их кредит-чипы несут АВБ-марку. Полный АВБ-бейдж на сущности остаётся привязан к origin (чей концепт) — официальные юниты с лором из романов НЕ помечаются целиком.

**Files:**
- Modify: `src/lib/campaigns.ts` (CampaignMeta + provenance/credit из frontmatter), `src/lib/history.ts` (HistoryChapterMeta + credit/loreAuthor)
- Modify: `src/app/campaigns/[slug]/page.tsx` (строка источника), `src/app/encyclopedia/history/page.tsx` (строка источника у главы)
- Modify: `src/components/encyclopedia/AttributionLabel.tsx` (кредит-чип: мини-АВБ-марка когда loreAuthor ≠ tehnolog)
- Modify (данные): `factions.json` (у кредитов «Битвы за Велиан» loreAuthor:"tehnolog" → "star_system"), `units/{polaris,protectorate}/squads.json` (то же), `units/{polaris,protectorate}/machines.json` (кредиты Велиана: + loreAuthor:"star_system"), 2 кампании md (frontmatter + credit), 8 глав истории md (frontmatter: гл.1-7 loreAuthor tehnolog; гл.8 star_system + credit «Косары»)
- Test: юнит-тесты рендера кредит-чипа с/без АВБ, лоадеров кампаний/истории (frontmatter provenance), данных (все не-Технолог кредиты сопровождаются loreAuthor≠tehnolog)

**Правила:**
- loreAuthor у кредитов Велиана в фракциях/отрядах: просто убрать override `"tehnolog"` (дефолт фракций/неофициальных скуwadов уже star_system) или поставить "star_system" явно — по контексту; для официальных отрядов (tehnolog-лист) и машин — явный `"loreAuthor": "star_system"`.
- Кредиты Справочника/Летописи: без АВБ (loreAuthor tehnolog).
- Кампании korporativnye-voyny/skrytyj-vrag: источник НЕ выдумывать — нет данных, нет кредита (проверить docs/ENCYCLOPEDIA_LORE_SOURCES.md; если там указан источник — поставить по нему).
- E2E: страница истории показывает строку источника у главы 8 с АВБ-маркой; страница кампании «Имперские войны» — источник с АВБ (CI-only).
