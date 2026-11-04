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
    "deniz": dict(raw="ham/deniz_sekil_hunyuan2.glb", height=1.70, side="right", tris=34000, pony=True,
                  face_front=True, side_check=True),
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


def mesh_tris(me):
    me.calc_loop_triangles()
    F = np.empty(len(me.loop_triangles) * 3, np.int64)
    me.loop_triangles.foreach_get("vertices", F)
    return F.reshape(-1, 3)


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
class Sections:
    """exact plane sections of a triangle mesh, split into closed loops"""

    def __init__(self, V, F):
        self.V = V
        e = np.sort(np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]]), axis=1)
        self.E, inv = np.unique(e, axis=0, return_inverse=True)
        self.TE = inv.reshape(3, -1).T

    def cut(self, p0, n):
        d = (self.V - p0) @ n
        e0, e1 = self.E[:, 0], self.E[:, 1]
        cross = (d[e0] > 0) != (d[e1] > 0)
        t = d[e0] / np.where(cross, d[e0] - d[e1], 1)
        P = self.V[e0] + (self.V[e1] - self.V[e0]) * t[:, None]
        tc = cross[self.TE]
        sel = tc.sum(1) == 2
        pairs = self.TE[sel][tc[sel]].reshape(-1, 2)
        ids = np.where(cross)[0]
        par = {i: i for i in ids.tolist()}

        def find(i):
            while par[i] != i:
                par[i] = par[par[i]]
                i = par[i]
            return i
        for i, j in pairs.tolist():
            ri, rj = find(i), find(j)
            if ri != rj:
                par[ri] = rj
        groups = {}
        for i in ids.tolist():
            groups.setdefault(find(i), []).append(i)
        return [P[g] for g in groups.values() if len(g) >= 4]

    def hcut(self, z):
        return self.cut(np.array([0, 0, z]), np.array([0, 0, 1.0]))


def loop_info(L):
    lo, hi = L.min(0), L.max(0)
    return dict(c=L.mean(0), mid=(lo + hi) / 2, lo=lo, hi=hi, r=float(np.mean(hi[:2] - lo[:2]) / 2), P=L)


def torso_loop(sec, z):
    """the body's own section at height z (largest loop around x=0; not goggles, straps or hair strands)"""
    loops = [loop_info(L) for L in sec.hcut(z)]
    span = [l for l in loops if l["lo"][0] < 0 < l["hi"][0]]
    return max(span, key=lambda l: np.prod(l["hi"][:2] - l["lo"][:2])) if span else None


