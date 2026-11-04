"""AI-generated character mesh -> textured, rigged, animated game character (Blender 4.2, headless).

Usage (from oyunlar/ada/3d):
  $B -b -P scripts/rig_character.py -- --char kerem [--stages prep,texture,rig,anim] [--work DIR]
        [--ual1 animasyon_ual/AnimationLibrary_Godot_Standard.glb] [--ual2 animasyon_ual/UAL2_Standard.glb]

Stages (each saves a .blend in --work so later stages can be re-run alone):
  prep     raw Hunyuan mesh -> one clean shell, ~32k tris, real height, feet on z=0, facing -Y
  texture  smart UV + projection of the reference views (front/back/both sides) -> 2048^2 base color
  rig      fit the Quaternius UAL skeleton to mesh landmarks; bind in A-pose, convert mesh to T-pose,
           re-bind to the original-orientation T-pose skeleton
  anim     bring in the UAL actions (UAL2 retargeted by bone name), export <char>.glb
"""
import bpy, bmesh, sys, os, math, time
import numpy as np
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))           # oyunlar/ada/3d
REF = os.path.normpath(os.path.join(ROOT, "..", "referans", "gorunumler"))

CHARS = {
    # side: which side of the character the "yan" reference view shows
    "kerem": dict(raw="ham/kerem_sekil_hunyuan2.glb", height=1.84, side="left", tris=32000),
    "deniz": dict(raw="ham/deniz_sekil_hunyuan2.glb", height=1.70, side="right", tris=34000),
}
TEX = 2048


def log(*a):
    print("[rig]", *a, flush=True)


def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = dict(char=None, stages="prep,texture,rig,anim", work=None,
             ual1=os.path.join(ROOT, "animasyon_ual", "AnimationLibrary_Godot_Standard.glb"),
             ual2=os.path.join(ROOT, "animasyon_ual", "UAL2_Standard.glb"), out=None)
    for i in range(0, len(a), 2):
        o[a[i].lstrip("-")] = a[i + 1]
    o["work"] = o["work"] or os.path.join("/tmp", "rig_" + o["char"])
    o["out"] = o["out"] or os.path.join(ROOT, o["char"] + ".glb")
    os.makedirs(o["work"], exist_ok=True)
    return o


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mesh_np(me):
    co = np.empty(len(me.vertices) * 3, np.float64)
    me.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [ob for ob in bpy.data.objects if ob not in before]


# =================================================================== prep
def stage_prep(c, o):
    reset()
    new = import_glb(os.path.join(ROOT, c["raw"]))
    meshes = [ob for ob in new if ob.type == "MESH"]
    for ob in meshes:
        mw = ob.matrix_world.copy()
        ob.parent = None
        ob.matrix_world = mw
    for ob in new:
        if ob.type != "MESH":
            bpy.data.objects.remove(ob, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = o["char"]
    ob.data.name = o["char"]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    # floaters: keep connected parts with >= 2% of the vertices
    bm.verts.ensure_lookup_table()
    seen = set()
    parts = []
    for v in bm.verts:
        if v.index in seen:
            continue
        stack, comp = [v], []
        seen.add(v.index)
        while stack:
            x = stack.pop()
            comp.append(x)
            for e in x.link_edges:
                y = e.other_vert(x)
                if y.index not in seen:
                    seen.add(y.index)
                    stack.append(y)
        parts.append(comp)
    big = max(len(p) for p in parts)
    drop = [v for p in parts if len(p) < 0.02 * big for v in p]
    bmesh.ops.delete(bm, geom=drop, context="VERTS")
    log("parts", len(parts), "dropped verts", len(drop))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()

    # real height, feet on floor, centred on the head/legs axis
    V = mesh_np(ob.data)
    s = c["height"] / (V[:, 2].max() - V[:, 2].min())
    V *= s
    V[:, 2] -= V[:, 2].min()
    H = V[:, 2].max()
    head = V[V[:, 2] > 0.9 * H]
    tor = V[np.abs(V[:, 2] - 0.62 * H) < 0.04 * H]
    tor = tor[np.abs(tor[:, 0] - np.median(head[:, 0])) < 0.12 * H]
    V[:, 0] -= (head[:, 0].min() + head[:, 0].max()) / 2
    V[:, 1] -= (tor[:, 1].min() + tor[:, 1].max()) / 2
    ob.data.vertices.foreach_set("co", V.ravel())
    ob.data.update()

    ntri = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    m = ob.modifiers.new("Dec", "DECIMATE")
    m.decimate_type = "COLLAPSE"
    m.ratio = min(1.0, c["tris"] / ntri)
    m.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    for p in ob.data.polygons:
        p.use_smooth = True
    log("tris %d -> %d, height %.3f" % (ntri, len(ob.data.polygons), H))
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o["work"], "prep.blend"))


