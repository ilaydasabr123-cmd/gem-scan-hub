import { useState } from "react";
import { Btn, Field, Input, Select, Swatch } from "@/components/kit";
import { hexToRgb, matchColor, REF_COLORS } from "@/lib/colors";
import { useData } from "@/lib/store";
import { MATERIALS, SHAPES, slotLabel, storageSlots, type Bead } from "@/lib/types";

export function BeadForm({ initial, onSave, onDelete }: { initial: Bead; onSave: (b: Bead) => void; onDelete?: () => void }) {
  const { data } = useData();
  const [b, setB] = useState<Bead>(initial);
  const set = <K extends keyof Bead>(k: K, v: Bead[K]) => setB((p) => ({ ...p, [k]: v }));
  const storage = data.storages.find((s) => s.id === b.storageId);
  const suggestion = matchColor(hexToRgb(b.hex), 1)[0];

  return (
    <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); onSave(b); }}>
      <Field label="Name" className="col-span-2"><Input value={b.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field label="Farbe">
        <div className="flex items-center gap-2"><Input type="color" value={b.hex} onChange={(e) => set("hex", e.target.value.toUpperCase())} className="w-16 p-1" /><span className="text-sm">{b.hex}</span></div>
      </Field>
      <Field label="Referenzton">
        <Select value={b.refCode ?? ""} onChange={(e) => set("refCode", e.target.value || undefined)}>
          <option value="">—</option>
          {REF_COLORS.map((c) => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
        </Select>
      </Field>
      {suggestion && b.refCode !== suggestion.color.code && (
        <button type="button" className="col-span-2 flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-left text-sm" onClick={() => set("refCode", suggestion.color.code)}>
          <Swatch hex={suggestion.color.hex} size={18} /> Vorschlag: {suggestion.color.code} {suggestion.color.name} (ΔE {suggestion.dE.toFixed(1)}) übernehmen
        </button>
      )}
      <Field label="Größe (mm)"><Input type="number" step="0.5" min="0.5" value={b.sizeMm} onChange={(e) => set("sizeMm", Number(e.target.value))} /></Field>
      <Field label="Form"><Select value={b.shape} onChange={(e) => set("shape", e.target.value)}>{SHAPES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
      <Field label="Material"><Select value={b.material} onChange={(e) => set("material", e.target.value)}>{MATERIALS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
      <Field label="Lagerort">
        <Select value={b.storageId ?? ""} onChange={(e) => { set("storageId", e.target.value || undefined); set("slot", undefined); }}>
          <option value="">—</option>
          {data.storages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      {storage?.type === "box" && (
        <Field label="Fach" className="col-span-2">
          <Select value={b.slot ?? ""} onChange={(e) => set("slot", e.target.value === "" ? undefined : Number(e.target.value))}>
            <option value="">—</option>
            {Array.from({ length: storageSlots(storage) }, (_, i) => <option key={i} value={i}>{slotLabel(storage, i)}</option>)}
          </Select>
        </Field>
      )}
      <div className="col-span-2 mt-2 flex justify-between gap-2">
        {onDelete ? <Btn type="button" variant="danger" onClick={onDelete}>Löschen</Btn> : <span />}
        <Btn type="submit">Speichern</Btn>
      </div>
    </form>
  );
}
