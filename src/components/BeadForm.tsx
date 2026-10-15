import { useState } from "react";
import { Btn, Field, Input, Select, Swatch } from "@/components/kit";
import { hexToRgb, matchColor, REF_COLORS } from "@/lib/colors";
import { useData } from "@/lib/store";
import { BEAD_EFFECTS, BEAD_MATERIALS, BEAD_SHAPES, BEAD_SIZES, BEAD_SURFACES, BEAD_TRANSPARENCY, slotLabel, storageSlots, type Bead } from "@/lib/types";

/** Auswahl mit leerem Wert; ein älterer, nicht gelisteter Wert bleibt sichtbar erhalten. */
function PropSelect({ value, options, onChange, suffix = "" }: { value?: string | number; options: (string | number)[]; onChange: (v: string | undefined) => void; suffix?: string }) {
  const legacy = value != null && value !== "" && !options.some((o) => String(o) === String(value));
  return (
    <Select value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">—</option>
      {legacy && <option value={String(value)}>{value}{suffix} (bisher)</option>}
      {options.map((o) => <option key={o} value={String(o)}>{o}{suffix}</option>)}
    </Select>
  );
}

export function BeadForm({ initial, onSave, onDelete }: { initial: Bead; onSave: (b: Bead) => void; onDelete?: () => void }) {
  const { data } = useData();
  const [b, setB] = useState<Bead>(initial);
  const set = <K extends keyof Bead>(k: K, v: Bead[K]) => setB((p) => {
    const n = { ...p, [k]: v };
    if (v === undefined) delete n[k];
    return n;
  });
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
      <Field label="Oberfläche"><PropSelect value={b.surface} options={BEAD_SURFACES} onChange={(v) => set("surface", v)} /></Field>
      <Field label="Effekt"><PropSelect value={b.effect} options={BEAD_EFFECTS} onChange={(v) => set("effect", v)} /></Field>
      <Field label="Form"><PropSelect value={b.shape} options={BEAD_SHAPES} onChange={(v) => set("shape", v)} /></Field>
      <Field label="Material"><PropSelect value={b.material} options={BEAD_MATERIALS} onChange={(v) => set("material", v)} /></Field>
      <Field label="Transparenz"><PropSelect value={b.transparency} options={BEAD_TRANSPARENCY} onChange={(v) => set("transparency", v)} /></Field>
      <Field label="Größe"><PropSelect value={b.sizeMm} options={BEAD_SIZES} suffix=" mm" onChange={(v) => set("sizeMm", v ? Number(v) : undefined)} /></Field>
      <Field label="Menge"><Input type="number" min="0" step="any" value={b.quantity ?? ""} onChange={(e) => set("quantity", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
      <Field label="Einheit">
        <Select value={b.unit ?? "stk"} onChange={(e) => set("unit", e.target.value as Bead["unit"])}>
          <option value="stk">Stück (Stk.)</option><option value="g">Gramm (g)</option>
        </Select>
      </Field>
      <Field label="Lagerort">
        <Select value={b.storageId ?? ""} onChange={(e) => { set("storageId", e.target.value || undefined); set("slot", undefined); }}>
          <option value="">—</option>
          {data.storages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      {storage?.type === "box" && (
        <Field label="Fach">
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
