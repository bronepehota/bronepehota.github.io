# Encyclopedia Squad Lore Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fabricated, universe-inconsistent squad lore in `src/data/encyclopedia/units/*/squads.json` with canon-grounded lore (31 squads), add a `shortDescription` summary line to every squad, and surgically clean 5 generation artifacts in `polaris/machines.json`.

**Architecture:** Pure data/content change to 4 JSON files. No code change is required for the summary line — `UnitDetailSheet.loreLine()` already prefers `encyclopedia.shortDescription`. A Jest regression test is added at the end to lock the new shape and prevent garbage regressions in CI. Each squad is rewritten per a canon-first methodology: extract the faction lore book → search for real canon about the unit → use it, or generate a canon-consistent description from the unit's role/stats where the book is silent.

**Tech Stack:** JSON data files, Python (one-shot extraction/scans), Jest/TypeScript (regression test), Playwright (E2E), ESLint.

**Spec:** `docs/superpowers/specs/2026-06-16-encyclopedia-squad-lore-design.md`

## Global Constraints

- **All UI text is Russian.** Match the dry, role-focused tone of existing machine lore.
- **Canonical timeline (use these real dates, never invent eras like "Эпоха Consolidation"):**
  - Polaris: 4300 (Силы быстрого реагирования / Имперский Космический десант created; clone research begins); 4353 (first viable clone soldier); 4390 (border worlds «умиротворены»); 4424 (найтсталкеры appear); 4451 (Империя Полярис attacks Протекторат — Вторжение Первой Волны).
  - Protectorate: ~40 век (Торговая Лига → Торговый Протекторат); 4478 (падение Гелионии); 4520 (восстание на Гелионии); 4522 (Фелицианский конфликт); 4531 (Первый рутенийский конфликт); 4537 (Второй рутенийский конфликт).
- **Squad `encyclopedia` object target shape — exactly these keys:** `class`, `lore`, `history`, `tactics`, `shortDescription`. **Remove:** `traditions`, `keyBattles`, `locations`, `manufacturer`.
- **No generation garbage:** no CJK characters; no English/Latin words (≥4 letters) inside `lore`/`history`/`tactics`/`shortDescription`/`class` (game notation like `D12`, `2D12`, `D6-1` is fine — single letters). `sourceUrl` values are exempt.
- **Do not touch** machine canon lore — only the 5 listed artifact fixes. Do not touch top-level fields (`id`, `name`, `shortName`, `faction`, `type`, `sources`, `image`).
- **Every commit must keep CI green** (`npm test` passes) — therefore the regression test is added LAST, after all content is correct.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/data/encyclopedia/units/polaris/squads.json` | 9 Polaris squad lore entries | Rewrite `encyclopedia` objects |
| `src/data/encyclopedia/units/protectorate/squads.json` | 14 Protectorate squad lore entries | Rewrite `encyclopedia` objects |
| `src/data/encyclopedia/units/mercenaries/squads.json` | 8 Mercenary squad lore entries | Rewrite `encyclopedia` objects |
| `src/data/encyclopedia/units/polaris/machines.json` | Polaris machine lore | 5 surgical artifact fixes only |
| `src/__tests__/lib/encyclopedia-squad-lore.test.ts` | Regression guard (NEW) | Assert squad shape + no garbage |

No other files change. `src/lib/types.ts` and `src/lib/encyclopedia-registry.ts` already permit `shortDescription` — no type changes.

---

## Canon Reference (shared by Tasks 2–4)

### Canon sources (consult per task; fetch fresh — these are the ground truth)

- **VK blog «ЭПОХА РОБОГИР» — `https://vk.com/@age_of_robogear`** (художественные статьи + лор; index page confirmed readable). Most directly relevant, per faction — open the index and read:
  - «Прославленные части ВКС Империи Полярис» → **Task 1 (Polaris)** — distinguished Imperial units.
  - «Прославленные части ВКС Договора Торгового Протектората» (Космический Флот, Роботехнические войска, Силы Специальных операций) → **Task 2 (Protectorate)**.
  - «Наёмники и ВС независимых планет» → **Task 3 (Mercenaries)**.
  - Flavor/idiom from narrative fiction: «Заговор»/«Белые молнии» (Велиан), «Периферия и Пыльная Зона» (Содружество Дальних планет), «Смерть Императора» (Император Никон, на престоле с 4430), «Эра Сверхчеловечества» (127 г. Э.С. — Центры Киборгизации), «Население Велиана», «Новофранкская Конфедерация» (Ле-Карн, Тибурон, Келтайна, Наргон-3), «4541 г. — захват Димексы».
  - **The blog is large and includes squad-specific articles** — the index paginates (`https://vk.com/@age_of_robogear`, then `?offset=10`, `?offset=20`, …). **For every squad, page through the whole index and search for the squad's name/topic** (трибунаторы, киберпехота, найтсталкеры, specific planets/regiments) — read any dedicated article before writing. Treat the VK blog as the primary per-unit source; the books are the timeline backbone.
  - **Dedicated squad articles have a stable URL pattern: `https://vk.com/@age_of_robogear-<translit-slug>`** (Russian → Latin; «ай»→`ai`). Confirmed readable examples to model on:
    - `https://vk.com/@age_of_robogear-naitstalkery` — найтсталкеры (4424 атака на Царьград, Пояс Мрака, операция «Двойные Сумерки» 4426, Дворец Ночи) → **Task 3**.
    - `https://vk.com/@age_of_robogear-peredel-vlasti-na-tortuge` — пираты, «Передел власти на Тортуге» → **Task 3** (`piraty_tortugi`).
    - Try each squad's transliterated name directly; if it 404s, find the article via the paginated index.
