import { useState } from "react";
import { Btn, Field, Input, Select } from "@/components/kit";
import type { BulkField, BulkOp, BulkPatch } from "@/lib/bulk";
import { BEAD_EFFECTS, BEAD_MATERIALS, BEAD_SHAPES, BEAD_SIZES, BEAD_SURFACES, BEAD_TRANSPARENCY, UNIT_LABEL } from "@/lib/types";

const KEEP = "__keep__";
const CLEAR = "__clear__";

const FIELDS: { key: BulkField; label: string; options?: (string | number)[]; suffix?: string }[] = [
  { key: "surface", label: "Oberfläche", options: BEAD_SURFACES },
  { key: "effect", label: "Effekt", options: BEAD_EFFECTS },
  { key: "shape", label: "Form", options: BEAD_SHAPES },
  { key: "material", label: "Material", options: BEAD_MATERIALS },
  { key: "transparency", label: "Transparenz", options: BEAD_TRANSPARENCY },
  { key: "sizeMm", label: "Größe", options: BEAD_SIZES, suffix: " mm" },
];

const fmt = (k: BulkField, op: BulkOp) => {
  if (op.mode === "clear") return "wird geleert";
  if (k === "sizeMm") return `→ ${op.value} mm`;
  if (k === "unit") return `→ ${UNIT_LABEL[op.value as "stk" | "g"]}`;
  return `→ ${op.value}`;
};
const LABELS: Record<BulkField, string> = { surface: "Oberfläche", effect: "Effekt", shape: "Form", material: "Material", transparency: "Transparenz", sizeMm: "Größe", quantity: "Menge", unit: "Einheit" };

export function BulkEditForm({ count, onApply, onCancel }: { count: number; onApply: (p: BulkPatch) => void; onCancel: () => void }) {
  const [patch, setPatch] = useState<BulkPatch>({});
  const [qtyMode, setQtyMode] = useState<"keep" | "set" | "clear">("keep");
  const [qty, setQty] = useState("");
  const [confirm, setConfirm] = useState(false);

  const setOp = (k: BulkField, v: string) => setPatch((p) => {
    const n = { ...p };
    if (v === KEEP) delete n[k];
    else n[k] = v === CLEAR ? { mode: "clear" } : { mode: "set", value: k === "sizeMm" ? Number(v) : v };
    return n;
  });
  const sel = (k: BulkField) => { const op = patch[k]; return !op ? KEEP : op.mode === "clear" ? CLEAR : String(op.value); };

  const full: BulkPatch = { ...patch };
  if (qtyMode === "clear") full.quantity = { mode: "clear" };
  if (qtyMode === "set" && qty !== "") full.quantity = { mode: "set", value: Number(qty) };
  const changes = Object.entries(full) as [BulkField, BulkOp][];

  if (confirm)
    return (
      <div>
        <p className="mb-3 text-sm">Diese Änderungen werden auf <strong>{count} Perlen</strong> angewendet. Alle anderen Angaben bleiben unverändert.</p>
        <ul className="mb-4 space-y-1 rounded-xl bg-muted p-3 text-sm">
          {changes.map(([k, op]) => <li key={k}><span className="font-medium">{LABELS[k]}</span> {fmt(k, op)}</li>)}
        </ul>
        <div className="flex justify-between gap-2">
          <Btn variant="soft" onClick={() => setConfirm(false)}>Zurück</Btn>
          <Btn onClick={() => onApply(full)}>Jetzt übernehmen</Btn>
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3">
      <p className="col-span-2 text-sm text-muted-foreground">Nur Felder, die du änderst, werden übertragen. „Keine Änderung“ lässt den Wert jeder Perle unangetastet.</p>
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label}>
          <Select value={sel(f.key)} onChange={(e) => setOp(f.key, e.target.value)}>
            <option value={KEEP}>Keine Änderung</option>
            {f.options!.map((o) => <option key={o} value={String(o)}>{o}{f.suffix ?? ""}</option>)}
            <option value={CLEAR}>✕ Eigenschaft leeren</option>
          </Select>
        </Field>
      ))}
      <Field label="Menge">
        <Select value={qtyMode} onChange={(e) => setQtyMode(e.target.value as typeof qtyMode)}>
          <option value="keep">Keine Änderung</option>
          <option value="set">Neuen Wert setzen</option>
          <option value="clear">✕ Menge leeren</option>
        </Select>
      </Field>
      <Field label="Einheit">
        <Select value={sel("unit")} onChange={(e) => setOp("unit", e.target.value)}>
          <option value={KEEP}>Keine Änderung</option>
          <option value="stk">Stück (Stk.)</option>
          <option value="g">Gramm (g)</option>
        </Select>
      </Field>
      {qtyMode === "set" && <Field label="Neue Menge" className="col-span-2"><Input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>}
      <div className="col-span-2 mt-2 flex justify-between gap-2">
        <Btn variant="soft" onClick={onCancel}>Abbrechen</Btn>
        <Btn disabled={!changes.length} onClick={() => setConfirm(true)}>Weiter zur Zusammenfassung</Btn>
      </div>
    </div>
  );
}