# =================================================================== landmarks
def segments(xs, gap):
    """split sorted 1D coordinates into runs separated by gaps > gap"""
    xs = np.sort(xs)
    cut = np.where(np.diff(xs) > gap)[0]
    return [(r[0], r[-1]) for r in np.split(xs, cut + 1)]


def landmarks(V, bvh, tw=0.74, te=0.42):
    """joint positions of an A-pose (or T-pose) humanoid mesh facing -Y, feet on z=0, centred at x=0"""
    H = V[:, 2].max()
    L = dict(H=H)
    slab = lambda z, t=0.006: V[np.abs(V[:, 2] - z) < t * H]
    # neck: narrowest section between shoulders and head
    zs = np.linspace(0.78 * H, 0.93 * H, 40)
    wd = []
    for z in zs:
        s = slab(z)
        s = s[np.abs(s[:, 0]) < 0.1 * H]
        wd.append(s[:, 0].max() - s[:, 0].min() if len(s) else 9)
    L["neck_z"] = zs[int(np.argmin(wd))]
    # crotch: lowest hit of upward rays between the legs
    tor = slab(0.55 * H, 0.02)
    tor = tor[np.abs(tor[:, 0]) < 0.08 * H]
    yc = (tor[:, 1].min() + tor[:, 1].max()) / 2
    hits = []
    for dy in np.linspace(-0.04, 0.04, 9) * H:
        h = bvh.ray_cast(Vector((0, yc + dy, 0.2 * H)), Vector((0, 0, 1)), H)
        if h[0] is not None:
            hits.append(h[0].z)
    L["crotch_z"] = min(hits)
    gap = 0.012 * H
    for side, sg in (("L", 1), ("R", -1)):
        # ---- arm: outermost x-segment while it is separate from the torso
        arm_pts, z_pit = [], None
        for z in np.arange(0.30 * H, 0.82 * H, 0.004 * H):
            s = slab(z, 0.003)
            s = s[s[:, 0] * sg > 0]
            if len(s) < 3:
                continue
            segs = segments(s[:, 0] * sg, gap)
            if len(segs) >= 2 and segs[-1][0] > 0.12 * H:
                lo_, hi_ = segs[-1]
                pts = s[(s[:, 0] * sg >= lo_ - 1e-9) & (s[:, 0] * sg <= hi_ + 1e-9)]
                arm_pts.append(pts)
                z_pit = z
            elif z_pit is not None and z > 0.6 * H:
                break
        A = np.concatenate(arm_pts)
        top = A[A[:, 2] > z_pit - 0.06 * H]          # upper arm just below the armpit
        c_up = top.mean(0)
        r_up = (top[:, 0].max() - top[:, 0].min()) / 2 * 0.5 + (top[:, 1].max() - top[:, 1].min()) / 2 * 0.5
        cen = A.mean(0)
        u, sv, vt = np.linalg.svd(A - cen)
        ax = vt[0] * np.sign(vt[0][2])                 # pointing up
        T = A[np.argmin((A - cen) @ ax)]               # fingertip: farthest down the axis
        # shoulder joint: on the upper-arm axis, one arm radius below the top of the shoulder
        S = c_up.copy()
        for _ in range(3):
            near = V[(np.abs(V[:, 0] - S[0]) < 0.012 * H) & (np.abs(V[:, 1] - c_up[1]) < 0.05 * H)
                     & (V[:, 2] < L["neck_z"])]
            ztop = near[:, 2].max()
            zS = ztop - r_up * 1.05
            S = c_up + ax * (zS - c_up[2]) / ax[2]
        # centreline from S to T: centroids of thin slabs perpendicular to the axis
        dST = (T - S) / np.linalg.norm(T - S)
        A2 = A

        def centre(t):
            p = S + (T - S) * t
            sl = A2[np.abs((A2 - p) @ dST) < 0.006 * H]
            sl = sl[np.linalg.norm((sl - p) - np.outer((sl - p) @ dST, dST), axis=1) < 0.05 * H]
            return (sl.min(0) + sl.max(0)) / 2 if len(sl) > 5 else p
        L["arm" + side] = dict(S=S, E=centre(te), W=centre(tw), T=T, pit=z_pit, r=r_up,
                               hand0=S + (T - S) * min(1, tw + 0.03))
        # ---- leg
        lg = lambda z: (lambda s: s[s[:, 0] * sg > 0.005 * H])(slab(z, 0.01))
        def legsec(z):
            s = lg(z)
            lo_, hi_ = segments(s[:, 0] * sg, gap)[0]
            return s[(s[:, 0] * sg >= lo_ - 1e-9) & (s[:, 0] * sg <= hi_ + 1e-9)]
        mid = lambda s: (s.min(0) + s.max(0)) / 2
        ank_z = 0.055 * H
        knee_z0 = 0.285 * H
        up = legsec(L["crotch_z"] - 0.05 * H)
        kn = legsec(knee_z0)
        c1, c2 = mid(up), mid(kn)
        hip_z = max(L["crotch_z"] + 0.05 * H, 0.49 * H)
        hip = c1 + (c2 - c1) * (hip_z - c1[2]) / (c2[2] - c1[2])
        an = mid(legsec(ank_z + 0.03 * H))
        ank = np.array([an[0], an[1], ank_z])
        knee_z = ank_z + 0.51 * (hip_z - ank_z)
        kn = mid(legsec(knee_z))
        knee = np.array([kn[0], kn[1], knee_z])
        foot = V[(V[:, 2] < 0.06 * H) & (V[:, 0] * sg > 0)]
        tip = foot[np.argmin(foot[:, 1])]
        ball_y = ank[1] + 0.62 * (tip[1] - ank[1])
        fb = foot[np.abs(foot[:, 1] - ball_y) < 0.01 * H]
        ball = np.array([(fb[:, 0].min() + fb[:, 0].max()) / 2, ball_y, 0.008 * H])
        toe = np.array([ball[0], tip[1], 0.008 * H])
        L["leg" + side] = dict(hip=hip, knee=knee, ank=ank, ball=ball, toe=toe)
    return L


