import type { RGB } from "./colors";

export type Pt = { x: number; y: number };

/** Unit square → quad (TL, TR, BR, BL) projective mapping. */
export function homography(q: Pt[]) {
  const [p0, p1, p2, p3] = q;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;
  let a, b, c, d, e, f, g, h;
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    a = p1.x - p0.x; b = p3.x - p0.x; c = p0.x;
    d = p1.y - p0.y; e = p3.y - p0.y; f = p0.y; g = 0; h = 0;
  } else {
    const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dy1 = p1.y - p2.y, dy2 = p3.y - p2.y;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
    a = p1.x - p0.x + g * p1.x; b = p3.x - p0.x + h * p3.x; c = p0.x;
    d = p1.y - p0.y + g * p1.y; e = p3.y - p0.y + h * p3.y; f = p0.y;
  }
  return (u: number, v: number): Pt => {
    const w = g * u + h * v + 1;
    return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w };
  };
}

/** Robust median after removing glare (very bright, low saturation) and shadows (darkest share). */
export function robustColor(px: RGB[], filter = true): RGB | null {
  let pts = px;
  if (filter && px.length > 10) {
    const withL = px.map((p) => {
      const mx = Math.max(...p), mn = Math.min(...p);
      return { p, l: (mx + mn) / 2, s: mx === 0 ? 0 : (mx - mn) / mx };
    });
    withL.sort((a, b) => a.l - b.l);
    const lo = Math.floor(withL.length * 0.15);
    const hi = Math.ceil(withL.length * 0.82);
    pts = withL.slice(lo, hi).filter((x) => !(x.l > 235 && x.s < 0.12)).map((x) => x.p);
    if (pts.length < 5) pts = withL.slice(lo, hi).map((x) => x.p);
  }
  if (!pts.length) return null;
  const med = (i: number) => {
    const v = pts.map((p) => p[i]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  return [med(0), med(1), med(2)];
}

export function samplePixels(img: ImageData, map: (u: number, v: number) => Pt, u0: number, u1: number, v0: number, v1: number, ellipse = false, n = 14): RGB[] {
  const out: RGB[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const fu = (i + 0.5) / n, fv = (j + 0.5) / n;
      if (ellipse && (fu - 0.5) ** 2 + (fv - 0.5) ** 2 > 0.25) continue;
      const p = map(u0 + (u1 - u0) * fu, v0 + (v1 - v0) * fv);
      const x = Math.round(p.x), y = Math.round(p.y);
      if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
      const k = (y * img.width + x) * 4;
      out.push([img.data[k], img.data[k + 1], img.data[k + 2]]);
    }
  return out;
}
