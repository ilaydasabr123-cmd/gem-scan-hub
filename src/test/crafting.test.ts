import { describe, expect, it } from "vitest";
import { craftPlan, craftSequence } from "@/lib/crafting";
import { planBracelet } from "@/lib/bracelet";
import type { PatternModule } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";

const flower: PatternModule = {
  id: "flower", name: "Blüte",
  bowls: [{ id: "pink", label: "Blütenblätter", hex: "#E8B4B8", sizeMm: 4, shape: "Rund" }],
  steps: [
    { kind: "bead", bowlId: "pink", needle: "A" },
    { kind: "pass", target: 0, needle: "B" },
    { kind: "bead", bowlId: "pink", needle: "B" },
    { kind: "pass", target: 1, needle: "A" },
  ],
};

describe("Bastelschritte", () => {
  it("zeigt Schälchen, Farbe, Größe, Form und das originale Fadenende", () => {
    const step = craftSequence([flower])[2];
    expect(step.bowl).toEqual({ id: "pink", label: "Blütenblätter", hex: "#E8B4B8", sizeMm: 4, shape: "Rund" });
    expect(step.step).toEqual({ kind: "bead", bowlId: "pink", needle: "B" });
  });

  it("löst Durchgänge als Perlenindex statt als Fädelschrittindex auf", () => {
    const step = craftSequence([flower])[3];
    expect(step.bowl?.id).toBe("pink");
    expect(step.beadNumber).toBe(2);
    expect(step.step.kind).toBe("pass");
  });

  it("wiederholt die gesamte Abfolge und setzt Zielperlen pro Baustein korrekt um", () => {
    const cross = { ...flower, id: "cross", name: "Kreuz" };
    const plan = craftPlan({ title: "Armband", modules: [flower, cross], repeats: 2 });
    expect(plan.total).toBe(16);
    expect(plan.at(7)).toMatchObject({ moduleName: "Kreuz", beadNumber: 4, repeat: 1, localStep: 4 });
    expect(plan.at(8)).toMatchObject({ moduleName: "Blüte", beadNumber: 5, repeat: 2, localStep: 1 });
    expect(plan.at(15)).toMatchObject({ moduleName: "Kreuz", beadNumber: 8, repeat: 2 });
    expect(plan.at(-1)).toBeUndefined();
    expect(plan.at(16)).toBeUndefined();
  });

  it("enthält für ein 17-cm-Armband alle berechneten Wiederholungen und Durchgänge", () => {
    const modules = [TEMPLATES[0], TEMPLATES[1]];
    const bracelet = planBracelet(modules, 17);
    const plan = craftPlan({ title: "17 cm", modules, repeats: bracelet.repeats });
    expect(plan.total).toBe(modules.reduce((sum, m) => sum + m.steps.length, 0) * bracelet.repeats);
    let beads = 0;
    for (let i = 0; i < plan.total; i++) if (plan.at(i)?.step.kind === "bead") beads++;
    expect(beads).toBe(bracelet.totalBeads);
  });

  it("löst jede Vorlage vollständig auf und verändert keine gespeicherten Schritte", () => {
    for (const template of TEMPLATES) {
      const before = JSON.stringify(template);
      const steps = craftSequence([template]);
      expect(steps).toHaveLength(template.steps.length);
      expect(steps.every((s) => s.bowl !== undefined)).toBe(true);
      expect(JSON.stringify(template)).toBe(before);
    }
  });

  it("behandelt leere Muster und fehlende Perlendaten ohne Ersatzperlen", () => {
    expect(craftPlan({ title: "Leer", modules: [], repeats: 1 }).at(0)).toBeUndefined();
    expect(craftSequence([{ ...flower, bowls: [] }])[0].bowl).toBeUndefined();
  });
});