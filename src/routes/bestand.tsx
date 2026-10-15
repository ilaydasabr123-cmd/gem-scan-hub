import { createFileRoute } from "@tanstack/react-router";
import { Box, LayoutGrid, Plus, Rows3, Trash2 } from "lucide-react";
import { useState } from "react";
import { BeadForm } from "@/components/BeadForm";
import { BulkEditForm } from "@/components/BulkEditForm";
import { applyBulk } from "@/lib/bulk";
import { Btn, Card, Field, Input, Modal, PageHeader, Select, Swatch } from "@/components/kit";
import { meta } from "@/lib/meta";
import { useData } from "@/lib/store";
import { qtyLabel, slotLabel, uid, type Bead, type Storage, type StorageType } from "@/lib/types";

export const Route = createFileRoute("/bestand")({
  head: () => meta("Bestand & Lager", "Alle Perlen mit Farbe, Größe, Form und Lagerort verwalten."),
  component: Bestand,
});

const newBead = (): Bead => ({ id: uid(), name: "Neue Perle", hex: "#E8B4B8", unit: "stk" });
const TYPE_LABEL: Record<StorageType, string> = { box: "Sortierbox", smallJar: "Kleine Dose", largeJar: "Große Dose" };

function Bestand() {
  const { data, update } = useData();
  const [tab, setTab] = useState<"perlen" | "lager">("perlen");
  const [view, setView] = useState<"table" | "tiles">("table");
  const [edit, setEdit] = useState<Bead | null>(null);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState(false);
  const [notice, setNotice] = useState("");
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const st = (id?: string) => data.storages.find((s) => s.id === id);
  const beads = data.beads.filter((b) => [b.name, b.refCode, b.hex, b.shape, b.material, b.surface, b.effect, b.transparency].join(" ").toLowerCase().includes(q.toLowerCase()));

  const save = (b: Bead) => {
    update("beads", (prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b]));
    setEdit(null);
  };

  return (
    <div>
      <PageHeader title="Bestand & Lager" subtitle={`${data.beads.length} Perlen · ${data.storages.length} Lagerorte`}>
        <Btn variant={tab === "perlen" ? "primary" : "soft"} onClick={() => setTab("perlen")}>Perlen</Btn>
        <Btn variant={tab === "lager" ? "primary" : "soft"} onClick={() => setTab("lager")}>Lagerverwaltung</Btn>
      </PageHeader>

      {tab === "perlen" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input placeholder="Suchen…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1" />
            <Btn variant="soft" onClick={() => setView("table")} aria-label="Tabelle"><Rows3 size={18} /></Btn>
            <Btn variant="soft" onClick={() => setView("tiles")} aria-label="Kacheln"><LayoutGrid size={18} /></Btn>
            <Btn onClick={() => setEdit(newBead())}><Plus size={18} /> Perle anlegen</Btn>
          </div>
          {beads.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl bg-secondary px-4 py-2 text-sm">
              <label className="flex min-h-11 items-center gap-2">
                <input type="checkbox" className="h-5 w-5 accent-primary" checked={beads.every((b) => picked.has(b.id))} onChange={(e) => setPicked(e.target.checked ? new Set([...picked, ...beads.map((b) => b.id)]) : new Set([...picked].filter((id) => !beads.some((b) => b.id === id))))} />
                Alle auswählen
              </label>
              <span className="font-medium">{picked.size} Perlen ausgewählt</span>
              {picked.size > 0 && <Btn size="sm" variant="ghost" onClick={() => setPicked(new Set())}>Auswahl aufheben</Btn>}
              <Btn size="sm" className="ml-auto" disabled={!picked.size} onClick={() => setBulk(true)}>Ausgewählte Perlen bearbeiten</Btn>
            </div>
          )}
          {notice && <p role="status" className="mb-3 rounded-xl bg-accent px-4 py-2 text-sm">{notice}</p>}
          {beads.length === 0 && <Card><p className="text-muted-foreground">Noch keine Perlen. Lege eine an oder übernimm sie aus dem Foto-Scan.</p></Card>}
          {view === "table" && beads.length > 0 && (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-muted-foreground">
                  <tr><th className="w-10 px-4 py-3"><span className="sr-only">Auswahl</span></th>{["Farbe", "Name", "Code", "Größe", "Form", "Material", "Oberfläche", "Effekt", "Transparenz", "Menge", "Lagerort"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {beads.map((b) => (
                    <tr key={b.id} className="cursor-pointer border-t border-border hover:bg-accent/50" onClick={() => setEdit(b)}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`${b.name} auswählen`} className="h-5 w-5 accent-primary" checked={picked.has(b.id)} onChange={() => toggle(b.id)} /></td>
                      <td className="px-4 py-3"><Swatch hex={b.hex} /></td>
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3">{b.refCode ?? b.hex}</td>
                      <td className="px-4 py-3">{b.sizeMm != null ? `${b.sizeMm} mm` : "—"}</td>
                      <td className="px-4 py-3">{b.shape ?? "—"}</td>
                      <td className="px-4 py-3">{b.material ?? "—"}</td>
                      <td className="px-4 py-3">{b.surface ?? "—"}</td>
                      <td className="px-4 py-3">{b.effect ?? "—"}</td>
                      <td className="px-4 py-3">{b.transparency ?? "—"}</td>
                      <td className="px-4 py-3">{qtyLabel(b)}</td>
                      <td className="px-4 py-3">{slotLabel(st(b.storageId), b.slot)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {view === "tiles" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {beads.map((b) => (
                <div key={b.id} className={`relative rounded-2xl border bg-card shadow-soft ${picked.has(b.id) ? "border-primary" : "border-border"}`}>
                <input type="checkbox" aria-label={`${b.name} auswählen`} className="absolute right-3 top-3 z-10 h-6 w-6 accent-primary" checked={picked.has(b.id)} onChange={() => toggle(b.id)} />
                <button onClick={() => setEdit(b)} className="w-full rounded-2xl p-4 text-left hover:bg-accent/40">
                  {b.photo ? <img src={b.photo} alt="" className="mb-3 h-16 w-16 rounded-full object-cover" /> : <Swatch hex={b.hex} size={64} className="mb-3" />}
                  <div className="truncate font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">{b.refCode ?? b.hex} · {[b.sizeMm != null ? `${b.sizeMm} mm` : null, b.shape].filter(Boolean).join(" ")}</div>
                  <div className="truncate text-xs text-muted-foreground">{[b.surface, b.effect, b.transparency].filter(Boolean).join(" · ") || "\u00a0"} · {qtyLabel(b)}</div>
                  <div className="truncate text-xs text-muted-foreground">{slotLabel(st(b.storageId), b.slot)}</div>
                </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Lager />
      )}

      <Modal open={bulk} onClose={() => setBulk(false)} title={`${picked.size} Perlen bearbeiten`}>
        {bulk && (
          <BulkEditForm
            count={picked.size}
            onCancel={() => setBulk(false)}
            onApply={(patch) => { update("beads", (p) => applyBulk(p, picked, patch)); setNotice(`${picked.size} Perlen wurden aktualisiert.`); setBulk(false); }}
          />
        )}
      </Modal>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Perle bearbeiten">
        {edit && (
          <BeadForm
            key={edit.id}
            initial={edit}
            onSave={save}
            onDelete={data.beads.some((x) => x.id === edit.id) ? () => { update("beads", (p) => p.filter((x) => x.id !== edit.id)); setEdit(null); } : undefined}
          />
        )}
      </Modal>
    </div>
  );
}

function Lager() {
  const { data, update } = useData();
  const [form, setForm] = useState({ name: "", type: "box" as StorageType, cols: 7, rows: 4, count: 1 });
  const [sel, setSel] = useState<string | null>(null);

  const add = () => {
    const items: Storage[] = Array.from({ length: form.type === "box" ? 1 : form.count }, (_, i) => ({
      id: uid(),
      name: form.name || (form.type === "box" ? `Box ${data.storages.filter((s) => s.type === "box").length + 1}` : `${TYPE_LABEL[form.type]} ${data.storages.filter((s) => s.type === form.type).length + i + 1}`),
      type: form.type,
      cols: form.type === "box" ? form.cols : 1,
      rows: form.type === "box" ? form.rows : 1,
    }));
    if (form.type !== "box" && form.name && form.count > 1) items.forEach((s, i) => (s.name = `${form.name} ${i + 1}`));
    update("storages", (p) => [...p, ...items]);
    setForm((f) => ({ ...f, name: "" }));
  };

  const selected = data.storages.find((s) => s.id === sel);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-display text-xl font-semibold">Lagerort anlegen</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Typ" className="col-span-2">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as StorageType })}>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Name (optional)" className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            {form.type === "box" ? (
              <>
                <Field label="Spalten"><Input type="number" min={1} max={20} value={form.cols} onChange={(e) => setForm({ ...form, cols: Number(e.target.value) })} /></Field>
                <Field label="Zeilen"><Input type="number" min={1} max={20} value={form.rows} onChange={(e) => setForm({ ...form, rows: Number(e.target.value) })} /></Field>
              </>
            ) : (
              <Field label="Anzahl" className="col-span-2"><Input type="number" min={1} max={60} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} /></Field>
            )}
          </div>
          <Btn className="mt-4 w-full" onClick={add}><Plus size={18} /> Anlegen</Btn>
        </Card>
        <Card className="p-2">
          {data.storages.length === 0 && <p className="p-3 text-muted-foreground">Noch keine Lagerorte.</p>}
          {data.storages.map((s) => (
            <div key={s.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${sel === s.id ? "bg-accent" : ""}`}>
              <button className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSel(s.id)}>
                <Box size={18} className="shrink-0 text-primary" />
                <span className="truncate font-medium">{s.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{TYPE_LABEL[s.type]}{s.type === "box" ? ` ${s.cols}×${s.rows}` : ""}</span>
              </button>
              <Btn variant="ghost" size="sm" aria-label="Löschen" onClick={() => { update("storages", (p) => p.filter((x) => x.id !== s.id)); update("beads", (p) => p.map((b) => (b.storageId === s.id ? { ...b, storageId: undefined, slot: undefined } : b))); }}><Trash2 size={16} /></Btn>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        {selected ? <StorageView s={selected} /> : <p className="text-muted-foreground">Wähle einen Lagerort, um die Belegung zu sehen.</p>}
      </Card>
    </div>
  );
}

function StorageView({ s }: { s: Storage }) {
  const { data } = useData();
  const beads = data.beads.filter((b) => b.storageId === s.id);
  if (s.type !== "box")
    return (
      <div>
        <h2 className="mb-4 font-display text-2xl font-semibold">{s.name}</h2>
        <div className="mx-auto flex aspect-square w-48 flex-wrap content-center items-center justify-center gap-2 rounded-full border-8 border-secondary bg-muted p-6">
          {beads.length ? beads.map((b) => <Swatch key={b.id} hex={b.hex} size={36} />) : <span className="text-sm text-muted-foreground">leer</span>}
        </div>
        <ul className="mt-4 text-sm">{beads.map((b) => <li key={b.id}>{b.name} · {b.refCode ?? b.hex}</li>)}</ul>
      </div>
    );
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-semibold">{s.name}</h2>
      <div className="grid gap-1.5 rounded-2xl bg-secondary p-2" style={{ gridTemplateColumns: `repeat(${s.cols}, minmax(0,1fr))` }}>
        {Array.from({ length: s.cols * s.rows }, (_, i) => {
          const inSlot = beads.filter((b) => b.slot === i);
          return (
            <div key={i} title={slotLabel(s, i)} className="flex aspect-square flex-wrap items-center justify-center gap-0.5 rounded-lg bg-card p-1">
              {inSlot.length ? inSlot.map((b) => <Swatch key={b.id} hex={b.hex} size={18} />) : <span className="text-[10px] text-muted-foreground">{String.fromCharCode(65 + Math.floor(i / s.cols))}{(i % s.cols) + 1}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
