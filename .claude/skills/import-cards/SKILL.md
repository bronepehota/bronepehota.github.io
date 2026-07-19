---
name: import-cards
description: Use when adding squads or machines (техника) to the Bronepehota wargame app from unit card images, VK albums, Yandex Disk folders, or batch card/painted-photo dumps; single card or 10+ card batches; adding a new faction or source.
---

# Import Cards

Pipeline: **get card images → vision-extract stats → match photos to soldiers (matcher) → build squads.json → standardize images → wire registry → encyclopedia lore → verify.**

Game stats live in `src/data/sources/{source}/{faction}/`; lore lives in `src/data/encyclopedia/units/{faction}/`. `encyclopedia-utils.ts` merges them for display. UI text is Russian; code is English.

## Workflow paths

- **Single card image** → Step 2 → Step 4 → Step 8.
- **VK album** → Step 1 (cookies) → 2 → 3 → 4 → 8.
- **Yandex Disk folder** → Step 1 (API) → 2 → 3 → 4 → 8.
- **Local batch (10+)** → Step 2a → 3 → 4 → 8.

> Machines (техника) follow the same path; card/schema/matcher deltas in [Machines](#machines-техника).
> Every unit also needs an **encyclopedia lore entry** (Step 7). An entry without a matching source squad **breaks the production build**.

## Card anatomy (squad)

Header: colored **faction strip** (red=Полярис, cyan=Протекторат, yellow/green=Наёмники — or a new strip for a new faction) + unit name + `Стоим. NN` (cost, top-right).

Stats columns (one row per soldier; `num` comes from the **miniature number**, not row position):

| А | Ск | Дальн. | Мощн. | ББ | Св | Бр |
|---|---|--------|-------|----|----|----|
| rank | speed | range (dice/empty) | power (dice/empty) | melee | modifier | armor |

- Dice on cards uses Cyrillic `Д` → `D` (`Д6`→`D6`, `2Д12`→`2D12`). **Negative bonuses are valid** (`D6-1`, `2D6-1`) — record verbatim; `parseRoll` supports them.
- Empty range/power = no ranged attack → `""`.
- `Св` values: `Пр3/Пр4/Пр5`→jump_boost, `Рм`→mechanic (see [Modifiers](#modifier-mappings)).

---

## Step 1: Get card images

### VK album — needs authenticated cookies (anonymous is blocked)

VK returns a JS shell with no photo IDs to anonymous curl. Extract cookies from a logged-in Firefox and pass them. One-time setup:

```bash
# copy Firefox cookies.sqlite (FF locks it while running) and pull the VK cookie header
python3 - <<'PY'
import sqlite3, shutil, os, glob
cands = (glob.glob(os.path.expanduser('~/.mozilla/firefox/*.default*/cookies.sqlite'))
          + glob.glob(os.path.expanduser('~/snap/firefox/common/.mozilla/firefox/*/cookies.sqlite')))   # snap install
prof = cands[0]
tmp = '/tmp/cookies.sqlite'; shutil.copy(prof, tmp)
db = sqlite3.connect(tmp)
rows = db.execute("SELECT name,value FROM moz_cookies WHERE host LIKE '%vk.%'").fetchall()
hdr = '; '.join(f"{n}={v}" for n, v in rows)
open('/tmp/vk_cookie.txt', 'w').write(hdr)
print(len(rows), 'cookies')
PY
```

Then download the album with that cookie (full photo-page URL + `Referer: https://vk.com/`; validate every file starts with `FF D8 FF` — VK sometimes serves an HTML login page saved as `.jpg`):

```python
import re, subprocess, os, time
COOKIE = open("/tmp/vk_cookie.txt").read().strip()
UA = "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"
OWNER, ALBUM = "-233498256", "310668795"   # example: Star System squads
def curl(u): return subprocess.run(["curl","-s","-L","--compressed","-H",f"User-Agent: {UA}",
    "-H","Accept-Language: ru-RU,ru;q=0.9","-H",f"Cookie: {COOKIE}",u],capture_output=True).stdout
album = curl(f"https://vk.com/album{OWNER}_{ALBUM}").decode("utf-8","replace")
ids = list(dict.fromkeys(re.findall(rf"photo{OWNER}_(\d+)", album)))
for i, pid in enumerate(ids, 1):
    page = curl(f"https://vk.com/photo{OWNER}_{pid}").decode("utf-8","replace")
    url = next((u for u in re.findall(r"https://[a-z0-9-]+\.userapi\.com/[^\"\s]+?\.jpg", page) if "as=" in u), None)
    if not url: continue
    subprocess.run(["curl","-s","-L","-H",f"User-Agent: {UA}","-H","Referer: https://vk.com/","-o",f"tmp/batch/photo_{i:02d}.jpg",url],capture_output=True)
    time.sleep(0.3)   # rate limit
```

**Wall-post text (lore)** is readable anonymously via the `web-reader` MCP tool (returns `og:description`) — no cookies needed for text, only for album images.

### Yandex Disk — public folder API

```python
import subprocess, json
PK = "https://disk.yandex.com/d/<key>"
def api(path=""):  # list a folder
    r = subprocess.run(["curl","-s","-L","-G","https://cloud-api.yandex.net/v1/disk/public/resources",
        "--data-urlencode",f"public_key={PK}","--data-urlencode",f"path={path}","--data-urlencode","limit=200"],capture_output=True)
    return json.loads(r.stdout)
def dl(path, dest):  # download one file
    href = json.loads(subprocess.run(["curl","-s","-L","-G","https://cloud-api.yandex.net/v1/disk/public/resources/download",
        "--data-urlencode",f"public_key={PK}","--data-urlencode",f"path={path}"],capture_output=True).stdout)["href"]
    subprocess.run(["curl","-s","-L","-o",dest,href],capture_output=True)
```

Folders often contain per-soldier renders (`1.png…6.png`, transparent bg) + `.stl` (ignore) + a large army-list card JPG (the stat card). Some squads put renders in a subfolder like `Рендеры для АрмЛиста`.

### Local files

Copy to `tmp/<batch>/` — renders in `<slug>/N.png`, card as `<slug>/card.jpg`.

---

## Step 2: Vision-extract stats

Prompt (`mcp__zai-mcp-server__analyze_image`, or equivalent — works fine on **light-bg card images**; it's the app's *dark UI screenshots* that vision misreads):

```
Это карточка отряда для настольной игры Бронепехота. Извлеки:
1. Название; 2. Стоимость ("Стоим."); 3. Фракция+цвет полосы;
4. Для КАЖДОГО солдата (по номеру миниатюры 1-6) строго по столбцам:
   А | Ск | Дальн | Мощн | ББ | Св | Бр
Не путай ББ (ближний бой, 3-7) и Бр (броня, 0-6). Неразборчиво → ?.
```

**Vision is noisy** — it swaps ББ/Бр, misreads dice (D6↔D12), drops soldier count. Output is a *starting point*; the matcher (Step 3) is where the user verifies. Compile into a manifest (`extracted_stats.json`):

```json
[{ "name":"Командный взвод Рутении", "shortName":"Командный взвод", "slug":"komandnoe_otdelenie", "faction":"rutenia",
   "source":"star_system", "cost":65, "card":"komandnoe_otделение/card.jpg",
   "imgDir":"komandnoe_otdelenie", "imgPrefix":"",
   "lore":"https://vk.com/wall-…  (URL или текст; поле под карточкой в матчере)",
   "soldiers":[{"num":1,"rank":3,"speed":5,"range":"D12","power":"2D6","melee":4,"modifier":"","armor":2,"imgIndex":3}, ...] }]
```

`imgDir`/`imgPrefix`: renders at `<imgDir>/<imgPrefix><N>.png` (prefix `"sub_"` if they came from a subfolder). `card`: army-list card path, relative to the manifest. `shortName`/`lore` optional (shortName else derived; lore shown under the card). `imgIndex`: which render file that soldier uses (defaults to `num`; reassigned via drag&drop in the matcher).

---

## Step 3: Match photos to soldiers — the matcher

Renders arrive **numbered but out of soldier order** (the file order ≠ the card's soldier rows). Vision **cannot** reliably match similar miniatures — the human compares the card miniature to each render. The matcher makes that comparison fast and captures the result.

```bash
python3 tools/card_matcher_gen.py tmp/<batch>/extracted_stats.json tmp/<batch>/verifier.html
# open tmp/<batch>/verifier.html in a browser
```

**UX** (built for wide monitors — the card pane takes ~half the width and fills it): the army-list card stays in a sticky left pane with a zoom slider + header-offset slider. **Hover a soldier row → the card auto-scrolls to that soldier's miniature** with a cursor line — compare it directly against the render in the row. Stats are one line in **card order** (А·Ск·Дальн·Мощн·ББ·Св·Бр), large. **Drag a soldier's photo onto another soldier to swap their photos** (clean permutation, no conflicts); `↺ сброс фото` restores the natural order. Unrecognized stats (vision `null`) pulse red — fill them from the card. A lore field (URL/text) sits under the card. Conflict detection (same render twice → red), `✓ 1→3·2→1·…` status, verified flag, localStorage, clipboard + file export.

**Export** emits `imgIndex` per soldier (which render file that soldier uses). This is what Step 4 applies.

> The matcher is **manifest-driven** — any faction/source/count. It replaces the old unit-namer + hand-built verifiers.

---

## Step 4: Build squads.json

```bash
python3 tools/build_squads.py tmp/<batch>/verified.json
```

Builds squad objects, **applies `imgIndex`** (`image: /images/squads/{faction}/{slug}/{imgIndex||num}.png` — a path change, no file renaming), validates dice notation + gapless `num` sequence, warns on null stats (guessed from siblings) and missing public images. **Merges into `src/data/sources/{source}/{faction}/squads.json` by id** (update-or-append — won't clobber other squads). Ensures `machines.json` exists.

Squad schema:

```json
{ "id":"rutenia_komandnoe_otdelenie", "name":"…", "shortName":"…", "faction":"rutenia",
  "cost":65,
  "soldiers":[{"num":1,"rank":3,"speed":5,"range":"D12","power":"2D6","melee":4,"armor":2,
               "image":"/images/squads/rutenia/komandnoe_otdelenie/3.png"}],
  "image":"/images/squads/rutenia/komandnoe_otdelenie/1.png" }
```

- `id` = `{faction}_{slug}` (ASCII). `image` at squad level = soldier 1's image.
- Reusing art from another faction/source: set the image path to that location (both sources point at the same files).

---

## Step 5: Standardize images

Two pipelines — pick by the source backdrop:

**White-bg (clean card-art / 3D-render cutouts, transparent or light bg)** → 300×400 PNG, white canvas. Use `tools/standardize_images.py` (RGBA→white, auto-crop to content with ~5% margin, fit 300×400 centered). Save to `public/images/squads/{faction}/{slug}/N.png`.

**Dark-backdrop painted photos** → do NOT cut to white (thresholding destroys dark armor/weapons, leaves halos). Crop tight to the silhouette (luminance delta **≈70** from the backdrop — lower catches the light halo → "scale too small"), keep the dark bg (matches the app theme), fill the frame:

```python
from PIL import Image, ImageChops, ImageFilter
im = Image.open(src).convert("RGB")
bg = im.resize((1,1)).getpixel((0,0))  # or median of corners
diff = ImageChops.difference(im, Image.new("RGB", im.size, bg)).convert("L")
bbox = diff.point(lambda p: 255 if p > 70 else 0).getbbox()   # delta≈70
im = im.crop(bbox); im.thumbnail((450,600), Image.LANCZOS)    # fill frame
```

**⚠ Painted-photo order is unverifiable — ASK the user.** Photo file order (`DSC_0440…`) has no relation to army-list soldier order; it can look right while being wrong. Don't assign by file order or vision. Build a matching tool (old art = correct-order reference) and have the user confirm the permutation before writing files.

---

## Step 6: Wire the registry

**Existing faction**: `tools/build_squads.py` already merged the squads into the faction file. Done — verify the source appears with units.

**New faction** (e.g. `rutenia`): touch **all 12 points**, or the faction won't theme/appear correctly:

1. `src/data/sources/{source}/factions.json` — add `{"id":"<fac>"}`.
2. `src/data/sources/{source}/<fac>/squads.json` + `machines.json` (build_squads.py creates).
3. `src/data/encyclopedia/factions.json` — add faction lore entry (`id,name,color,symbol,description,homeWorld,motto,sources:["star_system"]`).
4. `src/data/encyclopedia/units/<fac>/squads.json` + `machines.json` (Step 7 lore).
5. `src/lib/constants.ts` — `FACTIONS` array, add the id.
6. `src/lib/faction-colors.ts` — add a row to the `FACTION_STYLES` table (text/border/bg/glow/primary/borderSolid/bgSolid/progress/accent/ring) + `factionDisplayNames`.
7. `src/lib/encyclopedia-utils.ts` — `getAllFactions()` factionIds list.
8. `src/lib/sources-registry.ts` — import + merge the faction's squads/machines into the typed arrays.
9. `src/lib/encyclopedia-registry.ts` — import + merge the faction's encyclopedia units.
10. `src/components/encyclopedia/FactionsListPage.tsx` — `order` list + `symbolIcon` map (add the Lucide icon you used for `symbol`).
11. `src/components/landing/FactionsSection.tsx` — `factionIds` + `iconMap`; bump the grid cols for the new count.
12. **Tests** that hardcode the 3 factions: `constants.test.ts` (FACTIONS), `encyclopedia-registry.test.ts` (getFactions), `type-validation.test.ts`, `encyclopedia-squad-lore.test.ts` (squad count). Local-array tests (army-state, capture-*) use sample arrays and stay green.

`FactionID` is a dynamic `string` (no union to edit). `getFactionColors` is a lookup table — unknown factions fall back to polaris, so a missing entry won't crash, just won't theme.

---

## Step 7: Encyclopedia lore (canon-grounded)

Every unit also has a lore entry at `src/data/encyclopedia/units/{faction}/squads.json` (separate from game stats). Shape — **exactly these 5 keys**, no more:

```json
{ "id":"rutenia_komandnoe_otdelenie", "name":"…", "shortName":"…", "faction":"rutenia",
  "type":"squad", "sources":[{"id":"star_system","cost":65}],
  "encyclopedia": { "class":"…", "lore":"…", "history":"…", "tactics":"…", "shortDescription":"…" },
  "image":"/images/squads/rutenia/<slug>/1.png" }
```

- Do **not** add `traditions`/`keyBattles`/`locations`/`manufacturer` to squads — `encyclopedia-squad-lore.test.ts` rejects them and CJK/English-latin-bleed.
- **`tactics` is source-agnostic**: no dice, no squad size, no stat numbers (those differ per source and live in the switchable stats table). Qualitative only.
- **Cross-source unit**: list each source in `sources[]` with its cost; the **same `id` must exist in each source's** squads.json.

### Canon sources (search first; only invent where silent)

- **VK blog «ЭПОХА РОБОГИР»** — `vk.com/@age_of_robogear` (per-unit lore; article URLs are `…/@age_of_robogear-<translit>`).
- **robogear.ru** — `/skelet/2/` universe + per-faction force-structure.
- **Faction books** in `~/Downloads/` — `EmpPolaris.docx`, `Protektorat.pdf`. Community posts on the Star System VK group (`vk.com/bp_bnp`) carry bonus-squad lore + faction-status canon (e.g. Рутения = Buffer Zone «Ржавый Осколок»).
- Use real dates from canon; never invent eras. (Polaris: 4300–4451; Protectorate: 4478 fall of Гелиония → 4531/4537 Рутенийские конфликты.)

### ⚠ Build-breaking gotcha

`getEnrichedUnit(id)` looks up the squad **in the source by `id`**. A lore entry with no matching source squad → `soldiers` undefined → detail page crashes the **production static build** at prerender (`Cannot read properties of undefined (reading 'map')` on `/encyclopedia/unit/<id>`). Unit tests won't catch it. **Commit the source squad (+ images) with the lore entry**, and verify with `NEXT_PUBLIC_GITHUB_PAGES=true npm run build`.

---

## Step 8: Verify

```bash
npm run type-check
npm run test                       # 1250+ unit tests
NEXT_PUBLIC_GITHUB_PAGES=true npm run build   # catches lore↔source mismatch + new-faction prerender
npx jest src/__tests__/lib/encyclopedia-squad-lore.test.ts   # 5-key shape + count
```

`npm run validate` = type-check + lint + unit tests (no E2E). LSP diagnostics can be stale — trust `type-check`'s exit code.

---

## Machines (Техника)

Same pipeline; deltas:

- **Card & extraction** — name, cost, faction (strip), rank, **Прочность** (durability_max), **Скорострельность** (fire_rate, Б/с), **Боезапас** (ammo_max), a **speed track**, and weapons (name/range/power). Decent-resolution photos (h≥500px): vision reads name+stats in one pass.
- **`speed_sectors` are ~3 INTERVALS, not discrete ticks** — contiguous segments covering 1..durability_max: `[{"min_durability":11,"max_durability":16,"speed":2},…]`. Vision emits discrete per-tick points — that's a misread. **`durability_max = max(sector.max_durability)`** (sectors win over the printed Прочность, which vision misreads).
- **Орудия** (stationary artillery: миномёты, спаренные пушки) — model as machines with empty `speed_sectors` (immobile), heavy weapons, low durability. Flag in the matcher.
- **Images** — star_system machines are flat files `/images/machines/{slug}.jpg`; Tehnolog names are often English (RAPTOR) vs star_system Russian (Раптор) → match via a transliteration map, offer a manual override dropdown.
- **Schema**: `{id,name,shortName,faction,cost,image,rank,fire_rate,ammo_max,durability_max,speed_sectors[],weapons[{name,range,power}]}`. Weapon `range`/`power` = dice or `"ББ"` (melee); per-weapon `ammo` only for community_star_system.
- **Vision noise to verify**: durability vs sectors desync, duplicated weapons, garbled melee names, ammo misread as power.

---

## Modifier mappings

| Card | App ID | Meaning |
|---|---|---|
| Пр3 / Пр4 / Пр5 | `jump_boost_3` / `4` / `5` | Jump boost N steps |
| Рм | `mechanic` | Mechanic |

Not in the table? Ask the user and check `src/data/modifiers/standard-modifiers.json`.

---

## Common mistakes

- **Stats unverified** — vision swaps columns; always run the matcher and have the user confirm before trusting stats. Flag guessed (null) fields.
- **Painted-photo order guessed** — file order ≠ soldier order; ask the user via a matching tool. Never assign silently.
- **`squads: []` left in sources-registry** — source appears in UI with no units. Always import + merge.
- **New faction partially plumbed** — missing `FACTIONS`/`getFactionColors`/registry merge → faction doesn't theme or show. Use the 12-point checklist (Step 6).
- **Lore entry without source squad** → production build crashes at prerender. Commit both together; verify with the GitHub-Pages build.
- **VK download "succeeded" but is HTML** — validate `FF D8 FF` magic bytes; anonymous curl gets a login shell.
- **Lore garbage / fabricated dates** — regenerate from canon; the lore test rejects CJK/latin-bleed, and invented eras contradict the universe.