def torso_mid_y(V, z, H):
    s = V[np.abs(V[:, 2] - z) < 0.008 * H]
    s = s[np.abs(s[:, 0]) < 0.06 * H]
    return (s[:, 1].min() + s[:, 1].max()) / 2 if len(s) else 0.0


# =================================================================== texture
VIEWS = {  # toward-camera direction d, image-right direction r (image up = +Z)
    "front": ((0, -1, 0), (1, 0, 0)),
    "back": ((0, 1, 0), (-1, 0, 0)),
    "left": ((1, 0, 0), (0, 1, 0)),     # camera on the character's left (+X)
    "right": ((-1, 0, 0), (0, -1, 0)),  # camera on the character's right (-X)
}


def load_rgb(path, mirror=False):
    im = bpy.data.images.load(path)
    w, h = im.size
    px = np.empty(w * h * 4, np.float32)
    im.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)[::-1, :, :3].copy()   # row 0 = top
    bpy.data.images.remove(im)
    return px[:, ::-1].copy() if mirror else px


def shift(a, dy, dx, fill):
    out = np.full_like(a, fill)
    h, w = a.shape[:2]
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    out[yd, xd] = a[ys, xs]
    return out


def dilate(m, n=1):
    for _ in range(n):
        m = m | shift(m, 1, 0, False) | shift(m, -1, 0, False) | shift(m, 0, 1, False) | shift(m, 0, -1, False)
    return m


def char_mask(img):
    """character = everything not connected to the border through near-white pixels"""
    white = img.min(axis=2) > 0.9
    bg = np.zeros_like(white)
    bg[0, :] = bg[-1, :] = bg[:, 0] = bg[:, -1] = True
    bg &= white
    for _ in range(4000):
        nb = dilate(bg, 4) & white
        if nb.sum() == bg.sum():
            break
        bg = nb
    return ~bg