- **robogear.ru force-structure pages** — unit-by-unit roster: `http://www.robogear.ru/skelet/2/protectorat/voiska_prot.php` (Протекторат: капитаны, лейтенанты, командные робогиры, пехота, саламандры, киборги) and the Empire equivalent under `http://www.robogear.ru/skelet/2/empire/`. Universe overview: `http://www.robogear.ru/skelet/2/index_2.php`.
- **Lore books** (`~/Downloads/EmpPolaris.docx`, `Protektorat.pdf`) — faction timeline/origin (extraction below).
- **Forum Технолога** (`newforum.tehnolog.ru/…showforum=66`) — secondary, for obscure details.

### Lore books extraction (re-extract fresh each task; `/tmp` is ephemeral)

```bash
# Polaris book
python3 - <<'PY'
import zipfile,re
xml=zipfile.ZipFile('/home/atuzov/Downloads/EmpPolaris.docx').read('word/document.xml').decode('utf-8','ignore')
lines=[]
for para in re.split(r'</w:p>', xml):
    t=''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>',para,re.S)); t=re.sub(r'<[^>]+>','',t)
    if t.strip(): lines.append(t.strip())
open('/tmp/emp_polaris.txt','w').write('\n'.join(lines))
PY
# Protectorate book
pdftotext -layout /home/atuzov/Downloads/Protektorat.pdf /tmp/protektorat.txt
```

**Polaris canon anchors** (verified in `/tmp/emp_polaris.txt`):
- **Линейная клон-пехота** — клоны безынициативны/ограничены в мышлении → ими комплектуют линейные части; десант оставлен для спецопераций. (К 4353 создан готовый клон; биофабрики выпускают клоны без гена Полосатого волка.)
- **Режимная клон-пехота** — «Для поддержания порядка на планетах Империи в распоряжение Губернаторов были направлены клоны, которые составили режимную пехоту по типу жандармских частей.» (verbatim canon).
- **Лёгкий / Тяжёлый штурмовой десант** — Имперский Космический десант = Силы быстрого реагирования (4300); высадка десантными капсулами с крейсеров проекта «Викинг»; десантники прозваны «демонами»/«огненными духами мщения».
- **Трибунаторы (новые/старые)** — спецгруппы, созданные по образцу группы «Альфа»; эмблема — крылатая буква «А»; элитные подразделения для особых поручений.
- **Тяжёлая клон-пехота** — клон-пехота с тяжёлым/противоброневым вооружением; клон-пехота несла катастрофические потери в операции «Двойные Сумерки» на Ночном Кошмаре.
- **Спецназ планеты Шиду** — книга упоминает планету Шиду; элитный спецназ. Where silent → generate by role (элита, тяжёлая подготовка) + имперский канон.
- **Лёгкая штурмовая клон-пехота** — combined-arms clone assault infantry. Where silent → generate by role + clone/штурм canon.
- Planets/names available for flavor: Полярис-Прайм, Царьград, Ночной Кошмар, Клаус-7, Стилграу (Академия), Алексей Долгорукий (8-й десантный полк).