def landmarks(V, F, bvh, tw=0.74, te=0.42):
    """joint positions of an A-pose humanoid mesh facing -Y, feet on z=0, centred at x=0"""
    H = V[:, 2].max()
    sec = Sections(V, F)
    L = dict(H=H)
    # neck: narrowest torso section between shoulders and head
    zs = np.linspace(0.78 * H, 0.93 * H, 40)
    wd = [(lambda t: t["hi"][0] - t["lo"][0] if t else 9)(torso_loop(sec, z)) for z in zs]
    L["neck_z"] = zs[int(np.argmin(wd))]
    # crotch: lowest hit of upward rays between the legs
    tl = torso_loop(sec, 0.55 * H)
    yc = tl["mid"][1]
    hits = []
    for dy in np.linspace(-0.04, 0.04, 9) * H:
        h = bvh.ray_cast(Vector((0, yc + dy, 0.2 * H)), Vector((0, 0, 1)), H)
        if h[0] is not None:
            hits.append(h[0].z)
    L["crotch_z"] = min(hits)
    for side, sg in (("L", 1), ("R", -1)):
        # ---- arm: outermost loop on this side while it is separate from the torso
        arm, z_pit = [], None
        for z in np.arange(0.30 * H, 0.84 * H, 0.004 * H):
            loops = [loop_info(Lp) for Lp in sec.hcut(z)]
            side_l = [l for l in loops if l["lo"][0] * sg > 0 or l["hi"][0] * sg > 0]
            free = [l for l in side_l if not (l["lo"][0] < 0 < l["hi"][0]) and l["c"][0] * sg > 0.12 * H]
            if free and len(side_l) >= 2:
                l = max(free, key=lambda l: l["c"][0] * sg)
                arm.append((z, l))
                z_pit = z
            elif z_pit is not None and z > 0.6 * H:
                break
        up = [l for z, l in arm if z_pit - 0.12 * H < z < z_pit - 0.01 * H]
        C = np.array([l["c"] for l in up])
        cen = C.mean(0)
        ax = np.linalg.svd(C - cen)[2][0]
        ax = ax * np.sign(ax[2])                       # upper-arm axis, pointing up
        r_up = float(np.mean([l["r"] for l in up]))
        allp = np.array([l["c"] for z, l in arm])
        lows = [l for z, l in arm if z < arm[0][0] + 0.02 * H]
        T = min(lows, key=lambda l: l["lo"][2])["c"].copy()
        T[2] = arm[0][0] - 0.004 * H                   # fingertip: bottom of the lowest hand loop
        # shoulder joint: on the upper-arm axis, one arm radius below the top of the shoulder
        # shoulder joint: one arm radius inside the deltoid's outer surface, centred in the shoulder cap's
        # depth, one arm radius below the top of the shoulder
        S = cen + ax * ((z_pit + 0.04 * H) - cen[2]) / ax[2]
        for _ in range(4):
            tl = torso_loop(sec, S[2])
            Pp = tl["P"][tl["P"][:, 0] * sg > 0]
            x_out = (Pp[:, 0] * sg).max()
            sx = x_out - 1.15 * r_up
            cap = Pp[Pp[:, 0] * sg > sx]
            S = np.array([sg * sx, (cap[:, 1].min() + cap[:, 1].max()) / 2, S[2]])
            h = bvh.ray_cast(Vector((S[0], S[1], L["neck_z"])), Vector((0, 0, -1)), H)
            S[2] = (h[0].z if h[0] is not None else S[2] + r_up) - 1.1 * r_up
        # elbow / wrist: centres of sections perpendicular to the S->T line
        dST = (T - S) / np.linalg.norm(T - S)

        def centre(t):
            p = S + (T - S) * t
            loops = [loop_info(Lp) for Lp in sec.cut(p, dST)]
            return min(loops, key=lambda l: np.linalg.norm(l["c"] - p))["mid"] if loops else p
        L["arm" + side] = dict(S=S, E=centre(te), W=centre(tw), T=T, pit=np.array([z_pit]), r=np.array([r_up]),
                               hand0=S + (T - S) * min(1, tw + 0.03))
        # ---- leg: the innermost free loop on this side (hands hang further out)
        def leg(z):
            loops = [loop_info(Lp) for Lp in sec.hcut(z)]
            ls = [l for l in loops if l["c"][0] * sg > 0 and not (l["lo"][0] < 0 < l["hi"][0])]
            return min(ls, key=lambda l: l["c"][0] * sg)["mid"]
        ank_z = 0.055 * H
        hip_z = max(L["crotch_z"] + 0.05 * H, 0.49 * H)
        c1, c2 = leg(L["crotch_z"] - 0.05 * H), leg(0.285 * H)
        hip = c1 + (c2 - c1) * (hip_z - c1[2]) / (c2[2] - c1[2])
        an = leg(ank_z + 0.03 * H)
        ank = np.array([an[0], an[1], ank_z])
        knee_z = ank_z + 0.51 * (hip_z - ank_z)
        kn = leg(knee_z)
        knee = np.array([kn[0], kn[1], knee_z])
        foot = V[(V[:, 2] < 0.06 * H) & (V[:, 0] * sg > 0)]
        tip = foot[np.argmin(foot[:, 1])]
        ball_y = ank[1] + 0.62 * (tip[1] - ank[1])
        fb = foot[np.abs(foot[:, 1] - ball_y) < 0.01 * H]
        ball = np.array([(fb[:, 0].min() + fb[:, 0].max()) / 2, ball_y, 0.008 * H])
        toe = np.array([ball[0], tip[1], 0.008 * H])
        L["leg" + side] = dict(hip=hip, knee=knee, ank=ank, ball=ball, toe=toe)
    L["sec"] = sec
    return L


def torso_mid_y(sec, z):
    t = torso_loop(sec, z)
    return t["mid"][1] if t else 0.0


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


def fit_region(mask, U, Z, cell, p, zlo, zhi, free=(0, 2, 3), ucut=None, front=1):
    """refine the projection on a height band only (IoU of mesh and art silhouettes inside the band);
    with ucut, only the part in front of u=ucut counts (side views: the face, not the hair behind it)"""
    sel = (Z > zlo) & (Z < zhi)
    if ucut is not None:
        sel &= (U - ucut) * front > 0
    U, Z = U[sel], Z[sel]
    hgt, wid = mask.shape
    sat = np.zeros((hgt + 1, wid + 1))
    sat[1:, 1:] = mask.cumsum(0).cumsum(1)

    def score(q):
        s, k, a, b = q
        ix = np.floor(a + s * k * U).astype(int)
        iy = np.floor(b - s * Z).astype(int)
        ok = (ix >= 0) & (ix < wid) & (iy >= 0) & (iy < hgt)
        inter = mask[iy[ok], ix[ok]].sum()
        r0, r1 = (int(np.clip(b - s * z, 0, hgt)) for z in (zhi, zlo))
        c0, c1 = 0, wid
        if ucut is not None:
            cc = int(np.clip(a + s * k * ucut, 0, wid))
            c0, c1 = (cc, wid) if front > 0 else (0, cc)
        cnt = sat[r1, c1] - sat[r0, c1] - sat[r1, c0] + sat[r0, c0]
        rc = cnt / (s * s * k * cell * cell)
        return inter / (len(U) + rc - inter)

    p = p.copy()
    best = score(p)
    steps = np.array([0.02 * p[0], 0.02, 6.0, 6.0])
    for _ in range(6):
        improved = True
        while improved:
            improved = False
            for i in free:
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


