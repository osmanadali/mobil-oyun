"""Placeholder capsule mannequin (A-pose, skinned, 2 actions) to test render_glb.py. Not a game asset.

  blender -b -P make_test_mannequin.py -- out.glb
"""
import bpy, bmesh, sys, math
from mathutils import Vector, Matrix, Quaternion

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/mankenn.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

A = math.radians(35)
B = {  # name: (head, tail, parent, radius)
    "Hips": ((0, 0, 0.95), (0, 0, 1.05), None, 0.15),
    "Spine": ((0, 0, 1.05), (0, 0, 1.25), "Hips", 0.14),
    "Chest": ((0, 0, 1.25), (0, 0, 1.45), "Spine", 0.16),
    "Neck": ((0, 0, 1.45), (0, 0, 1.55), "Chest", 0.05),
    "Head": ((0, 0, 1.55), (0, 0, 1.80), "Neck", 0.11),
}
for s, n in ((1, "Left"), (-1, "Right")):
    sh = Vector((s * 0.19, 0, 1.42))
    d = Vector((s * math.cos(A), 0, -math.sin(A)))
    B[n + "UpperArm"] = (tuple(sh), tuple(sh + d * 0.28), "Chest", 0.05)
    B[n + "LowerArm"] = (tuple(sh + d * 0.28), tuple(sh + d * 0.53), n + "UpperArm", 0.04)
    B[n + "Hand"] = (tuple(sh + d * 0.53), tuple(sh + d * 0.70), n + "LowerArm", 0.035)
    B[n + "UpperLeg"] = ((s * 0.09, 0, 0.92), (s * 0.10, 0, 0.50), "Hips", 0.075)
    B[n + "LowerLeg"] = ((s * 0.10, 0, 0.50), (s * 0.10, 0.01, 0.09), n + "UpperLeg", 0.055)
    B[n + "Foot"] = ((s * 0.10, 0.01, 0.09), (s * 0.10, -0.16, 0.03), n + "LowerLeg", 0.045)

ad = bpy.data.armatures.new("Iskelet")
arm = bpy.data.objects.new("Iskelet", ad)
sc.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for n, (h, t, p, r) in B.items():
    eb = ad.edit_bones.new(n)
    eb.head, eb.tail = h, t
    if p:
        eb.parent = ad.edit_bones[p]
bpy.ops.object.mode_set(mode="OBJECT")

bm = bmesh.new()
groups = []
for gi, (n, (h, t, p, r)) in enumerate(B.items()):
    h, t = Vector(h), Vector(t)
    L = (t - h).length
    M = Matrix.Translation((h + t) / 2) @ (t - h).to_track_quat("Z", "Y").to_matrix().to_4x4() @ \
        Matrix.Diagonal((r, r * (0.8 if n == "Hips" or n == "Chest" else 1), L / 2 + r * 0.6, 1))
    vs = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0, matrix=M)["verts"]
    groups.append((n, [v.index for v in vs] if False else vs))
bm.verts.index_update()
idx = {n: [v.index for v in vs] for n, vs in groups}
me = bpy.data.meshes.new("Manken")
bm.to_mesh(me)
bm.free()
mt = bpy.data.materials.new("Manken_Gri")
mt.use_nodes = True
mt.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.55, 0.58, 0.62, 1)
me.materials.append(mt)
for p in me.polygons:
    p.use_smooth = True
ob = bpy.data.objects.new("Manken", me)
sc.collection.objects.link(ob)
for n, ids in idx.items():
    ob.vertex_groups.new(name=n).add(ids, 1.0, "REPLACE")
ob.parent = arm
ob.modifiers.new("Armature", "ARMATURE").object = arm


def key(frame, rots):
    """rots: bone -> (axis, deg) list in armature space (parent-relative)."""
    for pb in arm.pose.bones:
        R = Matrix.Identity(3)
        for ax, deg in rots.get(pb.name, []):
            R = Matrix.Rotation(math.radians(deg), 3, ax) @ R
        Bm = pb.bone.matrix_local.to_3x3()
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (Bm.inverted() @ R @ Bm).to_quaternion()
        pb.keyframe_insert("rotation_quaternion", frame=frame)
    hb = arm.pose.bones["Hips"]
    hb.keyframe_insert("location", frame=frame)


def act(name):
    a = bpy.data.actions.new(name)
    arm.animation_data_create().action = a
    return a


acts = []
a = act("Bekleme")
for f in range(1, 50, 4):
    ph = 2 * math.pi * (f - 1) / 48
    br = 2.0 * math.sin(ph)
    key(f, {"Chest": [("X", -br)], "Head": [("X", br)],
            "LeftUpperArm": [("Y", 45 + br)], "RightUpperArm": [("Y", -45 - br)],
            "LeftLowerArm": [("Z", -10)], "RightLowerArm": [("Z", 10)]})
acts.append(a)
a = act("Kosu")
for f in range(1, 18, 2):
    ph = 2 * math.pi * (f - 1) / 16
    s = math.sin(ph)
    arm.pose.bones["Hips"].location = (0, 0.03 * abs(math.cos(ph)), 0)
    key(f, {"Spine": [("X", 10)],
            "LeftUpperLeg": [("X", -35 * s)], "RightUpperLeg": [("X", 35 * s)],
            "LeftLowerLeg": [("X", 45 + 40 * max(0, s))], "RightLowerLeg": [("X", 45 + 40 * max(0, -s))],
            "LeftUpperArm": [("Y", 50), ("X", 35 * s)], "RightUpperArm": [("Y", -50), ("X", -35 * s)],
            "LeftLowerArm": [("X", -80)], "RightLowerArm": [("X", -80)]})
acts.append(a)
ad_ = arm.animation_data
for a in acts:
    tr = ad_.nla_tracks.new()
    tr.name = a.name
    tr.strips.new(a.name, 1, a)
ad_.action = None

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_animation_mode="ACTIONS")
print("[manken] yazıldı:", out)