**Protectorate canon anchors** (verified in `/tmp/protektorat.txt`):
- **Киберпехота / Лёгкая киберпехота / Киберспецназ** — «Роботехнические войска Протектората комплектуются киберпехотинцами»; киборги, не ведающие страха; ядро — Первый роботехнический корпус.
- **Фелицианская гвардия / Спецназ планеты Фелиция** — планета Фелиция; Фелицианский конфликт (4522).
- **Рутенийская гвардия / Войска планеты Рутения** — планета Рутения; Первый (4531) и Второй (4537) рутенийские конфликты.
- **Ополчение планеты Гелион / Ополчение планеты Велиан** — планетарное ополчение; Гелиония (падение 4478, восстание 4520); Велиан (столица Протектората).
- **Регуляры планеты Велиан** — регулярные войска Протектората, Велиан.
- **Штурмовой отряд «Стервятники» / Штурмовой спецназ (новые/старые)** — штурмовые войска Протектората; «Тигры Гелионии» сформированы при ЦСО Гелионии.
- **Тяжёлая штурмовая пехота Велиана** — тяжёлая пехота обороны Велиана; роботанковые/шагающие танки в поддержку.
- Planets/names: Велиан, Гелиония, Рутения, Фелиция; Торговая Лига → Протекторат.

**Mercenaries canon anchors** (no dedicated book; ground in robogear universe + Polaris book + faction description):
- **Найтсталкеры** — мутанты-хищники с Ночного Кошмара / Пояса Мрака; видят в темноте, регенерация; появились 4424 (verbatim canon from Polaris book).
- **Косари** — армия «косарей» упоминается как ополчение/наёмники на планете Рун (Polaris book).
- **Мутанты** — мутанты Ночного Кошмара (радиация/клон-мутанты).
- **Аборигены крепости Молодых Ростков / Пираты Маркуса (новые/старые) / Пираты Тортуги / Рейдеры Пыльной Зоны** — no direct canon → generate by name + role + faction canon (Внешнее Кольцо, пираты, мародёры, трофейная техника). Keep names as-is.

---

## Task 1: Rewrite Polaris squad lore (9 squads)

**Files:**
- Modify: `src/data/encyclopedia/units/polaris/squads.json`

**Interfaces:**
- Consumes: Canon Reference (Polaris) above; `/tmp/emp_polaris.txt` (re-extract).
- Produces: 9 squad `encyclopedia` objects in the target shape (5 keys).

- [ ] **Step 1: Gather canon (book + VK blog + robogear.ru)**

- Re-extract the Polaris book (extraction command in Canon Reference); verify `wc -l /tmp/emp_polaris.txt` ≈ 1100+ lines.
- Open `https://vk.com/@age_of_robogear` and read «Прославленные части ВКС Империи Полярис»; then **page through the whole blog index** (`?offset=10`, `?offset=20`, …) and search for each of the 9 squad names/topics (особенно «трибунаторы», «спецназ Шиду», «режимная пехота»). Read any dedicated article found.
- Skim the robogear.ru Empire force-structure page under `http://www.robogear.ru/skelet/2/empire/` for unit roster/roles.

- [ ] **Step 2: Rewrite each squad's `encyclopedia` object**

