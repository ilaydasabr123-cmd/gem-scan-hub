import { describe, expect, it } from "vitest";
import { applyBulk } from "@/lib/bulk";
import { BEAD_SIZES, type Bead } from "@/lib/types";

const a: Bead = { id: "a", name: "A", hex: "#111111", sizeMm: 3, shape: "Rund", surface: "Matt", quantity: 40, unit: "g", storageId: "box", slot: 2, photo: "data:x" };
const b: Bead = { id: "b", name: "B", hex: "#222222", effect: "Opak" };
const c: Bead = { id: "c", name: "C", hex: "#333333", surface: "Satin" };

describe("Sammelbearbeitung", () => {
  it("überträgt nur gesetzte Felder auf ausgewählte Perlen", () => {
    const out = applyBulk([a, b, c], new Set(["a", "b"]), { material: { mode: "set", value: "Glas" } });
    expect(out[0]).toEqual({ ...a, material: "Glas" });
    expect(out[1]).toEqual({ ...b, material: "Glas" });
    expect(out[2]).toBe(c);
  });
  it("leert eine Eigenschaft nur bei ausdrücklicher Auswahl", () => {
    const out = applyBulk([a], new Set(["a"]), { surface: { mode: "clear" } });
    expect(out[0].surface).toBeUndefined();
    expect(out[0].quantity).toBe(40);
  });
  it("leerer Patch ändert nichts", () => {
    expect(applyBulk([a, b], new Set(["a", "b"]), {})).toEqual([a, b]);
  });
  it("Größenliste entspricht der Vorgabe", () => {
    expect(BEAD_SIZES).toEqual([2, 3, 4, 5, 6, 7, 8, 10]);
  });
});
