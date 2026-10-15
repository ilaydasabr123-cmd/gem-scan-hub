import type { Bead } from "./types";

/** Felder, die in der Sammelbearbeitung geändert werden dürfen. */
export const BULK_FIELDS = ["surface", "effect", "shape", "material", "transparency", "sizeMm", "quantity", "unit"] as const;
export type BulkField = (typeof BULK_FIELDS)[number];

/** Fehlt ein Feld im Patch, bleibt es unverändert ("Keine Änderung"). */
export type BulkOp = { mode: "set"; value: string | number } | { mode: "clear" };
export type BulkPatch = Partial<Record<BulkField, BulkOp>>;

export function applyBulk(beads: Bead[], ids: Set<string>, patch: BulkPatch): Bead[] {
  const entries = Object.entries(patch) as [BulkField, BulkOp][];
  if (!entries.length) return beads;
  return beads.map((b) => {
    if (!ids.has(b.id)) return b;
    const next: Record<string, unknown> = { ...b };
    for (const [k, op] of entries) {
      if (op.mode === "clear") delete next[k];
      else next[k] = op.value;
    }
    return next as unknown as Bead;
  });
}
