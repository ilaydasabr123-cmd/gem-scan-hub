import { describe, expect, it } from "vitest";
import { deltaE00, REF_COLORS } from "@/lib/colors";
import { planBracelet } from "@/lib/bracelet";
import type { PatternModule } from "@/lib/types";

describe("Farben", () => {
  it("hat genau 126 Referenztöne", () => {
    expect(REF_COLORS).toHaveLength(126);
    expect(new Set(REF_COLORS.map((c) => c.code)).size).toBe(126);
  });
  it("CIEDE2000 stimmt mit Sharma-Testdaten überein", () => {
    expect(deltaE00([50, 2.6772, -79.7751], [50, 0, -82.7485])).toBeCloseTo(2.0425, 3);
  });
});

describe("Armband", () => {
  it("berechnet Wiederholungen für 17 cm", () => {
    const m: PatternModule = {
      id: "m", name: "x",
      bowls: [{ id: "a", label: "A", hex: "#fff", sizeMm: 4, shape: "Bicone" }],
      steps: Array.from({ length: 10 }, () => ({ kind: "bead" as const, bowlId: "a", needle: "A" as const })),
    };
    const p = planBracelet([m], 17); // 40 mm pro Baustein → 5 Wiederholungen
    expect(p.repeats).toBe(5);
    expect(p.totalBeads).toBe(50);
  });
});

import { TEMPLATES, cloneTemplate } from "@/lib/templates";
describe("Vorlagen", () => {
  it("enthält die 5 gewünschten Muster mit gültigen Schritten", () => {
    expect(TEMPLATES).toHaveLength(5);
    for (const t of TEMPLATES) {
      let n = 0;
      for (const s of t.steps) {
        if (s.kind === "bead") { expect(t.bowls.some((b) => b.id === s.bowlId)).toBe(true); n++; }
        else expect(s.target).toBeLessThan(n);
      }
      const c = cloneTemplate(t);
      expect(c.steps.filter((s) => s.kind === "bead").every((s) => s.kind === "bead" && c.bowls.some((b) => b.id === s.bowlId))).toBe(true);
    }
  });
});