For each of the 9 squads, replace the entire `encyclopedia` object so it has exactly: `class` (keep existing value), `lore` (1–3 sentences, canon-grounded), `history` (1–3 sentences, origin using real dates), `tactics` (refine existing gameplay advice to match real stats; remove any garbage), `shortDescription` (1 line ≤ ~100 chars). Delete `traditions`, `keyBattles`, `locations`, `manufacturer`. Do **not** change any top-level field.

Worked example — `polaris_lineynaya_klon_pehota`:
```json
"encyclopedia": {
  "class": "Линейная пехота",
  "lore": "Основная клон-пехота Империи Полярис. Клоны выращиваются на биофабриках без гена Полосатого волка и формируют костяк имперских линейных частей.",
  "history": "Появилась после 4353 года, когда Институт генной инженерии получил жизнеспособного клона. Безынициативность клонов решила вопрос их применения: ими стали комплектовать именно линейные части, оставив десант для специальных операций.",
  "tactics": "Дешёвый отряд для заполнения рядов: захват точек, удержание позиций, стрелковая линия. 5 бойцов с D12 бьют на средней дистанции; в ближнем бою слабы.",
  "shortDescription": "Основная клон-пехота Империи: дешёвая масса для стрелковой линии и удержания позиций."
}
```

Worked example — `polaris_rezhimnaya_klon_pehota` (verbatim canon origin):
```json
"encyclopedia": {
  "class": "Тяжёлая пехота",
  "lore": "Клон-пехота жандармского типа, состоящая в распоряжении губернаторов для поддержания порядка на планетах Империи. Оснащена усиленной бронёй и обучена ближнему бою.",
  "history": "Сформирована из клонов по типу жандармских частей после умиротворения окраинных миров к 4390 году — для подавления беспорядков и несения оккупационной службы.",
  "tactics": "Штурмовой отряд ближнего боя: 6 бойцов с ББ 6 пробивают Броню 3, Броня 4 держит подход. Идут прямо на врага и бьют в рукопашной; идеальны против слабобронированных целей.",
  "shortDescription": "Клоны-жандармы Империи: поддерживают порядок на планетах и в оккупированных мирах."
}
```

Apply the same shape to the remaining 7 (`lyogkaya_shturmovaya_klon_pehota`, `lyogkiy_shturmovoy_desant`, `spetsnaz_planety_shidu`, `tribunatory_novye`, `tribunatory_starye`, `tyazhyolaya_klon_pehota`, `tyazhyolyy_shturmovoy_desant`), grounding each in its Polaris canon anchor from the Canon Reference. Read `/tmp/emp_polaris.txt` (grep the unit/planet name) for richer detail before writing.

- [ ] **Step 3: Validate JSON parses**

Run: `python3 -c "import json; json.load(open('src/data/encyclopedia/units/polaris/squads.json')); print('OK', len(json.load(open('src/data/encyclopedia/units/polaris/squads.json'))), 'squads')"`
Expected: `OK 9 squads`

- [ ] **Step 4: Verify shape + no garbage (focused scan)**

Run:
```bash
python3 - <<'PY'
import json,re
f='src/data/encyclopedia/units/polaris/squads.json'
d=json.load(open(f)); cjk=re.compile(r'[一-鿿]'); lat=re.compile(r'\b[A-Za-z]{4,}\b')
bad=False
for e in d:
    enc=e['encyclopedia']; keys=set(enc)
    forb={'traditions','keyBattles','locations','manufacturer'}&keys
    if forb: print('FORBIDDEN',e['id'],forb); bad=True
    if not enc.get('shortDescription','').strip(): print('NO shortDescription',e['id']); bad=True
    for k in ('class','lore','history','tactics','shortDescription'):
        v=enc.get(k,'')
        if cjk.search(v): print('CJK',e['id'],k); bad=True
        if lat.search(v): print('LATIN',e['id'],k, lat.findall(v)); bad=True
print('CLEAN' if not bad else 'FAIL')
PY
```
Expected: `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add src/data/encyclopedia/units/polaris/squads.json
git commit -m "feat(encyclopedia): canon-grounded lore + shortDescription for Polaris squads"
```

