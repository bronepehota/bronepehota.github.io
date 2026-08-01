#!/usr/bin/env python3
"""
Batch-render every STL in a Yandex Disk "Бонусные модельки" subfolder to
standard 300×400 white-bg soldier cards.

For each folder:
  1. list STLs (via root key + /path; fall back to the folder's own public_key)
  2. download each STL (cache by name+mtime)
  3. render_stl.render() — auto up-axis, Lambertian shading, transparent PNG
  4. standardize to 300×400 white (content-cropped, 5% margin, centered)
  5. contact sheet for review

All miniatures are Lisitsin's (painter context only — staging, not wired yet).
Army lists come later from the user, so this script ONLY produces images.

Usage:
  python3 tools/render_folder.py "<Folder Name>" [out_subdir]
"""
import sys, os, json, subprocess, urllib.parse, time
import numpy as np
from PIL import Image, ImageDraw

ROOT_KEY = "https://disk.yandex.com/d/JSZN6cwd4Sn4jQ"
REPO = "/home/atuzov/IdeaProjects/bronepehota"
STAGE = f"{REPO}/tmp/lisitsin"

sys.path.insert(0, f"{REPO}/tools")
BLENDER = os.path.expanduser("~/blender-4.4.3-linux-x64/blender")
BLENDER_SCRIPT = f"{REPO}/tools/blender_render.py"


def render(stl_path, out_png, up="auto", azim=-55, elev=6):
    """Render via Blender Cycles (headless). up='auto' → longest bbox axis → Z."""
    import subprocess
    subprocess.run(
        [BLENDER, "--background", "--python", BLENDER_SCRIPT, "--",
         stl_path, out_png, up, str(azim), str(elev)],
        capture_output=True)


API = "https://cloud-api.yandex.net/v1/disk/public/resources"
DL = API + "/download"


def curl_json(url, data):
    r = subprocess.run(["curl", "-s", "-L", "-G", url] +
                       [a for k, v in data.items() for a in ("--data-urlencode", f"{k}={v}")],
                       capture_output=True)
    return json.loads(r.stdout)


def list_folder(folder):
    # try root key + /path first
    for pk in (ROOT_KEY,):
        d = curl_json(API, {"public_key": pk, "path": f"/{folder}", "limit": "200"})
        items = d.get("_embedded", {}).get("items")
        if items:
            return items, pk
    # fallback: fetch root listing, use the folder's own public_url
    root = curl_json(API, {"public_key": ROOT_KEY, "limit": "200"})
    for it in root["_embedded"]["items"]:
        if it["name"] == folder and it["type"] == "dir":
            own = it.get("public_url")
            if own:
                d = curl_json(API, {"public_key": own, "limit": "200"})
                return d.get("_embedded", {}).get("items", []), own
    return [], None


def download(path_rel, dest, pk):
    d = curl_json(DL, {"public_key": pk, "path": path_rel})
    href = d.get("href")
    if not href:
        return False
    subprocess.run(["curl", "-s", "-L", "-o", dest, href], capture_output=True)
    return os.path.exists(dest) and os.path.getsize(dest) > 1000


def standardize(src, dst, TW=300, TH=400, MARGIN=0.05):
    im = Image.open(src).convert("RGBA")
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    im = Image.alpha_composite(bg, im).convert("RGB")
    W, H = im.size
    px = im.load()
    l, t, r, b = W, H, 0, 0
    for y in range(H):
        for x in range(W):
            R, G, B = px[x, y]
            if R < 250 or G < 250 or B < 250:
                l, t, r, b = min(l, x), min(t, y), max(r, x), max(b, y)
    cw, ch = r - l, b - t
    if cw <= 0 or ch <= 0:
        im.convert("RGB").save(dst)
        return
    mx, my = int(cw * MARGIN), int(ch * MARGIN)
    crop = im.crop((max(0, l - mx), max(0, t - my), min(W, r + mx), min(H, b + my)))
    cw, ch = crop.size
    tr, cr = TW / TH, cw / ch
    # fit into 88% of the frame so feet/head aren't flush against the edges
    if cr > tr:
        nw, nh = int(TW * 0.88), int(TW * 0.88 / cr)
    else:
        nh, nw = int(TH * 0.88), int(TH * 0.88 * cr)
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", (TW, TH), (255, 255, 255))
    canvas.paste(crop, ((TW - nw) // 2, (TH - nh) // 2))
    canvas.save(dst, "PNG", optimize=True)


def contact_sheet(files, out, labels=None):
    cols, pad, TW, TH = 3, 10, 300, 400
    rows = (len(files) + cols - 1) // cols
    W = cols * TW + (cols + 1) * pad
    H = rows * TH + (rows + 1) * pad
    sheet = Image.new("RGB", (W, H), (210, 210, 210))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(files):
        im = Image.open(f)
        rr, cc = divmod(i, cols)
        x, y = pad + cc * (TW + pad), pad + rr * (TH + pad)
        sheet.paste(im, (x, y))
        lbl = labels[i] if labels else os.path.basename(f)
        d.text((x + 4, y + 4), lbl, fill=(220, 0, 0))
    sheet.save(out)


def main():
    folder = sys.argv[1]
    outsub = sys.argv[2] if len(sys.argv) > 2 else folder.replace(" ", "_")
    outdir = os.path.join(STAGE, outsub)
    raw = os.path.join(outdir, "_raw")
    os.makedirs(raw, exist_ok=True)

    items, pk = list_folder(folder)
    if not items:
        print(f"!! could not list folder '{folder}'")
        return
    stls = sorted([it["name"] for it in items if it["name"].lower().endswith(".stl")])
    # also surface any card/stat artifact present (not rendered, just noted)
    cards = [it["name"] for it in items if it["name"].lower().endswith((".png", ".jpg", ".doc"))]
    print(f"== {folder} ==")
    print(f"   {len(stls)} STL(s), artifacts: {cards}")

    std_files, labels = [], []
    for name in stls:
        stem = os.path.splitext(name)[0]
        stl_path = os.path.join(raw, name)
        if not (os.path.exists(stl_path) and os.path.getsize(stl_path) > 1_000_000):
            print(f"   download {name} ...", end=" ", flush=True)
            ok = download(f"/{folder}/{name}", stl_path, ROOT_KEY)
            print("ok" if ok else "FAIL")
            if not ok:
                continue
        # auto up-axis from bbox
        from stl import mesh as _mesh
        m = _mesh.Mesh.from_file(stl_path)
        v = m.vectors.reshape(-1, 3)
        ext = v.max(0) - v.min(0)
        # prefer Z-up (sculptor convention) unless Z is clearly not vertical;
        # avoids picking a marginally-longer X/Y on wide poses (e.g. a lunging fig)
        mx = float(ext.max())
        up = 'z' if ext[2] >= 0.6 * mx else {0: 'x', 1: 'y', 2: 'z'}[int(np.argmax(ext))]
        raw_png = os.path.join(raw, stem + ".png")
        print(f"   render {name} (up={up}, {len(m.vectors)} faces) ...", flush=True)
        t0 = time.time()
        render(stl_path, raw_png, up=up, azim=-55, elev=6)
        std_path = os.path.join(outdir, stem + ".png")
        standardize(raw_png, std_path)
        std_files.append(std_path)
        labels.append(stem)
        print(f"      {time.time()-t0:.1f}s -> {os.path.basename(std_path)}")

    if std_files:
        contact_sheet(std_files, os.path.join(outdir, "_contact.png"), labels)
        print(f"   contact sheet: {outdir}/_contact.png  ({len(std_files)} imgs)")


if __name__ == "__main__":
    main()
