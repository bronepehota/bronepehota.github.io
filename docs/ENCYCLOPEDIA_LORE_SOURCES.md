# Источники лора энциклопедии

Реестр канонических источников, из которых лор перенесён в энциклопедию.
Пополняется по мере импорта книг и справочников (ветка
`feat/encyclopedia-novel-lore`). Сам `docs/` в продакшен-сборку **не входит** —
это справочник для разработчиков; в приложение попадает только лор под `src/`.

## Связь с кодом: provenance и credit

- **Org-level provenance** (`src/lib/provenance.ts`, `LoreSource`): `tehnolog`
  (официальный канон) | `star_system` | `universestarsys` | `ai` | `avb`. Определяет
  чип источника и бейдж АВБ.
- **Именной автор** (`provenance.credit: LoreCredit = {author?, work?, year?, url?}`,
  ортогонален к org-level): чип «автор лора» в `ProvenanceRow` для конкретного
  произведения (роман/книга). Ставится на сущность через
  `provenance: { credit: {...} }`.
- Где живёт лор: фракции → `src/data/encyclopedia/factions.json`; кампании →
  `src/content/campaigns/*.md`; машины/отряды →
  `src/data/encyclopedia/units/<faction>/{machines,squads}.json` (объект
  `encyclopedia`: `lore/history/tactics/class/type/manufacturer/monoblock/mass/crew/…`,
  последние рендерятся карточкой `<UnitSpecs>`).

## Обработанные источники

### 1. Роман «Битва за Велиан» — Chertischev, 2022
- **Тип**: художественный роман. **Канон**: официальный (вселенная Star System /
  Робогир, «Технолог»). **Файл**: `~/Documents/pict/Bitva_za_Velian.pdf` (131 стр.).
- **Кредит**: `credit → {author:"Chertischev", work:"Битва за Велиан", year:2022}`
  (`loreAuthor:"star_system"` — роман не «Технолог»: кредит-чип несёт мини-АВБ-марку;
  классификация источников — решение пользователя 2026-08-19, см.
  `src/__tests__/lib/lore-credits-avb.test.ts`).
- **Куда перенесено**:
  - Фракции: обогащены `description` у `protectorate` и `polaris`.
  - Кампания: `src/content/campaigns/shturm-velyana.md` («Штурм Велиана»).
  - Машины: `history` у `predator`, `salamander`, `raptor` (+ `credit`).
- **Статус**: ✅ готово (коммит `5e7feaf`). Сюжет — своя адаптация, не дословно
  (текст романа защищён авторским правом).

### 2. Справочник техники «Робогир» — официальный, ~2020-е
- **Тип**: справочник ТТХ бронетехники. **Канон**: официальный «Технолог».
  **Файл**: `~/Documents/pict/Spravochnik_tekhniki_robogir.pdf` (64 стр.).
- **Кредит**: без `credit` (org-level `tehnolog/tehnolog` уже покрывает; автор не
  указан). Извлечённый текст: `pdftotext -raw` + декод CP1251→UTF-8.
- **Куда переносится**:
  - ТТХ: `manufacturer/monoblock/mass/crew/type` (рендерятся `<UnitSpecs>`).
  - Названия вооружений + лор разработки → `lore`/`history`.
- **Инструмент**: `tools/handbook_extract.py` (pdfplumber + декод CP1251; `--json`).
- **Статус**: ✅ обе фракции, все машины из справочника (Протекторат: griffin,
  predator, carnivore, hurricane, trex, tornado, octopus; Полярис: wildbear,
  spider, locust, raptor, devastator, superlocust, eraser, helix, thunder).
  salamander/varan — без заметного нового оружия, оставлены как есть.
  hornet/hunter/madbull/ravingbeast/demolisher/t_600 в этом справочнике отсутствуют.

## Очередь (необработанное)
- _Прочие книги/альманахи вселенной — добавлять сюда по мере поступления._

## Как добавить следующий источник (шпаргалка)
1. `pdftotext -layout <pdf> /tmp/x.txt` (кривая кириллица из InDesign → декод
   `latin-1→cp1251`; `pdftotext -raw` даёт чиший порядок колонок).
2. Вычленить фракции/машины/персонажей; сверить ID с энциклопедией (`getEncyclopediaUnit`).
3. Разложить: фракции → `factions.json`; роман-сюжет → `campaigns/*.md`; ТТХ+лор →
   `units/<faction>/{machines,squads}.json`. Именного автора — в `provenance.credit`.
4. Коммит в `feat/encyclopedia-novel-lore`; отметить статус здесь.