---

## Task 2: Rewrite Protectorate squad lore (14 squads)

**Files:**
- Modify: `src/data/encyclopedia/units/protectorate/squads.json`

**Interfaces:**
- Consumes: Canon Reference (Protectorate) above; `/tmp/protektorat.txt` (re-extract).
- Produces: 14 squad `encyclopedia` objects in the target shape (5 keys).

- [ ] **Step 1: Gather canon (book + VK blog + robogear.ru)**

- Re-extract the Protectorate book: `pdftotext -layout /home/atuzov/Downloads/Protektorat.pdf /tmp/protektorat.txt`; verify `wc -l /tmp/protektorat.txt` ≈ 2000+ lines.
- Open `https://vk.com/@age_of_robogear` and read «Прославленные части ВКС Договора Торгового Протектората»; then **page through the whole blog index** (`?offset=10`, `?offset=20`, …) and search for each of the 14 squad names/topics (особенно «киберпехота», «Фелицианская гвардия», «Рутения», «ополчение Велиана», «Стервятники», «Тигры Гелионии»). Read any dedicated article found.
- Skim `http://www.robogear.ru/skelet/2/protectorat/voiska_prot.php` for the Protectorate unit roster.

- [ ] **Step 2: Rewrite each squad's `encyclopedia` object**

Same target shape and rules as Task 1. Worked example — `protectorate_kiberpehota`:
```json
"encyclopedia": {
  "class": "Киберпехота",
  "lore": "Шоковые войска Роботехнических войск Протектората. Киберпехотинцы — киборги, не ведающие страха; ядро сил составляет Первый роботехнический корпус.",
  "history": "Сформированы Протекторатом для противодействия имперским клонам и бронетехнике; впервые массово применены при обороне планеты Рун, где остановили продвижение Империи.",
  "tactics": "Универсальный отряд: комбинированное вооружение бьёт по пехоте и лёгкой технике. Броня и стойкость позволяют держать позицию; используйте для удержания ключевых точек.",
  "shortDescription": "Киборги Роботехнических войск Протектората — ударная пехота против клонов и бронетехники."
}
```

Apply the same shape to the remaining 13 (`lyogkaya_kiberpehota`, `kiberspetsnaz`, `felitsianskaya_gvardiya`, `spetsnaz_planety_felitsiya`, `ruteniyskaya_gvardiya`, `voyska_planety_ruteniya`, `opolchenie_planety_gelion`, `opolchenie_planety_velian`, `regulyary_planety_velian`, `shturmovoy_otryad_stervyatniki`, `shturmovoy_spetsnaz_novye`, `shturmovoy_spetsnaz_starye`, `tyazhyolaya_shturmovaya_pehota_veliana`), grounding each in its Protectorate canon anchor. Grep `/tmp/protektorat.txt` for the planet/unit name before writing.

- [ ] **Step 3: Validate JSON parses**

Run: `python3 -c "import json; print('OK', len(json.load(open('src/data/encyclopedia/units/protectorate/squads.json'))), 'squads')"`
Expected: `OK 14 squads`

- [ ] **Step 4: Verify shape + no garbage (focused scan)**

Run the same scan script as Task 1 Step 4 but with `f='src/data/encyclopedia/units/protectorate/squads.json'`.
Expected: `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add src/data/encyclopedia/units/protectorate/squads.json
git commit -m "feat(encyclopedia): canon-grounded lore + shortDescription for Protectorate squads"
```

---

## Task 3: Rewrite Mercenaries squad lore (8 squads)

**Files:**
- Modify: `src/data/encyclopedia/units/mercenaries/squads.json`

**Interfaces:**
- Consumes: Canon Reference (Mercenaries) above; `/tmp/emp_polaris.txt` (re-extract) for найтсталкеры/косари/мутанты.
- Produces: 8 squad `encyclopedia` objects in the target shape (5 keys).

- [ ] **Step 1: Gather canon (Polaris book + VK blog)**