def inpaint_hands(img, mask, skin, p, z0, z1, H, horizontal=False):
    """side art: the hand hangs in front of the shorts. Replace hand-skin pixels in the hand's height band
    by the nearest non-skin pixel below in the same column (the shorts' stripes are vertical)."""
    s, k, a, b = p
    r_top = int(b - s * (z1 - 0.015 * H))
    r_bot = int(b - s * (z0 - 0.005 * H))
    r_low = int(b - s * (z0 - 0.06 * H))
    img = img.copy()
    R, G, B_ = img[..., 0], img[..., 1], img[..., 2]
    isskin = (R - B_ > 0.1) & (G > 0.52 * R) & (R > 0.12) & mask   # skin and its shadows; not navy/red/white
    band = np.zeros_like(mask)
    band[max(r_top, 0):r_bot + 1] = True
    isskin = dilate(isskin & band, 3) & mask & band                  # the hand blob incl. its dark outline
    carry = np.zeros((img.shape[1], 3), np.float32)
    have = np.zeros(img.shape[1], bool)
    n = 0
    for r in range(min(r_low, img.shape[0] - 1), max(r_top, 0) - 1, -1):
        sk = isskin[r]
        if r <= r_bot:
            fill = sk & have
            img[r, fill] = carry[fill]
            n += fill.sum()
        ns = ~sk & mask[r]
        carry[ns] = img[r, ns]
        have |= ns
        have &= mask[r]
    if horizontal:
        # hand pixels with no clean pixel below (hand reaches past the hem onto the thigh): interpolate
        # between the nearest non-hand pixels left and right in the same row
        done = np.zeros_like(isskin)
        for r in range(max(r_top, 0), min(r_bot, img.shape[0] - 1) + 1):
            rem = np.where(isskin[r])[0]
            ok = np.where(mask[r] & ~isskin[r])[0]
            if len(rem) == 0 or len(ok) < 2:
                continue
            j = np.clip(np.searchsorted(ok, rem), 1, len(ok) - 1)
            cl, cr = ok[j - 1], ok[j]
            t = ((rem - cl) / np.maximum(cr - cl, 1))[:, None]
            img[r, rem] = img[r, cl] * (1 - t) + img[r, cr] * t
            done[r, rem] = True
        n = int(done.sum())
    log("  inpainted %d hand pixels in the side view (rows %d-%d)" % (n, r_top, r_bot))
    if os.environ.get("RIG_DEBUG"):
        dbg = bpy.data.images.new("inp", img.shape[1], img.shape[0], alpha=False)
        rgba = np.ones(img.shape[:2] + (4,), np.float32)
        rgba[..., :3] = img[::-1]
        dbg.pixels.foreach_set(rgba.ravel())
        dbg.filepath_raw = os.environ["RIG_DEBUG"] + "/inpaint_%d.png" % int(skin.sum() * 1000 + r_top)
        dbg.file_format = "PNG"
        dbg.save()
    return img


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
    LM = landmarks(V, mesh_tris(me), bvh, **c.get("lm", {}))
    zc = LM["neck_z"] - 0.01 * H
    th = np.clip((P[:, 2] - (zc - 0.02 * H)) / (0.04 * H), 0, 1)[:, None]   # 0 body .. 1 head
    hand = np.zeros(len(idx), bool)                                           # hands: front/back only
    near_arm = np.zeros(len(idx), bool)
    for sd in ("L", "R"):
        a_ = LM["arm" + sd]
        S, T = a_["S"], a_["T"]
        dd = T - S
        t = (P - S) @ dd / (dd @ dd)
        lat = np.linalg.norm((P - S) - np.outer(t, dd), axis=1)
        h0 = (a_["hand0"] - S) @ dd / (dd @ dd)
        hand |= (t > h0) & (lat < 0.06 * H) & (np.sign(P[:, 0]) == np.sign(S[0]))
        near_arm |= (t > 0.3) & (lat < 0.07 * H) & (np.sign(P[:, 0]) == np.sign(S[0]))
    # arm texels (shoulder to wrist): from the side art only skin or white (wristband) is believable
    arm = np.zeros(len(idx), bool)
    for sd in ("L", "R"):
        a_ = LM["arm" + sd]
        segd = np.full(len(idx), 9.0)
        for p0, p1 in ((a_["S"], a_["E"]), (a_["E"], a_["W"])):
            dd = p1 - p0
            t = np.clip((P - p0) @ dd / (dd @ dd), 0, 1)
            segd = np.minimum(segd, np.linalg.norm(P - (p0 + np.outer(t, dd)), axis=1))
        arm |= (segd < 1.5 * a_["r"][0]) & (np.sign(P[:, 0]) == np.sign(a_["S"][0])) & ~hand & \
                (P[:, 2] < a_["S"][2] - 0.5 * a_["r"][0])
    # ponytail: well behind the neck; only hair-coloured samples (the art's ponytail is shaped differently)
    pony = np.zeros(len(idx), bool)
    if c.get("pony"):
        nk = torso_loop(LM["sec"], LM["neck_z"])
        pony = (P[:, 1] > nk["hi"][1] + 0.065 * H) & (P[:, 2] > LM["neck_z"] - 0.1 * H)
    log("hand texels", hand.sum(), "arm texels", arm.sum(), "ponytail texels", pony.sum(),
        "neck z %.3f" % LM["neck_z"])
    skinlike = lambda q: (q[:, 0] - q[:, 2] > 0.1) & (q[:, 1] > 0.52 * q[:, 0]) & (q[:, 0] > 0.12)
    whitelike = lambda q: (q.min(1) > 0.62) & (q.max(1) - q.min(1) < 0.15)
    hair_ref = None
    fb_col = np.zeros((len(idx), 3))      # best front/back sample per texel (for side_check)
    fb_f = np.zeros(len(idx))
    # side views: the hands are inpainted away in the art, so they must not occlude either
    vh = np.zeros(len(V), bool)
    for sd in ("L", "R"):
        a_ = LM["arm" + sd]
        S, T = a_["S"], a_["T"]
        dd = T - S
        t = (V - S) @ dd / (dd @ dd)
        lat = np.linalg.norm((V - S) - np.outer(t, dd), axis=1)
        h0 = (a_["hand0"] - S) @ dd / (dd @ dd)
        vh |= (t > h0) & (lat < 0.06 * H) & (np.sign(V[:, 0]) == np.sign(S[0]))
    bvh_nh = BVHTree.FromPolygons([tuple(v) for v in V],
                                  [tuple(p.vertices) for p in me.polygons if not vh[list(p.vertices)].all()])
    acc = np.zeros((len(idx), 3))
    wsum = np.zeros(len(idx))
    maxf = np.zeros(len(idx))
    dbg = []
    for vname, img_name, mirror, gain in views:
        d, r = VIEWS[vname]
        img = load_rgb(os.path.join(REF, "%s_%s.png" % (o["char"], img_name)), mirror)
        mask = char_mask(img)
        cell = H / 280
        Vu = V @ np.array(r)
        U, Z = silhouette(bvh, d, r, Vu.min() - 0.02, Vu.max() + 0.02, H, cell)
        pb, iou = fit_view(mask, U, Z, cell)
        if vname in ("left", "right"):   # hair differs most in profile: fit the body below it, the face by profile
            pb, iou = fit_region(mask, U, Z, cell, pb, -1.0, 0.72 * H, free=(0, 1, 2, 3))
            front = 1 if np.dot((0, -1, 0), r) > 0 else -1
            nb = np.abs(Z - LM["neck_z"]) < 0.01 * H
            ucut = (U[nb].min() + U[nb].max()) / 2      # neck centre line: face in front, hair behind
            ph, iouh = fit_region(mask, U, Z, cell, pb, zc, 9.0, ucut=ucut, front=front)
        else:
            ph, iouh = fit_region(mask, U, Z, cell, pb, zc, 9.0)
        log("view %-5s from %s%s: body s %.1f k %.3f a %.1f b %.1f IoU %.3f | head s %.1f a %.1f b %.1f (%.3f)"
            % (vname, img_name, " (mirrored)" if mirror else "", *pb, iou, ph[0], ph[2], ph[3], iouh))
        dbg.append((vname, img, mask, U, Z, pb))
        if vname in ("left", "right"):
            img = inpaint_hands(img, mask, skin_ref, pb, P[hand, 2].min(), P[hand, 2].max(), H,
                                horizontal=bool(c.get("side_check")))
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
        rc = (bvh_nh if vname in ("left", "right") else bvh).ray_cast
        vis = np.fromiter((rc(Vector(p), dv, 10.0)[0] is None for p in org.tolist()), bool, len(cand))
        cand, px, py = cand[vis], px[vis], py[vis]
        col = bilinear(img, px, py)
        rej = np.zeros(len(cand), bool)
        if vname == "front":
            skin_ref = np.median(col[hand[cand]], axis=0)
        elif vname == "back" and pony.any():
            hair_ref = np.median(col[pony[cand]], axis=0)
        if vname in ("left", "right"):
            # the side art's hands hang in front of the shorts: never paint them onto non-hand texels
            hz0, hz1 = P[hand, 2].min() - 0.02 * H, P[hand, 2].max() + 0.01 * H
            zz = P[cand, 2]
            if not c.get("side_check"):
                rej |= (zz > hz0) & (zz < hz1) & (np.abs(N[cand, 0]) > 0.5) & ~near_arm[cand] & skinlike(col)
            rej |= arm[cand] & ~(skinlike(col) | whitelike(col))
        if hair_ref is not None:
            rej |= pony[cand] & (np.linalg.norm(col - hair_ref, axis=1) > 0.2)
        if vname in ("left", "right") and c.get("side_check"):
            # the mesh was generated from the front image: where front/back see a texel reasonably well and the
            # side art disagrees clearly, the side art is misaligned there (shorts hem, armholes)
            rej |= (fb_f[cand] > 0.25) & (np.linalg.norm(col - fb_col[cand], axis=1) > 0.3)
        cand, col = cand[~rej], col[~rej]
        if vname in ("front", "back"):
            better = f[cand] > fb_f[cand]
            fb_col[cand[better]] = col[better]
            fb_f[cand[better]] = f[cand][better]
        w = gain * np.where(hand[cand], 0.1 * f[cand] ** 2, f[cand] ** 6)
        if vname in ("left", "right") and c.get("face_front"):
            # this character's profile art does not match the mesh's face: let the front view own the face
            ff = -N[cand, 1]
            w *= np.where(P[cand, 2] > LM["neck_z"], np.clip((0.6 - ff) / 0.4, 0, 1), 1.0)
        acc[cand] += col * w[:, None]
        wsum[cand] += w
        maxf[cand] = np.maximum(maxf[cand], f[cand])
        log("  %d texels painted (%.1fs)" % (len(cand), time.time() - t0))
    # hands: where front/back only graze the surface, lean on the hand's median skin colour
    good_h = hand & (wsum > 0.05)
    if good_h.sum() > 100:
        skin = np.median(acc[good_h] / wsum[good_h, None], axis=0)
        acc[hand] += skin * 0.03
        wsum[hand] += 0.03
    # texels seen only at grazing angles are unreliable (ghosts of neighbouring parts): refill them
    # up-facing surfaces (shoulder tops, head) are seen edge-on by every camera: stricter there
    need = np.where(N[:, 2] > 0.5, 0.35, 0.2)
    ok = (wsum > 0) & ((maxf > need) | hand)
    col = np.zeros((len(idx), 3))
    col[ok] = acc[ok] / wsum[ok, None]
    bad = np.where(~ok)[0]
    log("unpainted texels: %d (%.2f%%)" % (len(bad), 100 * len(bad) / len(idx)))
    if len(bad):
        # nearest reliable texel on the surface, then a short diffusion so fills have no hard patches
        good = np.where(ok)[0][::3]
        kd = KDTree(len(good))
        for j, p in zip(good, P[good].tolist()):
            kd.insert(p, int(j))
        kd.balance()
        for j, p in zip(bad, P[bad].tolist()):
            col[j] = col[kd.find(p)[1]]
        sub = np.unique(np.concatenate([bad, np.where(ok)[0][::2]]))
        kd = KDTree(len(sub))
        for j, p in zip(sub, P[sub].tolist()):
            kd.insert(p, int(j))
        kd.balance()
        nb = np.array([[j for _, j, _ in kd.find_n(p, 8)] for p in P[bad].tolist()])
        for _ in range(40):
            col[bad] = col[nb].mean(1)
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


