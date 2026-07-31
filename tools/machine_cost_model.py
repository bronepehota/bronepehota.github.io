#!/usr/bin/env python3
"""
Стоимость техники (Star System) — reproduce the community Excel calculator
"Kalkulyatora_tekhniki_na_monoblokakh_Beta_v-01.xlsx".

Methodology (extracted from the xlsx):
  Арсенал price table (per-die, BEFORE the /10 weapon roundup):
    Range  base: Д6=10, Д12=40, Д20=80
    Power  base: Д6=20, Д12=80, Д20=160   (= 2× range base)
    multi-dice multiplier: 1die=×1, 2dice=×4, 3dice=×6   (i.e. ×(2n) for n>=2)
    bonus: +20 per "+1" (range and power independently)
    ББ (melee): power 1/2/3 = 10/20/30
    ammo: 10 per shot (per weapon)
    properties: "3 выстрела в 3 напр."=20, "Взрыв 1шг −1Д12"=50, "Взрыв 2шг −1Д20"=100
  Per-weapon cost   = ceil((rangePrice + powerPrice + propertyPrice + 10×ammo) / 10)
  Machine cost      = ceil_to_5( Σ per-weapon costs + armor×10 + speed×10 )

The xlsx never filled in the 4 flying vehicles (Гравилёт chassis → "ОШИБКА!" in its
formulas), which is why their costs were arbitrary. This script prices them.

Armor & speed are NOT stored on the app Machine (only durability_max + speed_sectors),
so they are taken from the xlsx "Моноблоки и шасси" sheet per vehicle (Гравилёт rule:
armor = моноблок base − 4, speed from the flyer weight class).
"""
import json, re, math, os

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'src', 'data', 'sources', 'star_system')

RANGE_BASE = {6: 10, 12: 40, 20: 80}
POWER_BASE = {6: 20, 12: 80, 20: 160}
BONUS = 20            # per "+1"
AMMO = 10             # per shot
RANGE_TO5 = 5         # final machine-cost rounding

PROP_PRICE = [
    (re.compile('3 выстрела'), 20),
    (re.compile('Взрыв.*1 шг|1 шг.*Д12'), 50),
    (re.compile('Взрыв.*2 шг|2 шг.*Д20'), 100),
]

def parse_dice(s):
    """'2D20+3' -> (count, sides, bonus); 'ББ' -> ('melee',); '5' -> ('flat', 5)."""
    if s is None:
        return None
    s = str(s).strip().replace('Д', 'D').replace('д', 'D')
    if s in ('ББ', 'BB', 'Bb'):
        return ('melee',)
    if re.fullmatch(r'\d+', s):                     # plain number (ББ power)
        return ('flat', int(s))
    m = re.fullmatch(r'(\d*)D(\d+)([+-]\d+)?', s)
    if not m:
        return None
    count = int(m.group(1)) if m.group(1) else 1
    sides = int(m.group(2))
    bonus = int(m.group(3)) if m.group(3) else 0
    return (count, sides, bonus)

def mult(count):
    return 1 if count == 1 else 2 * count            # 1→1, 2→4, 3→6

def dice_price(spec, base_table):
    p = parse_dice(spec)
    if not p or p[0] in ('melee', 'flat'):
        return 0
    _, sides, bonus = p
    return base_table.get(sides, 0) * mult(p[0]) + BONUS * bonus

def prop_price(special):
    if not special:
        return 0
    for pat, price in PROP_PRICE:
        if pat.search(special):
            return price
    return 0

def weapon_cost(w):
    rng, pwr = w.get('range'), w.get('power')
    ammo = w.get('ammo') or 0
    rp = parse_dice(rng)
    pp = parse_dice(pwr)
    # melee weapon (ББ): range ignored, power is a flat 1/2/3 -> 10/20/30, no ammo
    if (rp and rp[0] == 'melee') or (pp and pp[0] in ('melee', 'flat')):
        flat = pwr if isinstance(pwr, int) else (pp[1] if pp and pp[0] == 'flat' else 0)
        raw = 0 + 10 * int(flat) + 0 + 0
        return math.ceil(raw / 10)
    raw = dice_price(rng, RANGE_BASE) + dice_price(pwr, POWER_BASE) + prop_price(w.get('special')) + AMMO * ammo
    return math.ceil(raw / 10)

