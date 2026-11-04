"""Render any character .glb: turnaround stills + one portrait MP4 per animation on the Üçlü Köprü set.

Usage:
  blender -b -P render_glb.py -- --glb karakter.glb [--name kerem] [--out DIR] [--height 1.84]
        [--samples 48] [--anim-samples 16] [--max-frames 96] [--no-anim] [--no-env] [--no-turnaround]
        [--actions Bekleme,Kosu] [--loops Bekleme,Kosu --loop-min 3] [--water Yuzme]
        [--lift Ziplama:24:50:0.45]

  --actions  only these clips (names as stored in the glb; the importer's "_<armature>" suffix is ignored)
  --loops    looping clips: the MP4 repeats the cycle until it lasts at least --loop-min seconds
  --water    clips filmed in the lagoon beside the dock (swimming), body centred on the water line
  --lift     NAME:f0:f1:h  adds a sine arc of height h between frames f0..f1 (in-place jumps) and keeps
             the feet above the deck for that clip (render only; the glb is not changed)

Outputs (default DIR = ../render/<name>/):
  <name>_on.png, <name>_34.png, <name>_yan.png, <name>_arka.png   (1080x1350 turnaround)
  <name>_donus_tablosu.png                                        (4 views side by side, needs ffmpeg)
  <name>_<action>.mp4                                             (540x960 clip per armature action)
"""
import bpy, sys, os, math, glob, shutil, subprocess
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_env as ENV  # noqa: E402


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = dict(glb=None, name=None, out=None, height=None, samples=48, anim_samples=16, max_frames=96,
             anim=True, env=True, turn=True, actions="", loops="", loop_min=3.0, water="", lift="")
    i = 0
    while i < len(a):
        k = a[i]
        if k == "--no-anim":
            o["anim"] = False
        elif k == "--no-env":
            o["env"] = False
        elif k == "--no-turnaround":
            o["turn"] = False
        else:
            key = k.lstrip("-").replace("-", "_")
            v = a[i + 1]
            i += 1
            o[key] = v if key in ("glb", "name", "out", "actions", "loops", "water", "lift") else float(v)
        i += 1
    if not o["glb"]:
        raise SystemExit("--glb gerekli")
    o["name"] = o["name"] or os.path.splitext(os.path.basename(o["glb"]))[0]
    o["out"] = o["out"] or os.path.join(HERE, "..", "render", o["name"])
    return o


