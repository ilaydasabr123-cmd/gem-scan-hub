export type RGB = [number, number, number];
export type Lab = [number, number, number];

export interface RefColor {
  code: string;
  name: string;
  hex: string;
  lab: Lab;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function oklchToRgb(L: number, C: number, H: number): RGB {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return lin.map((c) => {
    const v = clamp(c);
    return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  }) as RGB;
}

export function rgbToLab([r, g, b]: RGB): Lab {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const x = (lin[0] * 0.4124564 + lin[1] * 0.3575761 + lin[2] * 0.1804375) / 0.95047;
  const y = lin[0] * 0.2126729 + lin[1] * 0.7151522 + lin[2] * 0.072175;
  const z = (lin[0] * 0.0193339 + lin[1] * 0.119192 + lin[2] * 0.9503041) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIEDE2000 colour difference (kL = kC = kH = 1). */
export function deltaE00(l1: Lab, l2: Lab): number {
  const [L1, a1, b1] = l1;
  const [L2, a2, b2] = l2;
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const hp = (b: number, a: number) => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(b1, a1p), h2p = hp(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lmp = (L1 + L2) / 2;
  const Cmp = (C1p + C2p) / 2;
  let hmp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hmp += h1p + h2p < 360 ? 360 : -360;
    hmp /= 2;
  }
  const T = 1 - 0.17 * Math.cos((hmp - 30) * rad) + 0.24 * Math.cos(2 * hmp * rad) +
    0.32 * Math.cos((3 * hmp + 6) * rad) - 0.2 * Math.cos((4 * hmp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hmp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lmp - 50) ** 2) / Math.sqrt(20 + (Lmp - 50) ** 2);
  const Sc = 1 + 0.045 * Cmp;
  const Sh = 1 + 0.015 * Cmp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

const HUES: [string, string, number][] = [
  ["RO", "Rot", 25], ["KO", "Koralle", 38], ["OR", "Orange", 55], ["BE", "Bernstein", 70],
  ["GO", "Gold", 85], ["ZI", "Zitrone", 105], ["LI", "Limette", 125], ["GR", "Grün", 145],
  ["SM", "Smaragd", 165], ["TU", "Türkis", 190], ["PE", "Petrol", 215], ["HI", "Himmel", 235],
  ["BL", "Blau", 260], ["IN", "Indigo", 280], ["VI", "Violett", 305], ["FL", "Flieder", 320],
  ["MA", "Magenta", 345],
];
const TONES: [string, number, number][] = [
  ["Pastell", 0.92, 0.05], ["Hell", 0.84, 0.1], ["Zart", 0.76, 0.13], ["Mittel", 0.66, 0.16],
  ["Kräftig", 0.56, 0.17], ["Dunkel", 0.44, 0.13], ["Tief", 0.32, 0.08],
];
const NEUTRALS: [string, number, number, number][] = [
  ["Schneeweiß", 0.98, 0, 0], ["Elfenbein", 0.94, 0.03, 85], ["Perlgrau", 0.82, 0.005, 250],
  ["Taupe", 0.62, 0.025, 60], ["Graphit", 0.45, 0.005, 250], ["Mokka", 0.38, 0.04, 50],
  ["Schwarz", 0.16, 0, 0],
];

function build(): RefColor[] {
  const out: RefColor[] = [];
  HUES.forEach(([code, name, h]) =>
    TONES.forEach(([tone, L, C], i) => {
      const hex = rgbToHex(oklchToRgb(L, C, h));
      out.push({ code: `${code}-${i + 1}`, name: `${name} ${tone}`, hex, lab: rgbToLab(hexToRgb(hex)) });
    }),
  );
  NEUTRALS.forEach(([name, L, C, h], i) => {
    const hex = rgbToHex(oklchToRgb(L, C, h));
    out.push({ code: `NE-${i + 1}`, name, hex, lab: rgbToLab(hexToRgb(hex)) });
  });
  return out;
}

export const REF_COLORS: RefColor[] = build();

export function matchColor(rgb: RGB, top = 3) {
  const lab = rgbToLab(rgb);
  return REF_COLORS.map((c) => ({ color: c, dE: deltaE00(lab, c.lab) }))
    .sort((a, b) => a.dE - b.dE)
    .slice(0, top);
}

export function refByCode(code?: string) {
  return REF_COLORS.find((c) => c.code === code);
}
