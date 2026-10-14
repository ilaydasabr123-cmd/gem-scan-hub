import type { Bowl, PatternModule } from "./types";

/** Strung beads of a module in order (pass-throughs add no bead). */
export function moduleBeads(m: PatternModule): Bowl[] {
  return m.steps.flatMap((s) => {
    if (s.kind !== "bead") return [];
    const b = m.bowls.find((x) => x.id === s.bowlId);
    return b ? [b] : [];
  });
}

/** Length in mm along the thread: sum of bead diameters. */
export function moduleLengthMm(m: PatternModule) {
  return moduleBeads(m).reduce((a, b) => a + b.sizeMm, 0);
}

export function planBracelet(modules: PatternModule[], lengthCm: number) {
  const seqMm = modules.reduce((a, m) => a + moduleLengthMm(m), 0);
  const targetMm = lengthCm * 10;
  const repeats = seqMm > 0 ? Math.max(1, Math.ceil(targetMm / seqMm)) : 0;
  const totals = new Map<string, { bowl: Bowl; count: number }>();
  for (const m of modules)
    for (const b of moduleBeads(m)) {
      const key = `${b.hex}|${b.sizeMm}|${b.shape}`;
      const e = totals.get(key) ?? { bowl: b, count: 0 };
      e.count += repeats;
      totals.set(key, e);
    }
  const list = [...totals.values()];
  return {
    seqMm,
    repeats,
    actualMm: seqMm * repeats,
    totalBeads: list.reduce((a, t) => a + t.count, 0),
    totals: list,
  };
}
