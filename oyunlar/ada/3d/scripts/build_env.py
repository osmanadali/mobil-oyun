"""Üçlü Köprü — procedural tropical-lagoon parkour set for "Ada" (Blender 4.2, headless).

Usage:
  blender -b -P build_env.py -- [--out DIR] [--samples 48] [--no-render] [--no-export]
Also importable: build_env.build(clear=True) creates the scene and returns key data
(used by render_glb.py to place characters on the set).

Layout (metres, Z up, the course runs toward +Y):
  start dock  y = -10 .. 0       (deck top z = 0.55)
  5 rows x 3 platforms, 1.3 m squares, row gap 1.6 m, column gap 1.2 m
  finish platform y = 16.1 .. 20.6 with a chequered flag
"""
import bpy, bmesh, math, random, sys, os
from mathutils import Vector, Matrix, noise

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DEFAULT = os.path.normpath(os.path.join(HERE, ".."))

DECK_Z = 0.55
PLAT = 1.3
ROW_GAP = 1.6
COL_GAP = 1.2
ROWS = 5
COL_X = [-(PLAT + COL_GAP), 0.0, PLAT + COL_GAP]
ROW_Y = [ROW_GAP + PLAT / 2 + i * (PLAT + ROW_GAP) for i in range(ROWS)]
FIN_Y0 = ROW_Y[-1] + PLAT / 2 + ROW_GAP
FIN_D = 4.5
FIN_W = 7.5
SEABED = -1.45


# ------------------------------------------------------------------ helpers
def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def smoothstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


_MATS = {}


def mat(name, hexcol=None, rough=0.7, alpha=1.0, vcol=False, spec=0.4, double=False, emit=0.0):
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    if hexcol:
        b.inputs["Base Color"].default_value = (*lin(hexcol), 1)
    if vcol:
        vc = nt.nodes.new("ShaderNodeVertexColor")
        vc.layer_name = "Col"
        vc.location = (-300, 200)
        nt.links.new(vc.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = spec
    if emit > 0 and hexcol:
        b.inputs["Emission Color"].default_value = (*lin(hexcol), 1)
        b.inputs["Emission Strength"].default_value = emit
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    m.use_backface_culling = not double
    _MATS[name] = m
    return m


def coll():
    c = bpy.data.collections.get("Ortam")
    if c is None:
        c = bpy.data.collections.new("Ortam")
        bpy.context.scene.collection.children.link(c)
    return c


def finish(name, bm, mats, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    coll().objects.link(ob)
    return ob


def faces_of(verts):
    return list({f for v in verts for f in v.link_faces})


def add_box(bm, center, size, bevel=0.0, mi=0, rotz=0.0, taper=1.0):
    vs = bmesh.ops.create_cube(bm, size=2.0)["verts"]
    for v in vs:
        k = taper if v.co.z < 0 else 1.0
        v.co = Vector((v.co.x * size[0] * k, v.co.y * size[1] * k, v.co.z * size[2]))
    if rotz:
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rotz, 3, "Z"), verts=vs)
    bmesh.ops.translate(bm, vec=Vector(center), verts=vs)
    for f in faces_of(vs):
        f.material_index = mi
    if bevel > 0:
        es = list({e for v in vs for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=es, offset=bevel, segments=1, affect="EDGES", profile=0.5,
                        clamp_overlap=True)
    return vs


def add_cyl(bm, p0, p1, r0, r1, segs=8, mi=0):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    q = d.to_track_quat("Z", "Y")
    M = Matrix.Translation((p0 + p1) / 2) @ q.to_matrix().to_4x4()
    g = bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r0, radius2=r1,
                              depth=d.length, matrix=M)
    for f in faces_of(g["verts"]):
        f.material_index = mi
    return g["verts"]


def vcol_layer(bm):
    return bm.verts.layers.float_color.get("Col") or bm.verts.layers.float_color.new("Col")


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


# ------------------------------------------------------------------ terrain & water
def warp(u, span, ex):
    return math.copysign(span * abs(u) ** ex, u)


def seabed_h(x, y):
    rx, ry = x / 34.0, (y - 6.0) / 40.0
    r = math.sqrt(rx * rx + ry * ry)
    return SEABED - 9.0 * smoothstep(1.0, 2.2, r) + 0.12 * noise.noise(Vector((x * 0.08, y * 0.08, 0.3)))


