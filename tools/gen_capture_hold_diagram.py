#!/usr/bin/env python3
"""
Generate the deployment diagram for the «Захват и удержание точек» mission.

Produces public/images/missions/zahvat_tochek/diagram.png — a clean schematic
(slate/amber, matching the app theme) of a 120×80 cm table with:
  - a 12×8 grid (one cell = 10 cm),
  - two deployment zones at opposite short edges,
  - three control-point markers (centre + two flanks) for the default 3-point layout.

Run: python3 tools/gen_capture_hold_diagram.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Output
OUT = Path(__file__).resolve().parent.parent / "public" / "images" / "missions" / "zahvat_tochek" / "diagram.png"

# Canvas — 3:2 aspect (120:80), generous resolution
W, H = 1500, 1000

# Palette (matches the app's slate/amber theme)
BG = (15, 23, 42)          # slate-950
TABLE = (17, 25, 40)       # slate-900
GRID = (51, 65, 85)        # slate-700
BORDER = (245, 158, 11)    # amber-500
DEPLOY = (120, 53, 15)     # amber-900 (deployment zone tint)
POINT = (245, 158, 11)     # amber-500
TEXT = (226, 232, 240)     # slate-200
TEXT_DIM = (148, 163, 184) # slate-400

# Layout
MARGIN = 90
GRID_COLS, GRID_ROWS = 12, 8


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Table border (the play area)
    tx0, ty0, tx1, ty1 = MARGIN, MARGIN, W - MARGIN, H - MARGIN
    d.rectangle([tx0, ty0, tx1, ty1], fill=TABLE, outline=BORDER, width=4)

    # Grid
    cell_w = (tx1 - tx0) / GRID_COLS
    cell_h = (ty1 - ty0) / GRID_ROWS
    for c in range(1, GRID_COLS):
        x = tx0 + cell_w * c
        d.line([(x, ty0), (x, ty1)], fill=GRID, width=1)
    for r in range(1, GRID_ROWS):
        y = ty0 + cell_h * r
        d.line([(tx0, y), (tx1, y)], fill=GRID, width=1)

    # Deployment zones at opposite short edges (left & right strips)
    strip = int(cell_w * 1.0)
    d.rectangle([tx0, ty0, tx0 + strip, ty1], fill=DEPLOY, outline=BORDER, width=2)
    d.rectangle([tx1 - strip, ty0, tx1, ty1], fill=DEPLOY, outline=BORDER, width=2)

    f_label = font(22, bold=True)
    # Rotated labels for the deployment zones
    for side_x, anchor in ((tx0 + strip // 2, "left"), (tx1 - strip // 2, "right")):
        tmp = Image.new("RGBA", (260, 30), (0, 0, 0, 0))
        ImageDraw.Draw(tmp).text((0, 0), "Зона развёртывания", font=f_label, fill=TEXT_DIM)
        rotated = tmp.rotate(90, expand=True)
        img.paste(rotated, (side_x - rotated.width // 2, (ty0 + ty1) // 2 - rotated.height // 2), rotated)

    # Three control-point markers: centre + two flanks
    cy = (ty0 + ty1) // 2
    xs = [tx0 + cell_w * 3, tx0 + cell_w * 6, tx0 + cell_w * 9]
    f_pt = font(34, bold=True)
    r = 42
    for i, x in enumerate(xs, start=1):
        d.ellipse([x - r, cy - r, x + r, cy + r], fill=POINT, outline=TEXT, width=3)
        num = str(i)
        bbox = d.textbbox((0, 0), num, font=f_pt)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        d.text((x - tw // 2, cy - th // 2 - 4), num, font=f_pt, fill=BG)

    # Title
    f_title = font(40, bold=True)
    title = "Захват и удержание точек — расстановка (3 точки)"
    bbox = d.textbbox((0, 0), title, font=f_title)
    d.text(((W - (bbox[2] - bbox[0])) // 2, 28), title, font=f_title, fill=BORDER)

    # Legend
    f_leg = font(22)
    legend_y = ty1 + 30
    d.ellipse([tx0, legend_y, tx0 + 22, legend_y + 22], fill=POINT, outline=TEXT, width=2)
    d.text((tx0 + 32, legend_y - 2), "Контрольная точка", font=f_leg, fill=TEXT)
    lx = tx0 + 360
    d.rectangle([lx, legend_y, lx + 22, legend_y + 22], fill=DEPLOY, outline=BORDER, width=2)
    d.text((lx + 32, legend_y - 2), "Зона развёртывания", font=f_leg, fill=TEXT)
    d.text((tx0 + 720, legend_y - 2), "Варианты: 2 / 3 / 5 точек (договоритесь перед игрой)", font=f_leg, fill=TEXT_DIM)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG")
    print(f"Wrote {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