# =================================================================== rig
ARM_CHAIN = ("DEF-upper_arm", "DEF-forearm", "DEF-hand")
LEG_CHAIN = ("DEF-thigh", "DEF-shin", "DEF-foot", "DEF-toe")
SPINE = ("DEF-hips", "DEF-spine.001", "DEF-spine.002", "DEF-spine.003", "DEF-neck", "DEF-head")


def import_ual(path):
    """UAL glb -> (armature, mannequin mesh, new actions)"""
    acts0 = set(bpy.data.actions)
    new = import_glb(path)
    arm = next(ob for ob in new if ob.type == "ARMATURE")
    man = next((ob for ob in new if ob.type == "MESH" and ob.parent == arm), None)
    for ob in new:
        if ob.type == "MESH" and ob is not man:
            bpy.data.objects.remove(ob, do_unlink=True)
    for pb in arm.pose.bones:
        pb.custom_shape = None
    if arm.animation_data:
        arm.animation_data.action = None
        for t in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(t)
    return arm, man, [a for a in bpy.data.actions if a not in acts0]


def world_verts(ob):
    V = mesh_np(ob.data)
    M = np.array(ob.matrix_world)
    return V @ M[:3, :3].T + M[:3, 3]


def piecewise(z, src, dst):
    return float(np.interp(z, src, dst, left=None, right=None)) if src[0] <= z <= src[-1] else \
        (dst[0] + (z - src[0]) * (dst[1] - dst[0]) / (src[1] - src[0]) if z < src[0]
         else dst[-1] + (z - src[-1]) * (dst[-1] - dst[-2]) / (src[-1] - src[-2]))


