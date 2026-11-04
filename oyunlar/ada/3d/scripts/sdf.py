"""Small numpy signed-distance-field toolkit used to sculpt the Ada characters.

Shapes are (function, bbox) pairs; a "program" is a list of CSG steps that is
evaluated on a regular grid and turned into a mesh with marching cubes.
Distances are in metres, negative inside.
"""
import math
import numpy as np

F = np.float32


def _len(v):
    return np.sqrt((v * v).sum(-1))


def rot(rx=0.0, ry=0.0, rz=0.0):
    """Rotation matrix (columns = local axes in world), angles in degrees, R = Rz Ry Rx."""
    ax, ay, az = (math.radians(a) for a in (rx, ry, rz))
    cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return (Rz @ Ry @ Rx).astype(F)


def frame_from(axis_y, hint_z=(0, 0, 1)):
    """Orthonormal frame whose local Y is axis_y (columns x,y,z)."""
    y = np.asarray(axis_y, F)
    y = y / np.linalg.norm(y)
    z = np.asarray(hint_z, F)
    z = z - y * np.dot(z, y)
    z = z / np.linalg.norm(z)
    x = np.cross(y, z)
    return np.stack([x, y, z], 1).astype(F)


class Shape:
    def __init__(self, f, lo, hi):
        self.f = f
        self.lo = np.asarray(lo, F)
        self.hi = np.asarray(hi, F)


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b + (a - b) * h - k * h * (1.0 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


# ---------------------------------------------------------------- primitives
def sphere(c, r):
    c = np.asarray(c, F)
    return Shape(lambda P: _len(P - c) - r, c - r, c + r)


def ellipsoid(c, r, R=None, bend=None):
    """Ellipsoid with radii r; optional rotation R and quadratic bend (local z += bend*x^2)."""
    c = np.asarray(c, F)
    r = np.asarray(r, F)

    def f(P):
        q = P - c
        if R is not None:
            q = q @ R
        if bend:
            q = q.copy()
            q[:, 2] -= bend * q[:, 0] ** 2
        k0 = _len(q / r)
        k1 = _len(q / (r * r))
        return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)

    e = float(r.max()) + (abs(bend) * float(r.max()) ** 2 if bend else 0)
    return Shape(f, c - e, c + e)


def roundcone(a, b, r1, r2):
    a = np.asarray(a, F)
    b = np.asarray(b, F)
    ba = b - a
    l2 = float(np.dot(ba, ba))
    rr = r1 - r2
    a2 = l2 - rr * rr
    il2 = 1.0 / l2

    def f(P):
        pa = P - a
        y = pa @ ba
        z = y - l2
        x2v = pa * l2 - np.outer(y, ba)
        x2 = (x2v * x2v).sum(-1)
        y2 = y * y * l2
        z2 = z * z * l2
        k = math.copysign(1.0, rr) * rr * rr * x2 if rr != 0 else np.zeros_like(x2)
        d3 = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
        d1 = np.sqrt(x2 + z2) * il2 - r2
        d2 = np.sqrt(x2 + y2) * il2 - r1
        out = np.where(np.sign(y) * a2 * y2 < k, d2, d3)
        out = np.where(np.sign(z) * a2 * z2 > k, d1, out)
        return out

    rm = max(r1, r2)
    return Shape(f, np.minimum(a, b) - rm, np.maximum(a, b) + rm)


def capsule(a, b, r):
    return roundcone(a, b, r, r)


def roundbox(c, half, rad, R=None):
    c = np.asarray(c, F)
    half = np.asarray(half, F)

    def f(P):
        q = P - c
        if R is not None:
            q = q @ R
        q = np.abs(q) - half + rad
        return _len(np.maximum(q, 0)) + np.minimum(q.max(-1), 0) - rad

    e = float(_len(half))
    return Shape(f, c - e, c + e)


def torus(c, R_major, r_minor, R=None):
    """Torus around local z."""
    c = np.asarray(c, F)

    def f(P):
        q = P - c
        if R is not None:
            q = q @ R
        a = np.sqrt(q[:, 0] ** 2 + q[:, 1] ** 2) - R_major
        return np.sqrt(a * a + q[:, 2] ** 2) - r_minor

    e = R_major + r_minor
    return Shape(f, c - e, c + e)


