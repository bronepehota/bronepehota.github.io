"""Render a yaw sweep for every STL in a directory (one Blender startup, many renders).

  blender --background --python tools/render_sweep.py -- <stl_dir> <out_dir> [step=15] [min=-75] [max=75]

Writes out_dir/{stem}/a{angle}.png (preview quality: white bg, 300x400, 20 samples).
Skips existing frames so it resumes. Finite (prints SWEEP_DONE) -> runs fine as a
background batch where a persistent server cannot.
"""
import bpy, sys, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
from blender_render import render_figure  # noqa: E402

argv = sys.argv
sep = argv.index("--") if "--" in argv else len(argv)
args = argv[sep + 1:]
stl_dir, out_dir = args[0], args[1]
step = int(args[2]) if len(args) > 2 else 15
mn = int(args[3]) if len(args) > 3 else -75
mx = int(args[4]) if len(args) > 4 else 75

angles = list(range(mn, mx + 1, step))
stls = sorted(glob.glob(os.path.join(stl_dir, "*.stl")))
print(f"sweep: {len(stls)} stl x {len(angles)} angles ({mn}..{mx} step {step})", flush=True)

for stl in stls:
    stem = os.path.splitext(os.path.basename(stl))[0].strip()
    odir = os.path.join(out_dir, stem)
    os.makedirs(odir, exist_ok=True)
    for a in angles:
        out = os.path.join(odir, f"a{a}.png")
        if os.path.exists(out) and os.path.getsize(out) > 1000:
            continue
        render_figure(stl, out, turn=float(a), samples=20, W=300, H=400,
                      transparent=False, bg_color=(1.0, 1.0, 1.0, 1.0), bg_strength=1.0)
        print(f"  {stem} a{a:+d}", flush=True)
    print(f"{stem}: done", flush=True)
print("SWEEP_DONE", flush=True)
