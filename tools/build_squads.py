#!/usr/bin/env python3
"""Build/merge squads.json from a verified matcher manifest.

Usage:
  python3 tools/build_squads.py <manifest.json>

Reads each squad (faction, slug, soldiers with imgIndex), builds squad objects,
MERGES into src/data/sources/{source}/{faction}/squads.json by id (update-or-append).
Validates dice notation, gapless num sequence; warns on missing public images
and on null stats (guessed from siblings).

Manifest shape = the matcher's export (tools/card_matcher_gen.py):
  [{ name, slug, faction, source?, cost, card, imgDir, imgPrefix,
     soldiers:[{num,rank,speed,range,power,melee,modifier,armor,imgIndex}] }]
"""
import json, os, re, sys
from collections import defaultdict

MAN = sys.argv[1] if len(sys.argv) > 1 else "tmp/rutenia/verified.json"
D = json.load(open(MAN))
DICE = re.compile(r'^(\d+)?D\d+([+-]\d+)?$')
ROOT = "src/data/sources"

def coerce(e, num, f, v):
    """Return (value, was_guessed). Null → median of siblings (flagged)."""
    if v is None:
        sibs = [s[f] for s in e["soldiers"] if s.get(f) is not None]
        return (sorted(sibs)[len(sibs)//2] if sibs else 0), True
    return v, False

def short_name(name):
    n = name.strip()
    return n if len(n) <= 26 else n[:23].rstrip() + "…"

groups = defaultdict(list)
uncertain = []
img_missing = []

for e in D:
    src = e.get("source", "star_system")
    fac = e.get("faction", "rutenia")
    slug = e["slug"]
    base = f"/images/squads/{fac}/{slug}/"
    soldiers = []
    for s in sorted(e["soldiers"], key=lambda x: x["num"]):
        rng = (s.get("range") or "").replace("Д", "D").strip()
        pwr = (s.get("power") or "").replace("Д", "D").strip()
        for v, fld in [(rng, "range"), (pwr, "power")]:
            if v and not DICE.match(v):
                print(f"  ⚠ {slug} s{s['num']} malformed {fld}: {v}")
        imgi = s.get("imgIndex") or s["num"]
        vals = {}
        for fld in ("rank", "speed", "melee", "armor"):
            val, guessed = coerce(e, s["num"], fld, s.get(fld))
            vals[fld] = val
            if guessed:
                uncertain.append((slug, s["num"], fld, val))
        sol = {"num": s["num"], "rank": vals["rank"], "speed": vals["speed"],
               "range": rng, "power": pwr, "melee": vals["melee"], "armor": vals["armor"],
               "image": f"{base}{imgi}.png"}
        if s.get("modifier"):
            sol["modifiers"] = [s["modifier"]]
        if not os.path.exists("public" + sol["image"]):
            img_missing.append(sol["image"])
        soldiers.append(sol)
    sq = {"id": f"{fac}_{slug}", "name": e["name"],
          "shortName": e.get("shortName") or short_name(e["name"]),
          "faction": fac, "cost": e["cost"], "soldiers": soldiers, "image": f"{base}1.png"}
    groups[(src, fac)].append(sq)

for (src, fac), new_squads in groups.items():
    fdir = f"{ROOT}/{src}/{fac}"
    fpath = f"{fdir}/squads.json"
    os.makedirs(fdir, exist_ok=True)
    existing = json.load(open(fpath)) if os.path.exists(fpath) else []
    by_id = {s["id"]: s for s in existing}
    for sq in new_squads:
        by_id[sq["id"]] = sq  # update or append
    merged = list(by_id.values())
    json.dump(merged, open(fpath, "w"), ensure_ascii=False, indent=2)
    mpath = f"{fdir}/machines.json"
    if not os.path.exists(mpath):
        open(mpath, "w").write("[]\n")
    for sq in new_squads:
        nums = [s["num"] for s in sq["soldiers"]]
        assert nums == list(range(1, len(nums) + 1)), f"{sq['id']} bad nums {nums}"
    print(f"{src}/{fac}: {len(new_squads)} squads merged → {fpath} (file total {len(merged)})")

if uncertain:
    print("\n⚠ NEEDS VERIFICATION (null → guessed from siblings):")
    for slug, num, fld, val in uncertain:
        print(f"   {slug} #{num} {fld}={val}")
else:
    print("\n(no null stat fields)")
if img_missing:
    print(f"\n⚠ {len(img_missing)} public images missing (standardize first?):")
    for p in img_missing[:8]:
        print(f"   public{p}")
else:
    print("(all public images present ✓)")
