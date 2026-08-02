#!/usr/bin/env python3
"""
Render an STL miniature to a shaded PNG (transparent background) using a
numpy z-buffer software renderer — no OpenGL/GPU/display required.

Usage:
  python3 tools/render_stl.py <input.stl> <output.png> [--azim -55] [--elev 8]
                              [--up auto|z|y|x] [--color 0.55,0.57,0.60]

Designed for one-off batch card-art generation (Step 0 of import-cards):
the app's star_system card art is a shaded grey render on a white canvas,
so we output a transparent-bg shaded figure that standardize_images.py
drops onto white (300×400).
"""
import sys
import numpy as np
from stl import mesh


def normalize(v):
    n = np.linalg.norm(v)
    return v / n if n else v


def render(stl_path, out_path, azim=-55, elev=8, up='auto',
           color=(0.66, 0.68, 0.72), width=600, height=800, scale=1.0):
    m = mesh.Mesh.from_file(stl_path)
    v = m.vectors  # (F, 3, 3)
    F = v.shape[0]

    # --- orient: make the chosen "up" axis the vertical (Y in screen space) ---
    pts = v.reshape(-1, 3)
    mn, mx = pts.min(0), pts.max(0)
    ext = mx - mn
    if up == 'auto':
        up_axis = int(np.argmax(ext))
    else:
        up_axis = {'x': 0, 'y': 1, 'z': 2}[up]
    # rotate so up_axis -> Z (matplotlib Z is up in 3D), keep the other two.
    perm = {0: (1, 2, 0), 1: (2, 0, 1), 2: (0, 1, 2)}[up_axis]
    v = v[:, perm, :]
    # recompute after permute
    pts = v.reshape(-1, 3)
    center = (pts.min(0) + pts.max(0)) / 2.0
    v = v - center
    ext = (pts.max(0) - pts.min(0))
    s = 2.0 / (ext.max() or 1.0)
    v = v * s

    # per-face vertices (F,3,3) and normals
    a, b, c = v[:, 0], v[:, 1], v[:, 2]
    face_n = np.cross(b - a, c - a)
    nn = np.linalg.norm(face_n, axis=1, keepdims=True)
    nn[nn == 0] = 1.0
    face_n = face_n / nn

    # --- camera: look from azim/elev ---
    az = np.radians(azim)
    el = np.radians(elev)
    eye = np.array([np.cos(el) * np.cos(az),
                    np.cos(el) * np.sin(az),
                    np.sin(el)]) * 4.0
    target = np.array([0.0, 0.0, 0.0])
    forward = normalize(target - eye)
    world_up = np.array([0.0, 0.0, 1.0])
    right = normalize(np.cross(forward, world_up))
    upv = np.cross(right, forward)
    # view matrix rows: right, upv, -forward
    R = np.stack([right, upv, -forward], axis=0)
    cam = (v - eye) @ R.T  # (F,3,3) in camera space (x=right, y=up, z=+depth away)

    # perspective project
    f = 800.0
    zc = cam[..., 2]
    zc = np.where(zc > -0.1, -0.1, zc)  # avoid div by ~0
    sx = cam[..., 0] / (-zc) * f
    sy = cam[..., 1] / (-zc) * f

    # rotate normals into camera space for backface cull + fresnel rim
    n_cam = face_n @ R.T

    # --- 3-point lighting in WORLD space (figure up = +Z) ---
    # camera is at +x,-y (azim -55), so the camera-facing side is +x/-y.
    # Light directions point FROM surface TO light.
    L_key = normalize(np.array([1.0, -0.55, 1.35]))   # main: upper, camera-side
    L_fill = normalize(np.array([-0.95, 0.45, 0.25])) # soft: opposite, low
    L_rim = normalize(np.array([-0.25, 0.85, 1.15]))  # back-top: outlines silhouette
    d_key = np.clip(face_n @ L_key, 0, 1)
    d_fill = np.clip(face_n @ L_fill, 0, 1)
    d_rim = np.clip(face_n @ L_rim, 0, 1)
    # specular (Blinn-Phong) — per-face half-vector toward key light + camera
    center = v.mean(axis=1)                  # (F,3) world face centers
    V = eye - center
    V /= np.linalg.norm(V, axis=1, keepdims=True) + 1e-9
    H = L_key[None, :] + V
    H /= np.linalg.norm(H, axis=1, keepdims=True) + 1e-9
    spec = np.clip((face_n * H).sum(axis=1), 0, 1) ** 22
    # fresnel rim (camera-space): grazing front faces get a bright edge halo
    fres = (1.0 - np.clip(-n_cam[:, 2], 0, 1)) ** 3
    # combine → linear brightness (may exceed 1, tone-mapped later)
    shade = (0.16                          # ambient
             + 0.95 * d_key                # key (form)
             + 0.42 * d_fill               # fill (shadow detail)
             + 0.60 * d_rim                # rim (backlight outline)
             + 0.55 * spec                 # specular sheen on weapons/armor
             + 0.45 * fres * np.clip(d_rim + 0.3, 0, 1))  # edge halo
    shade = shade / (1.0 + 0.50 * shade)   # Reinhard tone map (highlight rolloff)

    # backface cull: faces pointing away from camera (camera looks -forward => +z)
    front = n_cam[:, 2] < 0.02

    # rasterize with z-buffer, numpy-vectorized over pixels via triangle bbox
    img = np.zeros((height, width, 3), dtype=np.float32)
    zbuf = np.full((height, width), 1e9, dtype=np.float32)

    # screen bounds (sx,sy ~ in model units; map to pixels)
    allx = sx[front]
    ally = sy[front]
    if allx.size == 0:
        front = np.ones(F, dtype=bool)
        allx, ally = sx, sy
    # Percentile-trimmed bbox: ignore outlier triangles (rifles, backpack
    # stragglers) so the dense body is framed + centered, not pushed aside.
    xmin = float(np.percentile(allx, 2))
    xmax = float(np.percentile(allx, 98))
    ymin = float(np.percentile(ally, 2))
    ymax = float(np.percentile(ally, 98))
    span = max(xmax - xmin, ymax - ymin) or 1.0
    pad = 0.06
    cx = (xmin + xmax) / 2.0
    cy = (ymin + ymax) / 2.0
    half = (span / 2.0) / (1 - 2 * pad)
    def X(p): return (p - cx) / (2 * half) * width + width / 2.0
    def Y(p): return (p - cy) / (2 * half) * height + height / 2.0

    px = X(sx)
    py = Y(sy)
    # invert y (image rows top->down)
    py = (height - 1) - py
    depth = zc  # camera-space z (more negative = closer)

    for i in range(F):
        if not front[i]:
            continue
        ax_, bx_, cx_ = px[i]
        ay_, by_, cy_ = py[i]
        ix0 = int(max(0, np.floor(min(ax_, bx_, cx_))))
        ix1 = int(min(width - 1, np.ceil(max(ax_, bx_, cx_))))
        jy0 = int(max(0, np.floor(min(ay_, by_, cy_))))
        jy1 = int(min(height - 1, np.ceil(max(ay_, by_, cy_))))
        if ix1 < ix0 or jy1 < jy0:
            continue
        xs = np.arange(ix0, ix1 + 1) + 0.5
        ys = np.arange(jy0, jy1 + 1) + 0.5
        gx, gy = np.meshgrid(xs, ys)
        # barycentric (signed area)
        denom = (by_ - cy_) * (ax_ - cx_) + (cx_ - bx_) * (ay_ - cy_)
        if abs(denom) < 1e-6:
            continue
        l1 = ((by_ - cy_) * (gx - cx_) + (cx_ - bx_) * (gy - cy_)) / denom
        l2 = ((cy_ - ay_) * (gx - cx_) + (ax_ - cx_) * (gy - cy_)) / denom
        l3 = 1.0 - l1 - l2
        inside = (l1 >= 0) & (l2 >= 0) & (l3 >= 0)
        if not inside.any():
            continue
        z = (l1 * depth[i, 0] + l2 * depth[i, 1] + l3 * depth[i, 2])
        zc_ = np.where(inside, z, 1e9)
        sub_zbuf = zbuf[jy0:jy1 + 1, ix0:ix1 + 1]
        closer = zc_ < sub_zbuf
        if not closer.any():
            continue
        col = np.array(color) * shade[i]
        sub = img[jy0:jy1 + 1, ix0:ix1 + 1]
        m_ = closer
        sub[m_] = col
        sub_zbuf[m_] = zc_[m_]

    # write PNG (transparent where empty)
    from PIL import Image
    alpha = (zbuf < 1e8).astype(np.uint8) * 255
    rgb = (np.clip(img, 0, 1) * 255).astype(np.uint8)
    out = np.dstack([rgb, alpha])
    Image.fromarray(out, 'RGBA').save(out_path)
    print(f"  {stl_path} -> {out_path}  ({F} faces, {int((alpha>0).sum())} lit px)")


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__); sys.exit(1)
    inp, outp = args[0], args[1]
    kw = {}
    for a in args[2:]:
        if a.startswith('--'):
            k, v = a[2:].split('=', 1)
            kw[k] = v
    render(inp, outp,
           azim=float(kw.get('azim', -55)),
           elev=float(kw.get('elev', 8)),
           up=kw.get('up', 'auto'),
           color=tuple(float(x) for x in kw.get('color', '0.66,0.68,0.72').split(',')),
           width=int(kw.get('width', 600)),
           height=int(kw.get('height', 800)))


if __name__ == '__main__':
    main()