- Re-extract the Polaris book (extraction command in Canon Reference); grep `/tmp/emp_polaris.txt` for `найтсталкер`, `косар`, `мутант`, `Ночной Кошмар`, `Пояс Мрака`.
- Open `https://vk.com/@age_of_robogear` and read «Наёмники и ВС независимых планет» + «Периферия и Пыльная Зона»; then **page through the whole blog index** (`?offset=10`, `?offset=20`, …) and search for each of the 8 squad names/topics (особенно «найтсталкеры», «Пыльная зона», «Тортуга»). Read any dedicated article found.

- [ ] **Step 2: Rewrite each squad's `encyclopedia` object**

Same target shape and rules as Task 1. Worked example — `mercenaries_naytstalkery`:
```json
"encyclopedia": {
  "class": "Мутанты-хищники",
  "lore": "Боевые мутанты с планеты Ночной Кошмар из Пояса Мрака. Видят в темноте, обладают ускоренной регенерацией и сражаются с первобытной яростью.",
  "history": "Потомки мутантов-клонов, вырвавшихся с имперских биофабрик; с 4424 года их набеги терроризируют окраинные мира. Нападают по ночам — отсюда прозвище «найтсталкеры».",
  "tactics": "Авангард ближнего боя: высокая скорость и натиск. Бросайте в первых рядах, чтобы связать врага в рукопашной до подхода основных сил.",
  "shortDescription": "Мутанты-хищники с Ночного Кошмара: ночные рейды, регенерация, ближний бой."
}
```

Apply the same shape to the remaining 7 (`aborigeny_kreposti_molodyh_rostkov`, `kosari`, `mutanty`, `piraty_markusa_novye`, `piraty_markusa_starye`, `piraty_tortugi`, `reydery_pylnoy_zony`). For units with no direct canon, generate canon-consistent descriptions from name + role + faction canon (Внешнее Кольцо, пираты, мародёры, трофейная техника). Keep all top-level fields unchanged.

- [ ] **Step 3: Validate JSON parses**

Run: `python3 -c "import json; print('OK', len(json.load(open('src/data/encyclopedia/units/mercenaries/squads.json'))), 'squads')"`
Expected: `OK 8 squads`

- [ ] **Step 4: Verify shape + no garbage (focused scan)**

Run the same scan script as Task 1 Step 4 but with `f='src/data/encyclopedia/units/mercenaries/squads.json'`.
Expected: `CLEAN`

- [ ] **Step 5: Commit**

```bash
git add src/data/encyclopedia/units/mercenaries/squads.json
git commit -m "feat(encyclopedia): canon-grounded lore + shortDescription for Mercenaries squads"
```

---

## Task 4: Clean 5 machine-lore artifacts (polaris)

**Files:**
- Modify: `src/data/encyclopedia/units/polaris/machines.json`

**Interfaces:**
- Consumes: the 5 specific artifact→fix mappings below.
- Produces: garbage-free machine lore (canon text otherwise unchanged).

- [ ] **Step 1: Apply the 5 fixes**

Make exactly these string replacements inside `encyclopedia` text fields (do not change anything else):

| Squad.id.field | Find | Replace with |
|---|---|---|
| `helix.lore` | `Обладает decent вооружением` | `Обладает неплохим вооружением` |
| `helix.lore` | `что делает её ценным支援ным юнитом` | `что делает её ценным вспомогательным юнитом` |
| `helix.history` | `огневая支援 машина` | `огневая машина поддержки` |
| `helix.tactics` | `ремонта 2 повреждения allies в ближнем бою` | `ремонта 2 повреждения союзников в ближнем бою` |
| `locust.tactics` | `нет оружия ближнего半径` | `нет оружия ближнего боя` |
| `superlocust.lore` | `создают devastating огонь` | `создают сокрушительный огонь` |

- [ ] **Step 2: Verify no CJK / latin-bleed remains in machine text fields**