def build_seabed():
    bm = bmesh.new()
    col = vcol_layer(bm)
    N = 72
    shallow, deep = lin("#E2D29C"), lin("#06405E")
    grid = []
    for j in range(N + 1):
        row = []
        for i in range(N + 1):
            u, v = -1 + 2 * i / N, -1 + 2 * j / N
            x, y = warp(u, 420, 2.0), warp(v, 420, 2.0) + 6
            z = seabed_h(x, y)
            vt = bm.verts.new((x, y, z))
            t = smoothstep(SEABED - 0.3, SEABED - 6.0, z)
            vt[col] = (*mix(shallow, deep, t), 1)
            row.append(vt)
        grid.append(row)
    for j in range(N):
        for i in range(N):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    return finish("Deniz_Tabani", bm, [mat("Kum_Taban", vcol=True, rough=0.95)], smooth=True)


def build_water():
    bm = bmesh.new()
    N = 110
    grid = []
    for j in range(N + 1):
        row = []
        for i in range(N + 1):
            u, v = -1 + 2 * i / N, -1 + 2 * j / N
            x, y = warp(u, 600, 2.2), warp(v, 600, 2.2) + 6
            r = math.hypot(x, y - 6)
            a = 0.055 / (1 + (r / 45) ** 2)
            z = a * (0.6 * math.sin(0.55 * x + 0.32 * y) + 0.4 * math.sin(-0.37 * x + 0.71 * y + 1.3)
                     + 0.25 * math.sin(1.3 * x - 0.9 * y + 0.4))
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(N):
        for i in range(N):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    m = mat("Su", "#14B4C4", rough=0.10, alpha=0.80, spec=0.35)
    ob = finish("Lagun_Su", bm, [m], smooth=True)
    # render-only ripple bump (ignored by glTF export)
    nt = m.node_tree
    if "Ripple" not in nt.nodes:
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1.0, 1.6, 1.0)
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.name = "Ripple"
        nz.inputs["Scale"].default_value = 0.9
        nz.inputs["Detail"].default_value = 3.0
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = 0.12
        bp.inputs["Distance"].default_value = 0.05
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs["Normal"], nt.nodes["Principled BSDF"].inputs["Normal"])
    return ob


SAND_DRY, SAND_WET, FOAM, GRASS, GRASS2 = "#F0D9A6", "#D7B67E", "#FBF6EA", "#5DAE4A", "#7CC456"


def shore_color(z, gx=0.0, grass_from=None):
    dry, wet, foam = lin(SAND_DRY), lin(SAND_WET), lin(FOAM)
    under = lin("#E6D3A2")
    if z < -0.06:
        return mix(wet, under, smoothstep(-0.06, -0.5, z))
    if z < 0.07:
        return foam
    c = mix(wet, dry, smoothstep(0.07, 0.30, z))
    if grass_from is not None and z > grass_from + 0.08 * gx:
        c = mix(lin(GRASS), lin(GRASS2), 0.5 + 0.5 * gx)
    return c


def beach_h(x, y):
    yc = -12.5 - 0.0045 * x * x
    d = y - yc
    h = 0.78 - 2.3 * smoothstep(2.0, 9.0, d) - 2.3 * smoothstep(-5.0, -11.0, d)
    h -= 2.3 * smoothstep(30.0, 46.0, abs(x))
    h += 0.07 * noise.noise(Vector((x * 0.15, y * 0.15, 1.7)))
    return h


def build_beach():
    bm = bmesh.new()
    col = vcol_layer(bm)
    NX, NY = 96, 34
    grid = []
    for j in range(NY + 1):
        row = []
        for i in range(NX + 1):
            x = -50 + 100 * i / NX
            y = -27 + 23.5 * j / NY
            z = beach_h(x, y)
            vt = bm.verts.new((x, y, z))
            vt[col] = (*shore_color(z), 1)
            row.append(vt)
        grid.append(row)
    for j in range(NY):
        for i in range(NX):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    return finish("Kumsal", bm, [mat("Kum", vcol=True, rough=0.9)], smooth=True)