def rasterize_uv(me, W):
    me.calc_loop_triangles()
    nt = len(me.loop_triangles)
    tl = np.empty(nt * 3, np.int32)
    me.loop_triangles.foreach_get("loops", tl)
    tv = np.empty(nt * 3, np.int32)
    me.loop_triangles.foreach_get("vertices", tv)
    uv = np.empty(len(me.loops) * 2, np.float64)
    me.uv_layers.active.data.foreach_get("uv", uv)
    uv = uv.reshape(-1, 2)
    co = mesh_np(me)
    vn = np.empty(len(me.vertices) * 3, np.float64)
    me.vertices.foreach_get("normal", vn)
    vn = vn.reshape(-1, 3)
    TU = uv[tl].reshape(nt, 3, 2) * W - 0.5
    TP = co[tv].reshape(nt, 3, 3)
    TN = vn[tv].reshape(nt, 3, 3)
    pos = np.zeros((W, W, 3), np.float32)
    nor = np.zeros((W, W, 3), np.float32)
    cov = np.zeros((W, W), bool)
    lo = np.floor(TU.min(axis=1) - 0.5).astype(int).clip(0, W - 1)
    hi = np.ceil(TU.max(axis=1) + 0.5).astype(int).clip(0, W - 1)
    eps = 0.02
    for t in range(nt):
        a, b, cc = TU[t]
        v0, v1 = b - a, cc - a
        d = v0[0] * v1[1] - v1[0] * v0[1]
        if abs(d) < 1e-10:
            continue
        xs = np.arange(lo[t, 0], hi[t, 0] + 1)
        ys = np.arange(lo[t, 1], hi[t, 1] + 1)
        X, Y = np.meshgrid(xs, ys)
        px, py = X - a[0], Y - a[1]
        l1 = (px * v1[1] - v1[0] * py) / d
        l2 = (v0[0] * py - px * v0[1]) / d
        l0 = 1 - l1 - l2
        m = (l0 >= -eps) & (l1 >= -eps) & (l2 >= -eps)
        if not m.any():
            continue
        L = np.stack([l0[m], l1[m], l2[m]], 1).clip(0, 1)
        L /= L.sum(1, keepdims=True)
        yy, xx = Y[m], X[m]
        pos[yy, xx] = L @ TP[t]
        nn = L @ TN[t]
        nor[yy, xx] = nn / np.linalg.norm(nn, axis=1, keepdims=True).clip(1e-9)
        cov[yy, xx] = True
    return pos, nor, cov


def silhouette(bvh, d, r, lo_u, hi_u, H, cell):
    d, r = Vector(d), Vector(r)
    us = np.arange(lo_u, hi_u, cell)
    zs = np.arange(-0.02, H + 0.02, cell)
    far = 5.0
    U, Z = [], []
    for z in zs:
        for u in us:
            p = r * u + Vector((0, 0, z)) + d * far
            if bvh.ray_cast(p, -d, 2 * far)[0] is not None:
                U.append(u)
                Z.append(z)
    return np.array(U), np.array(Z)


def fit_view(mask, U, Z, cell):
    rows = np.where(mask.any(1))[0]
    cols = np.where(mask.any(0))[0]
    H = Z.max() - Z.min()
    s0 = (rows[-1] - rows[0] + 1) / (H + cell)
    b0 = rows[-1] + 1 + s0 * (Z.min() - cell / 2)
    a0 = (cols[0] + cols[-1] + 1) / 2 - s0 * (U.min() + U.max()) / 2
    hgt, wid = mask.shape
    nmask = mask.sum()

    def score(p):
        s, k, a, b = p
        ix = np.floor(a + s * k * U).astype(int)
        iy = np.floor(b - s * Z).astype(int)
        ok = (ix >= 0) & (ix < wid) & (iy >= 0) & (iy < hgt)
        inter = mask[iy[ok], ix[ok]].sum()
        rc = nmask / (s * s * k * cell * cell)
        return inter / (len(U) + rc - inter)

    p = np.array([s0, 1.0, a0, b0])
    best = score(p)
    steps = np.array([0.02 * s0, 0.02, 8.0, 8.0])
    for _ in range(7):
        improved = True
        while improved:
            improved = False
            for i in range(4):
                for sg in (-1, 1):
                    q = p.copy()
                    q[i] += sg * steps[i]
                    if i == 1 and abs(q[1] - 1) > 0.06:
                        continue
                    sc = score(q)
                    if sc > best:
                        best, p, improved = sc, q, True
        steps /= 2
    return p, best


def fit_head(mask, U, Z, cell, p, zcut):
    """refine scale/offset on the head only (the turnaround art's head is not where the global fit puts it)"""
    sel = Z > zcut
    U, Z = U[sel], Z[sel]
    hgt, wid = mask.shape
    csum = np.concatenate([[0], np.cumsum(mask.sum(1))])

    def score(q):
        s, k, a, b = q
        ix = np.floor(a + s * k * U).astype(int)
        iy = np.floor(b - s * Z).astype(int)
        ok = (ix >= 0) & (ix < wid) & (iy >= 0) & (iy < hgt)
        inter = mask[iy[ok], ix[ok]].sum()
        rc = csum[int(np.clip(b - s * zcut, 0, hgt))] / (s * s * k * cell * cell)
        return inter / (len(U) + rc - inter)

    p = p.copy()
    best = score(p)
    steps = np.array([0.02 * p[0], 0.0, 6.0, 6.0])
    for _ in range(6):
        improved = True
        while improved:
            improved = False
            for i in (0, 2, 3):
                for sg in (-1, 1):
                    q = p.copy()
                    q[i] += sg * steps[i]
                    sc = score(q)
                    if sc > best:
                        best, p, improved = sc, q, True
        steps /= 2
    return p, best