def fit_skeleton(arm, man, V, LM):
    """edit the UAL armature in place: heads on the mesh landmarks, every bone keeps its UAL direction and
    roll (so UAL rotations mean the same thing), arms/legs laid out straight in the UAL T-pose."""
    H = LM["H"]
    VM = world_verts(man)
    HM = VM[:, 2].max()
    secM = Sections(VM, mesh_tris(man.data))
    sec = LM["sec"]
    zs = np.linspace(0.78 * HM, 0.93 * HM, 40)
    wd = [(lambda t: t["hi"][0] - t["lo"][0] if t else 9)(torso_loop(secM, z)) for z in zs]
    neckM = zs[int(np.argmin(wd))]
    rb = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in arm.data.bones}
    hipM = rb["DEF-thigh.L"][0].z
    hip = (LM["legL"]["hip"][2] + LM["legR"]["hip"][2]) / 2
    zsrc, zdst = [0.0, hipM, neckM, HM], [0.0, hip, LM["neck_z"], H]
    zmap = lambda z: piecewise(z, zsrc, zdst)
    log("UAL mannequin neck %.3f hip %.3f | mesh neck %.3f hip %.3f" % (neckM, hipM, LM["neck_z"], hip))

    def spine_pt(p):
        z = zmap(p.z)
        y = torso_mid_y(sec, z) + p.y * 0.8   # UAL's spine sits close to its mannequin's centre (y~0)
        return Vector((0.0, y, z))

    heads, lens = {}, {}
    for n in SPINE:
        h, t = spine_pt(rb[n][0]), spine_pt(rb[n][1])
        heads[n], lens[n] = h, (t - h).length
        log("  %-14s UAL %s -> %s" % (n, tuple(np.round(rb[n][0], 3)), tuple(np.round(h, 3))))
    wristM = rb["DEF-hand.L"][0]
    tipM = rb["DEF-f_middle.03.L"][1]
    for sd, sg in (("L", 1), ("R", -1)):
        A, G = LM["arm" + sd], LM["leg" + sd]
        S, E, W, T = (Vector(A[k]) for k in ("S", "E", "W", "T"))
        sx = abs(S.x) / abs(rb["DEF-upper_arm.L"][0].x)
        n = "DEF-shoulder." + sd
        heads[n] = spine_pt(rb[n][0]) + Vector((rb[n][0].x * sx, 0, 0))
        lens[n] = (rb[n][1] - rb[n][0]).length * sx
        seg = [(S - Vector(A["S"])).length, (E - S).length, (W - E).length]
        p = S.copy()
        for bn, L_ in zip(ARM_CHAIN[:2], seg[1:]):
            n = bn + "." + sd
            heads[n], lens[n] = p.copy(), L_
            p = p + (rb[n][1] - rb[n][0]).normalized() * L_
        hs = (T - W).length / (tipM - wristM).length
        n = "DEF-hand." + sd
        heads[n], lens[n] = p.copy(), (rb[n][1] - rb[n][0]).length * hs
        for b in arm.data.bones:   # fingers: UAL offsets from the wrist, scaled to this hand
            if b.name.endswith("." + sd) and (b.name.startswith("DEF-f_") or b.name.startswith("DEF-thumb")):
                heads[b.name] = p + (rb[b.name][0] - rb["DEF-hand." + sd][0]) * hs
                lens[b.name] = (rb[b.name][1] - rb[b.name][0]).length * hs
        P_ = [Vector(G[k]) for k in ("hip", "knee", "ank", "ball", "toe")]
        p = P_[0].copy()
        for i, bn in enumerate(LEG_CHAIN):
            n = bn + "." + sd
            L_ = (P_[i + 1] - P_[i]).length
            heads[n], lens[n] = p.copy(), L_
            p = p + (rb[n][1] - rb[n][0]).normalized() * L_
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.data.edit_bones
    info = {b.name: ((b.tail - b.head).normalized(), b.roll) for b in eb}
    for b in eb:
        b.use_connect = False
    for n, h in heads.items():
        b = eb[n]
        d, roll = info[n]
        b.head = h
        b.tail = h + d * lens[n]
        b.roll = roll
    bpy.ops.object.mode_set(mode="OBJECT")
    arm.data.bones["root"].use_deform = False
    return dict(hip_ratio=hip / hipM)


