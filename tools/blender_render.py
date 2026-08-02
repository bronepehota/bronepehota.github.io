"""
Blender STL -> shaded PNG via Cycles. Usable two ways:

  CLI:   blender --background --python tools/blender_render.py -- <in.stl> <out.png> [up] [azim] [elev] [turn]
  API:   from blender_render import render_figure   (inside a Blender Python process)

Auto-orients (longest bbox axis -> +Z), 180° front-flip + TURN yaw, frames the
figure, 3-point sun light + dim ambient, grey Principled material, Cycles (CPU)
+ denoise. Transparent film by default (standardize_images drops onto white);
the live render server uses white-bg previews instead.
"""
import bpy, math
from mathutils import Vector


def _setup_scene(stl_path, up, azim, elev, turn, transparent, samples, W, H, bg_color, bg_strength):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    bpy.ops.wm.stl_import(filepath=stl_path)
    obj = bpy.context.selected_objects[0] or bpy.context.active_object
    mesh = obj.data

    coords = [obj.matrix_world @ Vector(v.co) for v in mesh.vertices]
    xs = [c.x for c in coords]; ys = [c.y for c in coords]; zs = [c.z for c in coords]
    ext = [max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)]
    if up == "auto":
        up_axis = 2 if ext[2] >= 0.6 * max(ext) else max(range(3), key=lambda i: ext[i])
    else:
        up_axis = {"x": 0, "y": 1, "z": 2}[up]
    if up_axis == 0:
        obj.rotation_euler = (0.0, math.radians(90), 0.0)
    elif up_axis == 1:
        obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # 180° front-flip + TURN yaw
    obj.rotation_euler = (0.0, 0.0, math.pi + math.radians(turn))
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    coords = [obj.matrix_world @ Vector(v.co) for v in mesh.vertices]
    xs = [c.x for c in coords]; ys = [c.y for c in coords]; zs = [c.z for c in coords]
    cx = (max(xs) + min(xs)) / 2; cy = (max(ys) + min(ys)) / 2; cz = (max(zs) + min(zs)) / 2
    obj.location = (-cx, -cy, -cz)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    coords = [obj.matrix_world @ Vector(v.co) for v in mesh.vertices]
    dim = [max(c.x for c in coords) - min(c.x for c in coords),
           max(c.y for c in coords) - min(c.y for c in coords),
           max(c.z for c in coords) - min(c.z for c in coords)]
    s = 2.0 / max(dim)
    obj.scale = (s, s, s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    mat = bpy.data.materials.new("MiniMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.62, 0.64, 0.68, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.45
    try:
        bsdf.inputs["Metallic"].default_value = 0.15
    except Exception:
        pass
    obj.data.materials.append(mat)
    for p in mesh.polygons:
        p.use_smooth = True

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.sensor_fit = 'HORIZONTAL'
    cam_data.sensor_width = 36.0
    cam_data.lens = 50.0
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    az, el = math.radians(azim), math.radians(elev)
    hf = 2 * math.atan(18.0 / cam_data.lens)
    vf = 2 * math.atan(math.tan(hf / 2) * (H / W))
    D = (1.0 / 0.80) / math.tan(vf / 2)
    eye = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el))) * D
    cam.location = eye
    cam.rotation_euler = (-eye.normalized()).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    def add_sun(name, direction, energy):
        lo = bpy.data.lights.new(name, 'SUN')
        lo.energy = energy
        lo_obj = bpy.data.objects.new(name, lo)
        scene.collection.objects.link(lo_obj)
        d = Vector(direction).normalized()
        lo_obj.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    add_sun("Key", (1.0, -0.55, 1.35), 3.5)
    add_sun("Fill", (-0.95, 0.45, 0.25), 1.3)
    add_sun("Rim", (-0.25, 0.85, 1.15), 2.2)

    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = bg_color
    bg.inputs["Strength"].default_value = bg_strength

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.film_transparent = transparent
    scene.render.resolution_x = W
    scene.render.resolution_y = H
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    return scene


def render_figure(stl_path, out_path, up="auto", azim=-55.0, elev=6.0, turn=0.0,
                  samples=96, W=600, H=800, transparent=True,
                  bg_color=(0.55, 0.57, 0.62, 1.0), bg_strength=0.35):
    """Render one STL to out_path. Returns out_path."""
    scene = _setup_scene(stl_path, up, azim, elev, turn, transparent, samples, W, H, bg_color, bg_strength)
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    return out_path


if __name__ == "__main__":
    import sys
    argv = sys.argv
    sep = argv.index("--") if "--" in argv else len(argv)
    args = argv[sep + 1:]
    IN, OUT = args[0], args[1]
    UP = args[2] if len(args) > 2 else "auto"
    AZIM = float(args[3]) if len(args) > 3 else -55.0
    ELEV = float(args[4]) if len(args) > 4 else 6.0
    TURN = float(args[5]) if len(args) > 5 else 0.0
    render_figure(IN, OUT, up=UP, azim=AZIM, elev=ELEV, turn=TURN)
    print(f"RENDERED {IN} -> {OUT}")