def chain(points, radii):
    """Union of round cones through a polyline (tubes, strands, tails)."""
    segs = [roundcone(points[i], points[i + 1], radii[i], radii[i + 1]) for i in range(len(points) - 1)]
    lo = np.min([s.lo for s in segs], 0)
    hi = np.max([s.hi for s in segs], 0)

    def f(P):
        d = segs[0].f(P)
        for s in segs[1:]:
            d = np.minimum(d, s.f(P))
        return d

    return Shape(f, lo, hi)


def halfspace(n, p0):
    """Negative on the side n points away from: d = dot(P-p0, n)."""
    n = np.asarray(n, F) / np.linalg.norm(n)
    p0 = np.asarray(p0, F)
    return Shape(lambda P: (P - p0) @ n, [-9, -9, -9], [9, 9, 9])


def custom(f, lo, hi):
    return Shape(f, lo, hi)


# ---------------------------------------------------------------- grids
class Grid:
    def __init__(self, lo, hi, h):
        self.lo = np.asarray(lo, F)
        self.h = float(h)
        self.n = (np.ceil((np.asarray(hi, F) - self.lo) / h).astype(int) + 1)
        self.d = np.full(tuple(self.n), 1.0, F)

    def _sub(self, lo, hi):
        i0 = np.clip(np.floor((lo - self.lo) / self.h).astype(int), 0, self.n)
        i1 = np.clip(np.ceil((hi - self.lo) / self.h).astype(int) + 1, 0, self.n)
        return i0, i1

    def points(self, i0, i1):
        ax = [self.lo[k] + self.h * np.arange(i0[k], i1[k], dtype=F) for k in range(3)]
        X, Y, Z = np.meshgrid(*ax, indexing="ij")
        return np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)

    def eval(self, shape, margin=0.05):
        """Evaluate a shape over its bbox region (+margin); returns full array (far = +1)."""
        out = np.full(tuple(self.n), 1.0, F)
        i0, i1 = self._sub(shape.lo - margin, shape.hi + margin)
        if np.any(i1 <= i0):
            return out
        sl = tuple(slice(i0[k], i1[k]) for k in range(3))
        out[sl] = shape.f(self.points(i0, i1)).reshape(tuple(i1 - i0))
        return out

    def eval_all(self, f):
        """Evaluate f(P) on the whole grid in x-slabs."""
        out = np.empty(tuple(self.n), F)
        step = max(1, int(4e6 // (self.n[1] * self.n[2])))
        for x0 in range(0, self.n[0], step):
            x1 = min(self.n[0], x0 + step)
            i0 = np.array([x0, 0, 0])
            i1 = np.array([x1, self.n[1], self.n[2]])
            out[x0:x1] = f(self.points(i0, i1)).reshape(tuple(i1 - i0))
        return out

    def run(self, program, d=None, margin=0.05):
        """program: list of (op, shape, k) with op in 'u' (smooth union), 's' (smooth subtract),
        'i' (smooth intersect, global), 'S' (hard subtract)."""
        d = self.d if d is None else d
        for op, shape, k in program:
            if op == "i":
                v = self.eval_all(shape.f)
                d[...] = smax(d, v, k)
                continue
            m = margin + 2 * k
            i0, i1 = self._sub(shape.lo - m, shape.hi + m)
            if np.any(i1 <= i0):
                continue
            sl = tuple(slice(i0[kk], i1[kk]) for kk in range(3))
            v = shape.f(self.points(i0, i1)).reshape(tuple(i1 - i0)).astype(F)
            cur = d[sl]
            if op == "u":
                d[sl] = smin(cur, v, k)
            elif op == "s":
                d[sl] = smax(cur, -v, k)
            elif op == "S":
                d[sl] = np.maximum(cur, -v)
            else:
                raise ValueError(op)
        return d


def marching_cubes(grid, d, level=0.0):
    from skimage.measure import marching_cubes as mc
    vol = np.pad(d, 1, constant_values=1.0)
    if vol.min() >= level:
        return np.zeros((0, 3), F), np.zeros((0, 3), np.int32)
    verts, faces, _n, _v = mc(vol, level=level, spacing=(grid.h,) * 3, allow_degenerate=False)
    verts = verts + (grid.lo - grid.h)
    return verts.astype(F), faces.astype(np.int32)
