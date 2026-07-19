#!/usr/bin/env python3
# Crop the raw hero screenshot (/tmp/hero-raw.png) to a 1200x630 OG card.
# Run from repo root:  python3 tools/regen-og-crop.py
from PIL import Image

im = Image.open('/tmp/hero-raw.png').convert('RGB')
w, h = im.size

# Work at 2x for sharp text, then downscale to 1200x630.
TW, CH = 2400, 1260  # 2 * 1200, 2 * 630  (ratio 1.9048 == 1200/630)

scale = TW / w
th = max(1, round(h * scale))
im2 = im.resize((TW, th), Image.LANCZOS)

if th > CH:
    top = (th - CH) // 2
    im2 = im2.crop((0, top, TW, top + CH))
elif th < CH:
    pad = Image.new('RGB', (TW, CH), (0x0C, 0x0A, 0x09))  # military-dark
    pad.paste(im2, (0, (CH - th) // 2))
    im2 = pad

im2 = im2.resize((1200, 630), Image.LANCZOS)
im2.save('public/og-image.png', 'PNG', optimize=True)
print(f'saved public/og-image.png {im2.size}')
