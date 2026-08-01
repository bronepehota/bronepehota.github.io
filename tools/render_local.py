#!/usr/bin/env python3
"""Render all STLs in a LOCAL directory -> standardized 300x400 PNGs + contact sheet.
Usage: python3 tools/render_local.py <stl_dir> <out_dir>
Reuses Blender (manual 180° flip) + the standardize/contact helpers from render_folder.
"""
import sys, os, glob, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render_folder import standardize, contact_sheet, BLENDER, BLENDER_SCRIPT  # noqa: E402


def main():
    indir, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    stls = sorted(glob.glob(os.path.join(indir, "*.stl")))
    std_files, labels = [], []
    for stl in stls:
        stem = os.path.splitext(os.path.basename(stl))[0].strip()
        raw = os.path.join(outdir, "_raw", stem + ".png")
        os.makedirs(os.path.dirname(raw), exist_ok=True)
        subprocess.run([BLENDER, "--background", "--python", BLENDER_SCRIPT, "--",
                        stl, raw, "auto", "-55", "6", "0"], capture_output=True)
        stdf = os.path.join(outdir, stem + ".png")
        standardize(raw, stdf)
        std_files.append(stdf)
        labels.append(stem)
        print(f"rendered {stem}", flush=True)
    if std_files:
        contact_sheet(std_files, os.path.join(outdir, "_contact.png"), labels)
        print(f"contact: {outdir}/_contact.png ({len(std_files)} imgs)", flush=True)


if __name__ == "__main__":
    main()