def pose_to_landmarks(armA, LM):
    """pose the (T-pose) copy so arms and legs follow the mesh's A-pose landmarks"""
    for sd in ("L", "R"):
        A, G = LM["arm" + sd], LM["leg" + sd]
        chains = [(ARM_CHAIN, [A["E"], A["W"], A["T"]]), (LEG_CHAIN, [G["knee"], G["ank"], G["ball"], G["toe"]])]
        for names, targets in chains:
            for bn, tgt in zip(names, targets):
                bpy.context.view_layer.update()
                pb = armA.pose.bones[bn + "." + sd]
                M = pb.matrix.copy()
                h = M.translation.copy()
                cur = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
                R = cur.rotation_difference((Vector(tgt) - h).normalized()).to_matrix().to_4x4()
                pb.matrix = Matrix.Translation(h) @ R @ Matrix.Translation(-h) @ M
    bpy.context.view_layer.update()


def bind_auto(mesh, arm):
    for vg in list(mesh.vertex_groups):
        mesh.vertex_groups.remove(vg)
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=4)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)
    me = mesh.data
    tot = np.zeros(len(me.vertices))
    for v in me.vertices:
        tot[v.index] = sum(g.weight for g in v.groups)
    log("bound to %s: %d groups, %d unweighted verts" % (arm.name, len(mesh.vertex_groups), (tot < 0.5).sum()))


def rigid_ponytail(ob, LM):
    """the ponytail follows the head bone only (heat weighting leaks it onto the neck and upper spine,
    which stretches it whenever the head turns)"""
    H = LM["H"]
    nk = torso_loop(LM["sec"], LM["neck_z"])
    V = mesh_np(ob.data)   # T-pose now, but head and ponytail did not move
    sel = (V[:, 1] > nk["hi"][1] + 0.04 * H) & (V[:, 2] > LM["neck_z"] - 0.1 * H)
    head = ob.vertex_groups["DEF-head"]
    n = 0
    for v in ob.data.vertices:
        if not sel[v.index]:
            continue
        w = {ob.vertex_groups[g.group].name: g.weight for g in v.groups}
        if w.get("DEF-head", 0) + w.get("DEF-neck", 0) + w.get("DEF-spine.003", 0) < 0.3:
            continue
        for g in list(v.groups):
            ob.vertex_groups[g.group].remove([v.index])
        head.add([v.index], 1.0, "REPLACE")
        n += 1
    log("ponytail: %d verts bound rigidly to DEF-head" % n)