def bilinear(img, x, y):
    h, w = img.shape[:2]
    x = np.clip(x - 0.5, 0, w - 1.001)
    y = np.clip(y - 0.5, 0, h - 1.001)
    x0 = np.floor(x).astype(int)
    y0 = np.floor(y).astype(int)
    fx = (x - x0)[:, None]
    fy = (y - y0)[:, None]
    return (img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy)
            + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy)


def stage_texture(c, o):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(o["work"], "prep.blend"))
    ob = bpy.data.objects[o["char"]]
    me = ob.data
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    t0 = time.time()
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.003, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    W = TEX
    pos, nor, cov = rasterize_uv(me, W)
    log("uv+raster %.1fs, coverage %.1f%%" % (time.time() - t0, 100 * cov.mean()))

    V = mesh_np(me)
    H = V[:, 2].max()
    bvh = BVHTree.FromPolygons([tuple(v) for v in V], [tuple(p.vertices) for p in me.polygons])
    idx = np.where(cov.ravel())[0]
    P = pos.reshape(-1, 3)[idx].astype(np.float64)
    N = nor.reshape(-1, 3)[idx].astype(np.float64)
    other = {"left": "right", "right": "left"}[c["side"]]
    views = [("front", "on", False, 1.4), ("back", "arka", False, 1.0),
             (c["side"], "yan", False, 0.8), (other, "yan", True, 0.8)]
    LM = landmarks(V, bvh)
    zc = LM["neck_z"] - 0.01 * H
    th = np.clip((P[:, 2] - (zc - 0.02 * H)) / (0.04 * H), 0, 1)[:, None]   # 0 body .. 1 head
    hand = np.zeros(len(idx), bool)                                           # hands: front/back only
    for sd in ("L", "R"):
        a_ = LM["arm" + sd]
        S, T = a_["S"], a_["T"]
        dd = T - S
        t = (P - S) @ dd / (dd @ dd)
        lat = np.linalg.norm((P - S) - np.outer(t, dd), axis=1)
        h0 = (a_["hand0"] - S) @ dd / (dd @ dd)
        hand |= (t > h0) & (lat < 0.045 * H) & (np.sign(P[:, 0]) == np.sign(S[0]))
    log("hand texels", hand.sum(), "neck z %.3f" % LM["neck_z"])
    acc = np.zeros((len(idx), 3))
    wsum = np.zeros(len(idx))
    dbg = []
    for vname, img_name, mirror, gain in views:
        d, r = VIEWS[vname]
        img = load_rgb(os.path.join(REF, "%s_%s.png" % (o["char"], img_name)), mirror)
        mask = char_mask(img)
        cell = H / 280
        Vu = V @ np.array(r)
        U, Z = silhouette(bvh, d, r, Vu.min() - 0.02, Vu.max() + 0.02, H, cell)
        pb, iou = fit_view(mask, U, Z, cell)
        ph, iouh = fit_head(mask, U, Z, cell, pb, zc)
        log("view %-5s from %s%s: body s %.1f k %.3f a %.1f b %.1f IoU %.3f | head s %.1f a %.1f b %.1f IoU %.3f"
            % (vname, img_name, " (mirrored)" if mirror else "", *pb, iou, ph[0], ph[2], ph[3], iouh))
        dbg.append((vname, img, mask, U, Z, pb))
        valid = dilate(~mask, 3)  # erode the character mask: no white edge pixels
        valid = ~valid
        f = N @ np.array(d)
        cand = np.where((f > 0.06) & ~(hand & (vname in ("left", "right"))))[0]
        pp = pb[None, :] * (1 - th[cand]) + ph[None, :] * th[cand]
        px = pp[:, 2] + pp[:, 0] * pp[:, 1] * (P[cand] @ np.array(r))
        py = pp[:, 3] - pp[:, 0] * P[cand, 2]
        ix = np.clip(np.floor(px).astype(int), 0, mask.shape[1] - 1)
        iy = np.clip(np.floor(py).astype(int), 0, mask.shape[0] - 1)
        inm = valid[iy, ix]
        cand, px, py = cand[inm], px[inm], py[inm]
        # visibility toward the camera
        dv = Vector(d)
        org = P[cand] + N[cand] * 0.003 + np.array(d) * 0.001
        rc = bvh.ray_cast
        vis = np.fromiter((rc(Vector(p), dv, 10.0)[0] is None for p in org.tolist()), bool, len(cand))
        cand, px, py = cand[vis], px[vis], py[vis]
        col = bilinear(img, px, py)
        w = gain * f[cand] ** 6
        acc[cand] += col * w[:, None]
        wsum[cand] += w
        log("  %d texels painted (%.1fs)" % (len(cand), time.time() - t0))
    ok = wsum > 0
    col = np.zeros((len(idx), 3))
    col[ok] = acc[ok] / wsum[ok, None]
    # gaps (occluded from every camera): nearest painted texel on the surface
    bad = np.where(~ok)[0]
    log("unpainted texels: %d (%.2f%%)" % (len(bad), 100 * len(bad) / len(idx)))
    if len(bad):
        good = np.where(ok)[0][::3]
        kd = KDTree(len(good))
        for j, p in zip(good, P[good].tolist()):
            kd.insert(p, int(j))
        kd.balance()
        for j, p in zip(bad, P[bad].tolist()):
            col[j] = col[kd.find(p)[1]]
    tex = np.zeros((W * W, 3), np.float32)
    tex[idx] = col
    tex = tex.reshape(W, W, 3)
    filled = cov.copy()
    for _ in range(24):  # pad islands so bilinear/mip sampling never sees black
        sm = np.zeros_like(tex)
        cnt = np.zeros((W, W), np.float32)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            fm = shift(filled, dy, dx, False)
            sm += shift(tex, dy, dx, 0) * fm[..., None]
            cnt += fm
        grow = (~filled) & (cnt > 0)
        tex[grow] = sm[grow] / cnt[grow, None]
        filled |= grow
    tex[~filled] = col.mean(0)
    imname = o["char"] + "_renk"
    im = bpy.data.images.new(imname, W, W, alpha=False)
    rgba = np.ones((W, W, 4), np.float32)
    rgba[..., :3] = tex.clip(0, 1)
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw = os.path.join(o["work"], imname + ".png")
    im.file_format = "PNG"
    im.save()
    mat = bpy.data.materials.new(o["char"] + "_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tn = nt.nodes.new("ShaderNodeTexImage")
    tn.image = im
    nt.links.new(tn.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.75
    bsdf.inputs["Specular IOR Level"].default_value = 0.3
    me.materials.clear()
    me.materials.append(mat)
    save_fit_debug(dbg, o["work"])
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o["work"], "tex.blend"))
    log("texture done %.1fs" % (time.time() - t0))