def build_mound(name, c, R, H, grass=True, rings=10, segs=28, seed=0, far=0.0):
    """Island mound: radial grid, sand rim + foam line + grassy top. far>0 blends to haze."""
    bm = bmesh.new()
    col = vcol_layer(bm)
    haze = lin("#BFD3D6")
    verts = []
    for ri in range(rings + 1):
        rr = ri / rings
        ring = []
        for si in range(segs if ri else 1):
            a = 2 * math.pi * si / segs
            wob = 1 + 0.18 * noise.noise(Vector((math.cos(a) * 1.3, math.sin(a) * 1.3, seed)))
            rad = R * rr * wob
            x, y = c[0] + rad * math.cos(a), c[1] + rad * math.sin(a) * 0.8
            t = rr
            z = H * (1 - t ** 2.2) - (abs(SEABED) + 0.2) * smoothstep(0.80, 1.0, t)
            z += 0.18 * H * noise.noise(Vector((x * 0.12, y * 0.12, seed + 3)))
            v = bm.verts.new((x, y, z))
            gx = noise.noise(Vector((x * 0.3, y * 0.3, seed)))
            cc = shore_color(z, gx, grass_from=(0.42 * H) if grass else None)
            if far:
                cc = mix(cc, haze, far)
            v[col] = (*cc, 1)
            ring.append(v)
        verts.append(ring)
    for si in range(segs):
        bm.faces.new((verts[0][0], verts[1][si], verts[1][(si + 1) % segs]))
    for ri in range(1, rings):
        for si in range(segs):
            a, b = verts[ri][si], verts[ri][(si + 1) % segs]
            c2, d = verts[ri + 1][(si + 1) % segs], verts[ri + 1][si]
            bm.faces.new((a, d, c2, b))
    for f in bm.faces:
        f.normal_update()
        if f.normal.z < 0:
            f.normal_flip()
    return finish(name, bm, [mat("Ada_Tepe", vcol=True, rough=0.9)], smooth=not far)


def build_far_islands():
    obs = []
    rnd = random.Random(7)
    spots = [(-120, 230, 60, 16), (60, 300, 85, 26), (190, 210, 55, 12), (-230, 150, 50, 10),
             (250, 60, 40, 9), (-200, -60, 40, 8), (20, 420, 110, 18)]
    for k, (x, y, R, H) in enumerate(spots):
        dist = math.hypot(x, y)
        obs.append(build_mound("Uzak_Ada_%d" % k, (x, y), R, H, grass=True, rings=7, segs=22,
                               seed=k * 3.1, far=min(0.5, 0.12 + dist / 900)))
    return obs


# ------------------------------------------------------------------ props
def build_dock():
    bm = bmesh.new()
    W = 3.2
    y0, y1 = -8.0, 0.0
    n = 28
    pl = (y1 - y0) / n
    rnd = random.Random(3)
    for i in range(n):
        yc = y0 + pl * (i + 0.5)
        mi = 0 if i % 3 else 1
        add_box(bm, (rnd.uniform(-0.03, 0.03), yc, DECK_Z - 0.035), (W / 2, pl / 2 - 0.012, 0.035), 0.01, mi,
                rotz=rnd.uniform(-0.012, 0.012))
    for sx in (-1, 1):
        add_box(bm, (sx * (W / 2 - 0.12), (y0 + y1) / 2, DECK_Z - 0.12), (0.07, (y1 - y0) / 2, 0.06), 0.01, 1)
        for k in range(6):
            yp = y0 + 0.3 + k * (y1 - y0 - 0.6) / 5
            top = DECK_Z + (0.55 if k in (0, 5) else -0.07)
            add_cyl(bm, (sx * (W / 2 - 0.05), yp, SEABED - 0.2), (sx * (W / 2 - 0.05), yp, top), 0.11, 0.10, 8, 1)
    # rope between end posts
    for sx in (-1, 1):
        p0 = Vector((sx * (W / 2 - 0.05), y0 + 0.3, DECK_Z + 0.42))
        p1 = Vector((sx * (W / 2 - 0.05), y1 - 0.3, DECK_Z + 0.42))
        prev = p0
        for k in range(1, 13):
            t = k / 12
            p = p0.lerp(p1, t) + Vector((0, 0, -0.22 * math.sin(math.pi * t)))
            add_cyl(bm, prev, p, 0.022, 0.022, 6, 2)
            prev = p
    return finish("Baslangic_Iskele", bm, [mat("Ahsap", "#B27843", 0.75), mat("Ahsap_Koyu", "#7E5431", 0.8),
                                           mat("Halat", "#D9C49A", 0.9)])