# ------------------------------------------------------------------ character
def import_character(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [ob for ob in bpy.data.objects if ob not in before]
    root = bpy.data.objects.new("Karakter", None)
    bpy.context.scene.collection.objects.link(root)
    for ob in new:
        if ob.parent is None:
            ob.parent = root
    arm = next((ob for ob in new if ob.type == "ARMATURE"), None)
    # the glTF importer adds bone display shapes (e.g. "Icosphere"): not part of the character
    shapes = {pb.custom_shape for ob in new if ob.type == "ARMATURE" for pb in ob.pose.bones if pb.custom_shape}
    for ob in shapes:
        new.remove(ob)
        bpy.data.objects.remove(ob, do_unlink=True)
    return root, new, arm


def mesh_bbox(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    lo = Vector((1e9, 1e9, 1e9))
    hi = -lo
    for ob in objs:
        if ob.type != "MESH" or ob.hide_render:
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        mw = ev.matrix_world
        for v in me.vertices:
            p = mw @ v.co
            lo = Vector(map(min, lo, p))
            hi = Vector(map(max, hi, p))
        ev.to_mesh_clear()
    return lo, hi


def normalize(root, objs, height):
    bpy.context.view_layer.update()
    lo, hi = mesh_bbox(objs)
    h = hi.z - lo.z
    s = 1.0
    if height:
        s = height / h
    elif h < 0.3 or h > 4.0:
        s = 1.8 / h
    root.scale = (s, s, s)
    bpy.context.view_layer.update()
    lo, hi = mesh_bbox(objs)
    root.location -= Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    bpy.context.view_layer.update()
    return mesh_bbox(objs)


def clean_name(act, arm):
    """the glTF importer names actions "<animation>_<armature object>"; drop that suffix"""
    for suf in ("_" + arm.name, "_" + arm.name.split(".")[0]):
        if act.name.endswith(suf):
            return act.name[:-len(suf)]
    return act.name


def char_actions(arm):
    if arm is None:
        return []
    acts = [a for a in bpy.data.actions if any(fc.data_path.startswith("pose.bones") for fc in a.fcurves)]
    names = {b.name for b in arm.pose.bones}
    out = []
    for a in acts:
        bones = {fc.data_path.split('"')[1] for fc in a.fcurves if fc.data_path.startswith("pose.bones")}
        if bones & names:
            out.append(a)
    return out


# ------------------------------------------------------------------ studio turnaround
def studio(lo, hi, samples):
    sc = bpy.context.scene
    h = hi.z - lo.z
    rxy = max(Vector((x, y, 0)).length for x in (lo.x, hi.x) for y in (lo.y, hi.y))
    rig = bpy.data.objects.new("Studio_Rig", None)
    sc.collection.objects.link(rig)
    made = [rig]
    # backdrop: floor + curved wall behind (rotates with the camera)
    import bmesh
    bm = bmesh.new()
    prof = []
    R = 1.2 * h
    for k in range(13):
        if k == 0:
            prof.append((-6 * h, 0.0))
        elif k <= 1:
            prof.append((1.2 * h, 0.0))
        else:
            a = (k - 1) / 11 * math.pi / 2
            prof.append((1.2 * h + R * math.sin(a), R - R * math.cos(a)))
    prof.append((1.2 * h + R, 5 * h))
    rows = []
    for x in (-6 * h, 6 * h):
        rows.append([bm.verts.new((x, y, z)) for y, z in prof])
    for k in range(len(prof) - 1):
        bm.faces.new((rows[0][k], rows[0][k + 1], rows[1][k + 1], rows[1][k]))
    me = bpy.data.meshes.new("Fon")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    m = bpy.data.materials.new("Fon_Mat")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*ENV.lin("#E9EDF0"), 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    me.materials.append(m)
    fon = bpy.data.objects.new("Fon", me)
    sc.collection.objects.link(fon)
    fon.parent = rig
    made.append(fon)
    for name, loc, energy, size, col in (("Ana_Isik", (-2.0, -2.6, 2.4), 230, 1.6, "#FFF1DE"),
                                         ("Dolgu_Isik", (2.6, -2.2, 1.3), 70, 2.5, "#DDE8FF"),
                                         ("Kontur_Isik", (1.0, 2.6, 2.6), 260, 1.2, "#FFFFFF")):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy * (h / 1.8) ** 2
        ld.size = size * h / 1.8
        ld.color = ENV.lin(col)
        lo_ = bpy.data.objects.new(name, ld)
        lo_.location = Vector(loc) * (h / 1.8)
        tgt = Vector((0, 0, 0.6 * h))
        lo_.rotation_euler = (tgt - lo_.location).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(lo_)
        lo_.parent = rig
        made.append(lo_)
    cd = bpy.data.cameras.new("Studio_Kamera")
    cd.lens = 70
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 24
    cam = bpy.data.objects.new("Studio_Kamera", cd)
    sc.collection.objects.link(cam)
    vh = math.atan(12 / 70)
    hh = math.atan(12 * (1080 / 1350) / 70)
    D = max(0.56 * h / math.tan(vh), 1.08 * rxy / math.tan(hh)) + rxy
    cam.location = (0, -D, 0.52 * h)
    cam.rotation_euler = (math.pi / 2, 0, 0)
    cam.parent = rig
    made.append(cam)
    sc.camera = cam
    w = bpy.data.worlds.new("Studio")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (*ENV.lin("#DCE2E7"), 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.3
    sc.world = w
    ENV.setup_render(int(samples), (1080, 1350))
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0
    return rig, made


def turnaround(o, root, objs, arm, lo, hi):
    os.makedirs(o["out"], exist_ok=True)
    if arm:
        arm.data.pose_position = "REST"
    rig, made = studio(lo, hi, o["samples"])
    sc = bpy.context.scene
    paths = []
    for tag, ang in (("on", 0), ("34", 45), ("yan", 90), ("arka", 180)):
        rig.rotation_euler = (0, 0, math.radians(ang))
        p = os.path.join(o["out"], "%s_%s.png" % (o["name"], tag))
        sc.render.image_settings.file_format = "PNG"
        sc.render.filepath = p
        bpy.ops.render.render(write_still=True)
        paths.append(p)
    ff = shutil.which("ffmpeg")
    if ff:
        sheet = os.path.join(o["out"], "%s_donus_tablosu.png" % o["name"])
        cmd = [ff, "-y", "-loglevel", "error"]
        for p in paths:
            cmd += ["-i", p]
        cmd += ["-filter_complex", "hstack=inputs=4,scale=2160:-1", sheet]
        subprocess.run(cmd, check=False)
    for ob in made:
        bpy.data.objects.remove(ob, do_unlink=True)
    if arm:
        arm.data.pose_position = "POSE"


# ------------------------------------------------------------------ clips on the set
def anim_bbox(arm, objs, f0, f1):
    sc = bpy.context.scene
    lo = Vector((1e9, 1e9, 1e9))
    hi = -lo
    step = max(1, (f1 - f0) // 12)
    for f in list(range(f0, f1 + 1, step)) + [f1]:
        sc.frame_set(f)
        a, b = mesh_bbox(objs)
        lo = Vector(map(min, lo, a))
        hi = Vector(map(max, hi, b))
    return lo, hi


def clips(o, root, objs, arm):
    acts = char_actions(arm)
    if not acts:
        print("[render_glb] animasyon yok, klip atlandı")
        return
    sc = bpy.context.scene
    for ob in [x for x in bpy.data.objects if x not in objs and x is not root]:
        bpy.data.objects.remove(ob, do_unlink=True)
    if o["env"]:
        ENV.build(clear=False)
        root.location += Vector((0, -2.4, ENV.DECK_Z))
        for c in [x for x in bpy.data.objects if x.type == "CAMERA"]:
            bpy.data.objects.remove(c, do_unlink=True)
    else:
        ENV.build_world()
    ENV.setup_render(int(o["anim_samples"]), (540, 960))
    sc.render.use_persistent_data = True
    sc.render.fps = 24
    cd = bpy.data.cameras.new("Klip_Kamera")
    cd.lens = 38
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 24
    cam = bpy.data.objects.new("Klip_Kamera", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    arm.data.pose_position = "POSE"
    ad = arm.animation_data_create()
    for t in ad.nla_tracks:
        t.mute = True
    want = [x for x in o["actions"].split(",") if x]
    if want:
        acts = sorted([a for a in acts if clean_name(a, arm) in want], key=lambda a: want.index(clean_name(a, arm)))
    loops = set(x for x in o["loops"].split(",") if x)
    water = set(x for x in o["water"].split(",") if x)
    lifts = {x.split(":")[0]: [float(v) for v in x.split(":")[1:]] for x in o["lift"].split(",") if x}
    base = root.location.copy()
    for act in acts:
        nm = clean_name(act, arm)
        ad.action = act
        f0, f1 = int(act.frame_range[0]), int(act.frame_range[1])
        f1 = min(f1, f0 + int(o["max_frames"]) - 1)
        sc.frame_start, sc.frame_end = f0, f1
        if root.animation_data:
            root.animation_data_clear()
        root.location = base
        chest = None
        if nm in water:   # swim beside the dock: chest just under the water line, head above it
            root.location = Vector((2.7, -3.4, 0.0))
            pb = arm.pose.bones.get("DEF-spine.003") or arm.pose.bones[0]
            pts = []
            for f in range(f0, f1 + 1, max(1, (f1 - f0) // 12)):
                sc.frame_set(f)
                pts.append(arm.matrix_world @ pb.head)
            chest = sum(pts, Vector()) / len(pts)
            root.location.z -= chest.z + 0.06
            chest.z = -0.06
        elif nm in lifts:  # in-place jump: sine arc over the airborne frames, feet never below the deck
            a0, a1, hgt = lifts[nm]
            low = {}
            for f in range(f0, f1 + 1):
                sc.frame_set(f)
                low[f] = mesh_bbox(objs)[0].z
            for f in range(f0, f1 + 1):
                arc = hgt * math.sin(math.pi * (f - a0) / (a1 - a0)) if a0 <= f <= a1 else 0.0
                root.location = base + Vector((0, 0, max(arc, base.z - low[f])))
                root.keyframe_insert("location", index=2, frame=f)
        lo, hi = anim_bbox(arm, objs, f0, f1)
        c = (lo + hi) / 2
        floor = base.z if nm not in water else min(lo.z, 0.0)
        hgt = hi.z - min(lo.z, floor)
        wid = max(hi.x - lo.x, hi.y - lo.y)
        vh = math.atan(12 / cd.lens)
        hh = math.atan(12 * (540 / 960) / cd.lens)
        D = max(0.62 * hgt / math.tan(vh), 0.62 * wid / math.tan(hh), 2.0)
        d = Vector((0.42, -1.0, 0.16)).normalized()
        tgt = Vector((c.x, c.y, min(lo.z, floor) + 0.5 * hgt))
        if chest is not None:   # swimmers: closer, looking down onto the water
            d = Vector((0.5, -1.0, 0.6)).normalized()
            D = 3.4
            tgt = chest + Vector((0, -0.25, 0.1))
        cam.location = tgt + d * D
        cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
        safe = "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in nm)
        tmp = os.path.join(o["out"], "_tmp_%s_" % safe)
        sc.render.filepath = tmp
        sc.render.image_settings.file_format = "FFMPEG"
        sc.render.ffmpeg.format = "MPEG4"
        sc.render.ffmpeg.codec = "H264"
        sc.render.ffmpeg.constant_rate_factor = "MEDIUM"
        sc.render.ffmpeg.ffmpeg_preset = "GOOD"
        bpy.ops.render.render(animation=True)
        made = sorted(glob.glob(tmp + "*"))
        if made:
            dst = os.path.join(o["out"], "%s_%s.mp4" % (o["name"], safe))
            n = math.ceil(o["loop_min"] * sc.render.fps / (f1 - f0 + 1)) if nm in loops else 1
            if n > 1 and shutil.which("ffmpeg"):
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", str(n - 1), "-i", made[-1],
                                "-c", "copy", dst], check=False)
                os.remove(made[-1])
            else:
                shutil.move(made[-1], dst)
        print("[render_glb] klip:", nm, f0, f1)


def main():
    o = args()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    root, objs, arm = import_character(o["glb"])
    if arm:
        if arm.animation_data:
            arm.animation_data.action = None
            for t in arm.animation_data.nla_tracks:
                t.mute = True
        arm.data.pose_position = "REST"
    lo, hi = normalize(root, objs, o["height"])
    print("[render_glb] boy %.3f m" % (hi.z - lo.z))
    if o["turn"]:
        turnaround(o, root, objs, arm, lo, hi)
    if o["anim"]:
        clips(o, root, objs, arm)


if __name__ == "__main__":
    main()