def save_fit_debug(dbg, work):
    """reference images with the fitted mesh silhouette tinted on top (for checking alignment)"""
    tiles = []
    for vname, img, mask, U, Z, (s, k, a, b) in dbg:
        out = img.copy()
        ix = np.floor(a + s * k * U).astype(int)
        iy = np.floor(b - s * Z).astype(int)
        ok = (ix >= 0) & (ix < img.shape[1]) & (iy >= 0) & (iy < img.shape[0])
        sil = np.zeros(mask.shape, bool)
        sil[iy[ok], ix[ok]] = True
        sil = dilate(sil, 2)
        edge = sil & ~dilate(~sil, 1) if False else sil ^ dilate(sil, 2)
        out[sil & ~mask] = out[sil & ~mask] * 0.4 + np.array([0.0, 0.4, 1.0]) * 0.6
        out[mask & ~sil] = out[mask & ~sil] * 0.4 + np.array([1.0, 0.0, 0.0]) * 0.6
        out[edge] = (0, 0.8, 0)
        tiles.append(out[::2, ::2])
    sheet = np.concatenate(tiles, 1)
    h, w = sheet.shape[:2]
    im = bpy.data.images.new("fitdbg", w, h, alpha=False)
    rgba = np.ones((h, w, 4), np.float32)
    rgba[..., :3] = sheet[::-1]
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw = os.path.join(work, "fit_debug.png")
    im.file_format = "PNG"
    im.save()


# =================================================================== main
def main():
    o = args()
    c = CHARS[o["char"]]
    for st in o["stages"].split(","):
        log("== stage", st)
        globals()["stage_" + st](c, o)


if __name__ == "__main__":
    main()