def build_platforms():
    obs = []
    rnd = random.Random(11)
    stone = [mat("Kumtasi", "#D9B57F", 0.85), mat("Kumtasi_2", "#C99F6B", 0.85)]
    wood = mat("Ahsap", "#B27843", 0.75)
    foam = mat("Kopuk", "#F4FBFB", 0.6, alpha=0.85)
    for r, y in enumerate(ROW_Y):
        for c, x in enumerate(COL_X):
            bm = bmesh.new()
            s = PLAT / 2
            add_box(bm, (x, y, (DECK_Z - 0.10 + SEABED - 0.2) / 2), (s - 0.05, s - 0.05, (DECK_Z - 0.10 - SEABED + 0.2) / 2),
                    0.05, (r + c) % 2, taper=1.08)
            for k in range(4):   # plank cap
                px = x - s + (k + 0.5) * PLAT / 4
                add_box(bm, (px, y, DECK_Z - 0.05), (PLAT / 8 - 0.014, s, 0.05), 0.012, 2)
            # foam ring at the waterline
            outer = [bm.verts.new((x + (s + 0.30) * math.cos(math.pi / 4 + k * math.pi / 2) * 1.414,
                                   y + (s + 0.30) * math.sin(math.pi / 4 + k * math.pi / 2) * 1.414, 0.03))
                     for k in range(4)]
            inner = [bm.verts.new((x + (s - 0.02) * math.cos(math.pi / 4 + k * math.pi / 2) * 1.414,
                                   y + (s - 0.02) * math.sin(math.pi / 4 + k * math.pi / 2) * 1.414, 0.03))
                     for k in range(4)]
            for k in range(4):
                f = bm.faces.new((inner[k], outer[k], outer[(k + 1) % 4], inner[(k + 1) % 4]))
                f.material_index = 3
            obs.append(finish("Platform_S%d_K%d" % (r + 1, c + 1), bm, stone + [wood, foam]))
    return obs