def machine_cost(weapons, armor, speed, second_move=False, flight_bonus_pct=0):
    """armor/speed from the Star System JSON (armor = durability_max, speed = top
    of speed_sectors). second_move = the flyer's 2nd move action (move-shoot-move).
    flight_bonus_pct = flat premium for being a flyer (overflight + grenade immunity)."""
    wsum = sum(weapon_cost(w) for w in weapons)
    total = wsum + armor * 10 + speed * 10
    if second_move:
        total += speed * 10          # 2nd move (ходы) — flyer moves twice/turn
    total *= (1 + flight_bonus_pct / 100)
    return int(math.ceil(total / RANGE_TO5) * RANGE_TO5)


def armor_of(m):
    return m['durability_max']       # Star System defensive stat = прочность

def speed_of(m):
    return max(s['speed'] for s in m['speed_sectors'])   # top speed

# armor, speed per vehicle id — from xlsx "Моноблоки и шасси" (Гравилёт: base armor −4)
ARMOR_SPEED = {
    # flyers — armor from xlsx "Моноблоки и шасси" printed per-vehicle top armor
    # (Тандер/Кондор/Хорнет all print 11…8; Спрут prints 10…7)
    'thunder':  (11, 5), 'hornet': (11, 5), 'octopus': (10, 6), 'condor': (11, 6),
    # ground (for validation against existing costs)
    'griffin': (11, 6), 'predator': (12, 5), 'hurricane': (13, 4), 'wildbear': (13, 3),
    'demolisher': (16, 2), 'locust': (12, 5), 'trex': (15, 4),
}
FLYERS = {'thunder', 'hornet', 'octopus', 'condor'}
# Hornet & Condor weapons are mounted in PAIRS (each listed gun = 2), shown as one
# in the tech-list to save space → double their weapon contribution.
DOUBLED = {'hornet', 'condor'}
# Explicit armor (броня) per user — Star System values (NOT durability_max, NOT xlsx).
ARMOR_OVERRIDE = {'thunder': 10, 'octopus': 10, 'hornet': 14, 'condor': 14}
FLIGHT_BONUS_PCT = 40                            # +40% for being a flyer (over ходы)

def load():
    out = {}
    for fac in ('polaris', 'protectorate'):
        for m in json.load(open(os.path.join(SRC, fac, 'machines.json'))):
            out[m['id']] = m
    return out

def main():
    machines = load()
    PREMIUM = True   # +speed×10 for the flyer's 2nd move action (move-shoot-move)
    print("=== ground validation (no premium) ===")
    print(f"{'id':<12}{'old':>6}{'calc':>6}{'Δ':>6}   armor/spd")
    for mid in ('griffin', 'predator', 'hurricane', 'wildbear', 'demolisher', 'locust', 'trex'):
        m = machines[mid]; armor, speed = ARMOR_SPEED[mid]
        new = machine_cost(m['weapons'], armor, speed)
        print(f"{mid:<12}{m['cost']:>6}{new:>6}{new - m['cost']:>+6}   {armor}/{speed}")
    print("\n=== flyers — FINAL (armor=durability per user; Hornet/Condor pairs×2; +move +40% flight) ===")
    for mid in ('thunder', 'hornet', 'octopus', 'condor'):
        m = machines[mid]
        armor = ARMOR_OVERRIDE[mid]          # = corrected durability (броня)
        speed = speed_of(m)                  # top of speed_sectors (Star System)
        doubled = mid in DOUBLED
        weapons = m['weapons'] * (2 if doubled else 1)
        print(f"\n{m['name']} ({mid})  old={m['cost']}  броня(dur) {armor}  speed {speed}  fire_rate {m['fire_rate']}"
              + ('   [pairs ×2]' if doubled else ''))
        wsum = sum(weapon_cost(w) for w in weapons)
        for w in m['weapons']:
            print(f"   {w['range']:>5}/{w['power']:<6} ammo={w.get('ammo') or 0:<3} | {weapon_cost(w):>4}"
                  + (' ×2' if doubled else '') + f"   {w['name'][:40]}")
        new = machine_cost(weapons, armor, speed, second_move=True, flight_bonus_pct=FLIGHT_BONUS_PCT)
        base = machine_cost(weapons, armor, speed, second_move=False, flight_bonus_pct=0)
        print(f"   Σweapons={wsum}  броня {armor*10}  ходы(speed×2) {speed*20}  → base {base}"
              f"  ×1.{FLIGHT_BONUS_PCT} полёт = {new}   ===>  {m['cost']} → {new}")

if __name__ == '__main__':
    main()