def stage_rig(c, o):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(o["work"], "tex.blend"))
    ob = bpy.data.objects[o["char"]]
    V = mesh_np(ob.data)
    bvh = BVHTree.FromPolygons([tuple(v) for v in V], [tuple(p.vertices) for p in ob.data.polygons])
    LM = landmarks(V, mesh_tris(ob.data), bvh, **c.get("lm", {}))
    for k in ("armL", "armR", "legL", "legR"):
        log(k, {kk: tuple(np.round(vv, 3)) for kk, vv in LM[k].items() if isinstance(vv, np.ndarray)})
    log("neck %.3f crotch %.3f" % (LM["neck_z"], LM["crotch_z"]))
    armT, man, acts = import_ual(o["ual1"])
    for a in acts:
        bpy.data.actions.remove(a)
    armT.name = "Rig"
    armT.data.name = "Rig"
    info = fit_skeleton(armT, man, V, LM)
    bpy.data.objects.remove(man, do_unlink=True)
    armT["hip_ratio"] = info["hip_ratio"]
    # A-pose copy: pose to the mesh, make that its rest, bind there
    armA = armT.copy()
    armA.data = armT.data.copy()
    armA.name = "Rig_A"
    bpy.context.scene.collection.objects.link(armA)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = armA
    armA.select_set(True)
    bpy.ops.object.mode_set(mode="POSE")
    pose_to_landmarks(armA, LM)
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    if os.environ.get("RIG_DEBUG"):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o["work"], "debug_apose.blend"), copy=True)
    bind_auto(ob, armA)
    # A -> T: drive the A rig into the T rest pose and bake the mesh there
    bpy.context.view_layer.objects.active = armA
    bpy.ops.object.mode_set(mode="POSE")
    for b in armA.data.bones:   # parents before children
        pb = armA.pose.bones[b.name]
        pb.matrix = armT.data.bones[b.name].matrix_local.copy()
        bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.context.view_layer.objects.active = ob
    mod = next(m for m in ob.modifiers if m.type == "ARMATURE")
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mw = ob.matrix_world.copy()
    ob.parent = None
    ob.matrix_world = mw
    bpy.data.objects.remove(armA, do_unlink=True)
    # final bind on the original-orientation T-pose skeleton
    bind_auto(ob, armT)
    if c.get("pony"):
        rigid_ponytail(ob, LM)
    for p in ob.data.polygons:
        p.use_smooth = True
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o["work"], "rig.blend"))


# =================================================================== animations
ACTIONS = [  # (name, [(library, source action, first frame, last frame or None)])
    ("Bekleme", [("u1", "Idle_Loop", 0, None)]),
    ("Kosu", [("u1", "Jog_Fwd_Loop", 0, None)]),
    ("Sprint", [("u1", "Sprint_Loop", 0, None)]),
    ("Ziplama", [("u1", "Jump_Start", 0, None), ("u1", "Jump_Loop", 0, 18), ("u1", "Jump_Land", 0, None)]),
    ("Ziplama_Basla", [("u1", "Jump_Start", 0, None)]),
    ("Ziplama_Havada", [("u1", "Jump_Loop", 0, None)]),
    ("Ziplama_Inis", [("u1", "Jump_Land", 0, None)]),
    ("Yuzme", [("u1", "Swim_Fwd_Loop", 0, None)]),
    ("Yuzme_Bekleme", [("u1", "Swim_Idle_Loop", 0, None)]),
    ("Atis", [("u2", "OverhandThrow", 0, None)]),
    ("Zafer", [("u1", "Dance_Loop", 0, None)]),
    ("Takla", [("u1", "Roll", 0, None)]),
]


def channels(act):
    ch = {}
    for fc in act.fcurves:
        if fc.data_path.startswith("pose.bones"):
            bone = fc.data_path.split('"')[1]
            ch.setdefault(bone, {})[(fc.data_path.rsplit(".", 1)[1], fc.array_index)] = fc
    return ch


def sample_pose(ch, bone, t, conj, hips_scale):
    fc = ch.get(bone, {})
    ev = lambda k, i, d: fc[(k, i)].evaluate(t) if (k, i) in fc else d
    q = Quaternion([ev("rotation_quaternion", i, (1, 0, 0, 0)[i]) for i in range(4)])
    loc = Vector([ev("location", i, 0.0) for i in range(3)])
    scl = Vector([ev("scale", i, 1.0) for i in range(3)])
    if conj is not None:
        q = conj.inverted() @ q @ conj
        loc = conj.inverted() @ loc
    return q.normalized(), loc * hips_scale, scl