def build_finish():
    bm = bmesh.new()
    y0 = FIN_Y0
    cy = y0 + FIN_D / 2
    add_box(bm, (0, cy, (DECK_Z - 0.1 + SEABED - 0.2) / 2), (FIN_W / 2, FIN_D / 2, (DECK_Z - 0.1 - SEABED + 0.2) / 2),
            0.08, 0, taper=1.05)
    # tiled top
    nx, ny = 6, 4
    for i in range(nx):
        for j in range(ny):
            add_box(bm, (-FIN_W / 2 + (i + 0.5) * FIN_W / nx, y0 + (j + 0.5) * FIN_D / ny, DECK_Z - 0.05),
                    (FIN_W / nx / 2 - 0.02, FIN_D / ny / 2 - 0.02, 0.05), 0.02, (i + j) % 2)
    # steps / low wall at the back
    add_box(bm, (0, y0 + FIN_D - 0.25, DECK_Z + 0.2), (FIN_W / 2 - 0.3, 0.2, 0.2), 0.04, 1)
    # flag pole
    px, py = 0.0, y0 + FIN_D - 0.75
    add_cyl(bm, (px, py, DECK_Z), (px, py, DECK_Z + 0.18), 0.22, 0.18, 10, 1)
    add_cyl(bm, (px, py, DECK_Z), (px, py, DECK_Z + 4.0), 0.055, 0.045, 10, 2)
    g = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.09,
                                  matrix=Matrix.Translation((px, py, DECK_Z + 4.05)))
    for f in faces_of(g["verts"]):
        f.material_index = 3
    ob = finish("Bitis_Platformu", bm, [mat("Kumtasi", "#D9B57F", 0.85), mat("Kumtasi_2", "#C99F6B", 0.85),
                                        mat("Direk", "#ECE7DD", 0.4), mat("Altin", "#F2B33D", 0.35)])
    # chequered flag
    bm = bmesh.new()
    FW, FH, NX, NY = 1.5, 0.95, 12, 8
    vs = [[None] * (NX + 1) for _ in range(NY + 1)]
    for j in range(NY + 1):
        for i in range(NX + 1):
            t = i / NX
            x = px + 0.06 + FW * t
            z = DECK_Z + 3.95 - FH * j / NY - 0.05 * t * t
            yy = py + 0.11 * t * math.sin(2.6 * t * math.pi + 0.4) + 0.02 * math.sin(5 * j / NY)
            vs[j][i] = bm.verts.new((x, yy, z))
    for j in range(NY):
        for i in range(NX):
            f = bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
            f.material_index = ((i // 2) + (j // 2)) % 2
    finish("Bitis_Bayragi", bm, [mat("Bayrak_Beyaz", "#F7F5EF", 0.8, double=True),
                                 mat("Bayrak_Siyah", "#1E2226", 0.8, double=True)], smooth=True)
    # banner posts at the front corners
    bm = bmesh.new()
    for sx in (-1, 1):
        add_cyl(bm, (sx * (FIN_W / 2 - 0.3), y0 + 0.3, DECK_Z), (sx * (FIN_W / 2 - 0.3), y0 + 0.3, DECK_Z + 1.1),
                0.09, 0.07, 8, 0)
        add_cyl(bm, (sx * (FIN_W / 2 - 0.3), y0 + 0.3, DECK_Z + 1.1), (sx * (FIN_W / 2 - 0.3), y0 + 0.3, DECK_Z + 1.32),
                0.12, 0.08, 8, 1)
    finish("Bitis_Mesaleler", bm, [mat("Ahsap_Koyu", "#7E5431", 0.8), mat("Ates", "#FF9A3C", 0.5, emit=6.0)])
    return ob


def build_palm(name, base, height=6.0, lean=(0.3, 0.0), seed=0):
    rnd = random.Random(seed)
    bm = bmesh.new()
    base = Vector(base)
    ld = Vector((lean[0], lean[1], 0))
    up = Vector((0, 0, 1))
    rings, segs = 11, 8
    ring_vs = []
    centers = []
    for k in range(rings + 1):
        t = k / rings
        c = base + up * height * t + ld * height * (t * t)
        centers.append(c)
        r = 0.20 * (1 - 0.38 * t) * (1.07 if k % 2 else 0.95)
        ring = [bm.verts.new(c + Vector((r * math.cos(2 * math.pi * s / segs), r * math.sin(2 * math.pi * s / segs), 0)))
                for s in range(segs)]
        ring_vs.append(ring)
    for k in range(rings):
        for s in range(segs):
            f = bm.faces.new((ring_vs[k][s], ring_vs[k][(s + 1) % segs], ring_vs[k + 1][(s + 1) % segs],
                              ring_vs[k + 1][s]))
            f.material_index = 0
    top = centers[-1]
    bm.faces.new(list(reversed(ring_vs[-1]))).material_index = 0
    # coconuts
    for k in range(3):
        a = 2 * math.pi * k / 3 + rnd.random()
        g = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.12,
                                       matrix=Matrix.Translation(top + Vector((0.15 * math.cos(a), 0.15 * math.sin(a), -0.18))))
        for f in faces_of(g["verts"]):
            f.material_index = 3
    # fronds
    nf = 9
    for k in range(nf):
        a = 2 * math.pi * k / nf + rnd.uniform(-0.2, 0.2)
        dh = Vector((math.cos(a), math.sin(a), 0))
        side = dh.cross(up)
        L = rnd.uniform(2.3, 2.9) * height / 6.0
        rise = rnd.uniform(0.25, 0.55)
        S = 12
        left, mid, right = [], [], []
        for s in range(S + 1):
            t = s / S
            p = top + dh * (L * t) + up * (L * (rise * t - 0.85 * t * t)) + up * 0.05
            w = 0.36 * (math.sin(math.pi * min(1.0, t * 1.08)) ** 0.75) * (L / 2.6)
            if s % 2:
                w *= 0.72
            mid.append(bm.verts.new(p + up * 0.07 * w / 0.36))
            left.append(bm.verts.new(p - side * w - up * 0.05 * w))
            right.append(bm.verts.new(p + side * w - up * 0.05 * w))
        for s in range(S):
            for a1, b1 in ((left, mid), (mid, right)):
                f = bm.faces.new((a1[s], a1[s + 1], b1[s + 1], b1[s]))
                f.material_index = 1 + (k % 2)
    return finish(name, bm, [mat("Palmiye_Govde", "#9A7350", 0.9), mat("Palmiye_Yaprak", "#3E9E4C", 0.6, double=True),
                             mat("Palmiye_Yaprak_2", "#62BA4E", 0.6, double=True), mat("Hindistan_Cevizi", "#6B4A2B", 0.7)],
                  smooth=True)


def build_rocks(name, spots, seed=1):
    bm = bmesh.new()
    rnd = random.Random(seed)
    for k, (x, y, z, s) in enumerate(spots):
        g = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
        sx, sy, sz = s * rnd.uniform(0.8, 1.3), s * rnd.uniform(0.7, 1.1), s * rnd.uniform(0.45, 0.75)
        off = Vector((rnd.random() * 9, rnd.random() * 9, k))
        for v in g["verts"]:
            n = noise.noise(v.co * 1.2 + off)
            v.co *= 1 + 0.28 * n
            v.co.z = max(v.co.z, -0.55)
            v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rnd.random() * 6.3, 3, "Z"), verts=g["verts"])
        bmesh.ops.translate(bm, vec=Vector((x, y, z)), verts=g["verts"])
        for f in faces_of(g["verts"]):
            f.material_index = k % 2
    return finish(name, bm, [mat("Kaya", "#A09281", 0.85), mat("Kaya_2", "#87796A", 0.85)])