Run:
```bash
python3 - <<'PY'
import json,re,glob
cjk=re.compile(r'[一-鿿]'); lat=re.compile(r'\b[A-Za-z]{4,}\b'); bad=False
for f in glob.glob('src/data/encyclopedia/units/*/machines.json'):
    for e in json.load(open(f)):
        enc=e.get('encyclopedia',{})
        for k,v in enc.items():
            if k=='sourceUrl' or not isinstance(v,str): continue
            if cjk.search(v): print('CJK',f,e['id'],k); bad=True
            if lat.search(v): print('LATIN',f,e['id'],k,lat.findall(v)); bad=True
print('CLEAN' if not bad else 'FAIL')
PY
```
Expected: `CLEAN`

- [ ] **Step 3: Validate JSON parses**

Run: `python3 -c "import json; print('OK', len(json.load(open('src/data/encyclopedia/units/polaris/machines.json'))), 'machines')"`
Expected: `OK 15 machines`

- [ ] **Step 4: Commit**

```bash
git add src/data/encyclopedia/units/polaris/machines.json
git commit -m "fix(encyclopedia): remove generation artifacts from Polaris machine lore"
```

---

## Task 5: Regression test + full verification

**Files:**
- Create: `src/__tests__/lib/encyclopedia-squad-lore.test.ts`

**Interfaces:**
- Consumes: the 4 rewritten JSON files.
- Produces: a CI-enforced guard that every encyclopedia squad has the target shape + `shortDescription`, and no encyclopedia text field contains CJK or latin-bleed.

- [ ] **Step 1: Write the regression test**

Create `src/__tests__/lib/encyclopedia-squad-lore.test.ts`:
```ts
import { getAllUnits } from '@/lib/encyclopedia-registry';

const allUnits = getAllUnits();
const squads = allUnits.filter((u) => u.type === 'squad');

const CJK = /[一-鿿]/;
const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
const FORBIDDEN_SQUAD_KEYS = ['traditions', 'keyBattles', 'locations', 'manufacturer'];

describe('encyclopedia squad lore', () => {
  it('every squad has exactly the target encyclopedia shape', () => {
    expect(squads.length).toBe(31);
    for (const u of squads) {
      const keys = Object.keys(u.encyclopedia ?? {}).sort();
      expect(keys).toEqual(['class', 'history', 'lore', 'shortDescription', 'tactics'].sort());
      for (const k of FORBIDDEN_SQUAD_KEYS) {
        expect(keys).not.toContain(k);
      }
      expect((u.encyclopedia?.shortDescription ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('no encyclopedia text field contains CJK or latin-bleed', () => {
    for (const u of allUnits) {
      const enc = u.encyclopedia ?? {};
      for (const [k, v] of Object.entries(enc)) {
        if (k === 'sourceUrl' || typeof v !== 'string') continue;
        expect({ id: u.id, k, cjk: CJK.test(v) }).toEqual({ id: u.id, k, cjk: false });
        expect({ id: u.id, k, latin: LATIN_WORD.test(v) }).toEqual({ id: u.id, k, latin: false });
      }
    }
  });
});
```

- [ ] **Step 2: Run the new test**

Run: `npx jest src/__tests__/lib/encyclopedia-squad-lore.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 3: Full project checks**

Run each and confirm PASS:
```bash
npm run type-check
npm run lint
npm run test
npm run test:e2e
```
Expected: all green. (E2E `encyclopedia.spec.ts` has no lore-text assertions, so the removed sections won't break it.)

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/lib/encyclopedia-squad-lore.test.ts
git commit -m "test(encyclopedia): lock squad lore shape and guard against generation garbage"
```

---

## Done criteria

- All 31 squads have canon-grounded `lore`/`history`, cleaned `tactics`, a non-empty `shortDescription`, and no `traditions`/`keyBattles`/`locations`/`manufacturer`.
- The 5 machine artifacts are gone; no CJK or latin-bleed anywhere in encyclopedia text fields.
- `type-check`, `lint`, unit tests (incl. the new regression test), and E2E all pass.
- The army-builder `UnitDetailSheet` now shows each squad's `shortDescription` as the summary line (no code change needed).