def build_action(name, parts, libs, bones, hip_ratio, blend=3):
    """sample source actions at integer frames (30 fps) into one action for our bone names"""
    frames = {b: [] for b in bones}
    t_out = 0
    for pi, (lib, src, f0, f1) in enumerate(parts):
        act, ch_map, conj = libs[lib][0][src], libs[lib][1], libs[lib][2]
        ch = channels(act)
        f1 = int(round(act.frame_range[1])) if f1 is None else f1
        for k, t in enumerate(range(f0, f1 + 1)):
            for b in bones:
                sb = ch_map.get(b)
                if sb is None:
                    continue
                q, l, s = sample_pose(ch, sb, t, conj.get(b), hip_ratio if b == "DEF-hips" else 1.0)
                if pi > 0 and k < blend:   # short cross-fade into a following part
                    w = (k + 1) / (blend + 1)
                    q0, l0, s0 = frames[b][-1][1:]
                    q = q0.slerp(q, w)
                    l = l0.lerp(l, w)
                    s = s0.lerp(s, w)
                frames[b].append((t_out, q, l, s))
            t_out += 1
    act = bpy.data.actions.new(name)
    for b, seq in frames.items():
        if not seq:
            continue
        n = len(seq)
        for prop, size, get in (("rotation_quaternion", 4, lambda e: e[1]), ("location", 3, lambda e: e[2]),
                                ("scale", 3, lambda e: e[3])):
            for i in range(size):
                fc = act.fcurves.new('pose.bones["%s"].%s' % (b, prop), index=i, action_group=b)
                fc.keyframe_points.add(n)
                co = np.empty(2 * n)
                co[0::2] = [e[0] for e in seq]
                co[1::2] = [get(e)[i] for e in seq]
                fc.keyframe_points.foreach_set("co", co)
                fc.keyframe_points.foreach_set("interpolation", [1] * n)   # LINEAR
                fc.update()
    act.use_frame_range = True
    act.frame_start, act.frame_end = 0, t_out - 1
    act.use_fake_user = False
    act.id_root = "OBJECT"
    return act


def stage_anim(c, o):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(o["work"], "rig.blend"))
    sc = bpy.context.scene
    sc.render.fps = 30
    arm = bpy.data.objects["Rig"]
    mesh = bpy.data.objects[o["char"]]
    bones = [b.name for b in arm.data.bones]
    a1, m1, acts1 = import_ual(o["ual1"])
    a2, m2, acts2 = import_ual(o["ual2"])
    lib1 = {a.name.rsplit("_", 1)[0]: a for a in acts1}
    lib2 = {a.name.rsplit("_", 1)[0]: a for a in acts2}
    # UAL2 (Unreal names) -> UAL1 names: same skeleton, match bones by rest head position
    map2, conj2 = {}, {}
    for b in a1.data.bones:
        cand = [x for x in a2.data.bones if "leaf" not in x.name and (x.head_local - b.head_local).length < 1e-3
                and (x.tail_local - x.head_local).normalized().dot((b.tail_local - b.head_local).normalized()) > 0.99]
        if cand:
            x = cand[0]
            map2[b.name] = x.name
            conj2[b.name] = (x.matrix_local.to_3x3().inverted() @ b.matrix_local.to_3x3()).to_quaternion()
    log("UAL2 bones mapped: %d/%d" % (len(map2), len(bones)))
    libs = {"u1": (lib1, {b: b for b in bones}, {}), "u2": (lib2, map2, conj2)}
    hip_ratio = float(arm.get("hip_ratio", 1.0))
    made = []
    for name, parts in ACTIONS:
        act = build_action(name, parts, libs, bones, hip_ratio)
        made.append(act)
        log("action %-15s frames 0-%d" % (name, act.frame_end))
    for ob in (a1, m1, a2, m2):
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)
    for a in list(bpy.data.actions):
        if a not in made:
            bpy.data.actions.remove(a)
    ad = arm.animation_data_create()
    ad.action = None
    for act in made:
        tr = ad.nla_tracks.new()
        tr.name = act.name
        tr.strips.new(act.name, 0, act)
        tr.mute = True
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.scale = (1, 1, 1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(o["work"], "anim.blend"))
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=o["out"], export_format="GLB", use_selection=True, export_apply=False,
        export_texcoords=True, export_normals=True, export_tangents=False, export_materials="EXPORT",
        export_image_format="JPEG", export_jpeg_quality=90, export_skins=True, export_influence_nb=4,
        export_all_influences=False, export_def_bones=False, export_morph=False, export_animations=True,
        export_animation_mode="ACTIONS", export_force_sampling=True, export_frame_range=False,
        export_anim_single_armature=True, export_reset_pose_bones=True, export_optimize_animation_size=True,
        export_yup=True)
    log("exported", o["out"], "%.2f MB" % (os.path.getsize(o["out"]) / 1e6))


# =================================================================== main
def main():
    o = args()
    c = CHARS[o["char"]]
    for st in o["stages"].split(","):
        log("== stage", st)
        globals()["stage_" + st](c, o)


if __name__ == "__main__":
    main()