# ------------------------------------------------------------------ sky, light, cameras
SUN_DIR = Vector((0.55, -0.62, 0.36)).normalized()


def build_world():
    w = bpy.data.worlds.new("Ada_Gokyuzu")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nv = nt.nodes.new("ShaderNodeVectorMath"); nv.operation = "NORMALIZE"
    sp = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -0.02
    mr.inputs["From Max"].default_value = 0.55
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    cr.elements[0].position = 0.0
    cr.elements[0].color = (*lin("#FFC796"), 1)
    cr.elements[1].position = 1.0
    cr.elements[1].color = (*lin("#4E9CDB"), 1)
    e = cr.elements.new(0.16); e.color = (*lin("#FFDDB8"), 1)
    e = cr.elements.new(0.42); e.color = (*lin("#9CCBEA"), 1)
    dot = nt.nodes.new("ShaderNodeVectorMath"); dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = SUN_DIR
    gl = nt.nodes.new("ShaderNodeMapRange")
    gl.inputs["From Min"].default_value = 0.80
    gl.inputs["From Max"].default_value = 1.0
    pw = nt.nodes.new("ShaderNodeMath"); pw.operation = "POWER"; pw.inputs[1].default_value = 2.5
    mixc = nt.nodes.new("ShaderNodeMix"); mixc.data_type = "RGBA"; mixc.blend_type = "ADD"
    mixc.inputs[7].default_value = (*lin("#FFB36B"), 1)
    L = nt.links.new
    L(tc.outputs["Generated"], nv.inputs[0])
    L(nv.outputs["Vector"], sp.inputs[0])
    L(sp.outputs["Z"], mr.inputs["Value"])
    L(mr.outputs["Result"], ramp.inputs["Fac"])
    L(nv.outputs["Vector"], dot.inputs[0])
    L(dot.outputs["Value"], gl.inputs["Value"])
    L(gl.outputs["Result"], pw.inputs[0])
    L(pw.outputs["Value"], mixc.inputs["Factor"])
    L(ramp.outputs["Color"], mixc.inputs[6])
    L(mixc.outputs[2], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.75
    L(bg.outputs["Background"], out.inputs["Surface"])
    sun = bpy.data.lights.new("Gunes", "SUN")
    sun.energy = 3.0
    sun.angle = math.radians(2.5)
    sun.color = lin("#FFE0B5")
    so = bpy.data.objects.new("Gunes", sun)
    so.rotation_euler = SUN_DIR.to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(so)
    return so


def add_camera(name, loc, target, lens):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_end = 2000
    co = bpy.data.objects.new(name, cd)
    co.location = loc
    co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(co)
    return co


def setup_render(samples=48, res=(1080, 1920)):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 4
    sc.cycles.transparent_max_bounces = 8
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.threads_mode = "FIXED"
    sc.render.threads = os.cpu_count() or 4
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "Medium High Contrast"
    sc.view_settings.exposure = 0.15


# ------------------------------------------------------------------ build all
def build(clear=True):
    if clear:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        _MATS.clear()
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    build_world()
    build_seabed()
    build_water()
    build_beach()
    build_dock()
    build_platforms()
    build_finish()
    build_mound("Adacik_Bitis", (9.5, FIN_Y0 + 9.0), 7.5, 1.1, seed=2.0)
    build_mound("Adacik_Sol", (-15.0, 13.0), 5.0, 0.8, seed=5.0)
    build_far_islands()
    palms = [((-7.5, -13.5, 0.75), 6.4, (0.25, 0.10)), ((-4.3, -15.6, 0.75), 5.6, (-0.15, 0.18)),
             ((5.2, -13.6, 0.75), 6.0, (0.05, 0.30)), ((9.5, -15.3, 0.75), 7.0, (0.30, 0.05)),
             ((15.5, -14.0, 0.7), 5.4, (-0.2, 0.25)), ((-15.0, -14.5, 0.7), 6.2, (0.3, 0.2)),
             ((8.0, FIN_Y0 + 9.0, 1.0), 6.5, (-0.3, -0.15)), ((11.5, FIN_Y0 + 10.5, 0.9), 5.6, (0.25, 0.05)),
             ((-15.0, 13.2, 0.75), 5.2, (0.3, -0.1))]
    for k, (b, h, l) in enumerate(palms):
        build_palm("Palmiye_%d" % (k + 1), b, h, l, seed=k + 4)
    rocks = [(-6.0, -10.0, 0.6, 0.55), (-5.3, -9.4, 0.5, 0.30), (3.8, -8.9, 0.4, 0.45), (12.0, -11.0, 0.6, 0.7),
             (-12.0, -10.1, 0.5, 0.5), (2.6, -7.0, 0.0, 0.40), (-2.6, -4.5, -0.2, 0.35),
             (-5.6, 4.0, -0.3, 0.55), (5.8, 9.0, -0.3, 0.65), (-5.4, 12.5, -0.4, 0.45), (6.2, 15.0, -0.3, 0.40),
             (4.5, FIN_Y0 + 1.0, -0.2, 0.5), (-4.6, FIN_Y0 + 2.6, -0.2, 0.6), (6.5, FIN_Y0 + 6.0, 0.4, 0.6),
             (-13.0, 11.0, 0.3, 0.5)]
    build_rocks("Kayalar", rocks)
    gameplay = add_camera("Kamera_Oyun", (0.0, -15.5, 8.4), (0.0, 7.0, 0.0), 26)
    wide = add_camera("Kamera_Genis", (-26.0, -22.0, 15.0), (1.5, 6.0, 0.0), 24)
    sc.camera = gameplay
    return dict(gameplay=gameplay, wide=wide, deck_z=DECK_Z, dock_end_y=0.0, row_y=ROW_Y, col_x=COL_X,
                finish_y0=FIN_Y0)


def export_glb(path):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in coll().all_objects:
        ob.select_set(True)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kw = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
              export_cameras=False, export_lights=False)
    if "export_vertex_color" in props:
        kw["export_vertex_color"] = "MATERIAL"
    elif "export_colors" in props:
        kw["export_colors"] = True
    bpy.ops.export_scene.gltf(**kw)


def render_still(cam, path):
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.image_settings.file_format = "PNG"
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out = OUT_DEFAULT
    samples = 48
    if "--out" in argv:
        out = argv[argv.index("--out") + 1]
    if "--samples" in argv:
        samples = int(argv[argv.index("--samples") + 1])
    info = build()
    if "--no-export" not in argv:
        export_glb(os.path.join(out, "ortam_uclu_kopru.glb"))
    if "--no-render" not in argv:
        setup_render(samples)
        os.makedirs(os.path.join(out, "render"), exist_ok=True)
        render_still(info["gameplay"], os.path.join(out, "render", "ortam_oyun_kamerasi.png"))
        render_still(info["wide"], os.path.join(out, "render", "ortam_genis_plan.png"))


if __name__ == "__main__":
    main()
