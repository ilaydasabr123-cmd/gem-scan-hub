import { createFileRoute } from "@tanstack/react-router";
import { Plus, Save, Trash2, Undo2, X } from "lucide-react";
import { useState } from "react";
import { Btn, Card, Field, Input, PageHeader, Select, Swatch } from "@/components/kit";
import { moduleBeads, moduleLengthMm, planBracelet } from "@/lib/bracelet";
import { meta } from "@/lib/meta";
import { useData } from "@/lib/store";
import { SHAPES, uid, type Bowl, type PatternModule, type Step } from "@/lib/types";

export const Route = createFileRoute("/atelier")({
  head: () => meta("Perlenatelier & Armband-Designer", "Muster auf der virtuellen Perlenmatte fädeln und Armbänder planen."),
  component: Atelier,
});

const defaultBowls = (): Bowl[] => [
  { id: uid(), label: "A", hex: "#E8B4B8", sizeMm: 2, shape: "Rocaille" },
  { id: uid(), label: "B", hex: "#C9A27E", sizeMm: 4, shape: "Bicone" },
];

function Atelier() {
  const [tab, setTab] = useState<"matte" | "armband">("matte");
  return (
    <div>
      <PageHeader title="Perlenatelier" subtitle="Dein digitaler Basteltisch.">
        <Btn variant={tab === "matte" ? "primary" : "soft"} onClick={() => setTab("matte")}>Perlenmatte</Btn>
        <Btn variant={tab === "armband" ? "primary" : "soft"} onClick={() => setTab("armband")}>Armband-Baukasten</Btn>
      </PageHeader>
      {tab === "matte" ? <Matte /> : <Armband />}
    </div>
  );
}

function Matte() {
  const { data, update } = useData();
  const [bowls, setBowls] = useState<Bowl[]>(defaultBowls);
  const [steps, setSteps] = useState<Step[]>([]);
  const [needle, setNeedle] = useState<"A" | "B">("A");
  const [name, setName] = useState("Blume");
  const [editId, setEditId] = useState<string | null>(null);

  const mod: PatternModule = { id: editId ?? "draft", name, bowls, steps };
  const beads = moduleBeads(mod);
  const setBowl = (id: string, patch: Partial<Bowl>) => setBowls((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = () => {
    if (!beads.length) return;
    const m: PatternModule = { ...mod, id: editId ?? uid() };
    update("modules", (p) => (editId ? p.map((x) => (x.id === editId ? m : x)) : [...p, m]));
    setEditId(m.id);
  };
  const loadMod = (m: PatternModule) => { setBowls(m.bowls); setSteps(m.steps); setName(m.name); setEditId(m.id); };
  const reset = () => { setSteps([]); setEditId(null); setName("Neues Muster"); };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">Perlen-Schälchen</h2>
            <Btn size="sm" variant="soft" onClick={() => setBowls((b) => [...b, { id: uid(), label: String.fromCharCode(65 + b.length), hex: "#B8C4D6", sizeMm: 3, shape: "Rund" }])}><Plus size={16} /> Schälchen</Btn>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {bowls.map((b) => (
              <div key={b.id} className="rounded-2xl bg-muted p-3">
                <button
                  onClick={() => setSteps((s) => [...s, { kind: "bead", bowlId: b.id, needle }])}
                  className="mx-auto flex h-24 w-24 touch-manipulation flex-wrap content-center items-center justify-center gap-1 rounded-full border-4 border-card bg-secondary shadow-inner active:scale-95"
                  aria-label={`Perle aus Schälchen ${b.label} auffädeln`}
                >
                  {Array.from({ length: 7 }, (_, i) => <Swatch key={i} hex={b.hex} size={Math.min(18, 6 + b.sizeMm * 2.5)} />)}
                </button>
                <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5 text-xs">
                  <input type="color" value={b.hex} onChange={(e) => setBowl(b.id, { hex: e.target.value })} className="h-8 w-8 rounded" aria-label="Farbe" />
                  <span className="truncate font-semibold">Schälchen {b.label}</span>
                  <Input type="number" step="0.5" min="1" value={b.sizeMm} onChange={(e) => setBowl(b.id, { sizeMm: Number(e.target.value) })} className="col-span-2 min-h-9 text-xs" aria-label="mm" />
                  <Select value={b.shape} onChange={(e) => setBowl(b.id, { shape: e.target.value })} className="col-span-2 min-h-9 text-xs">{SHAPES.map((s) => <option key={s}>{s}</option>)}</Select>
                  <span className="col-span-2 text-muted-foreground">{b.sizeMm} mm {b.shape}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto font-display text-xl font-semibold">Faden</h2>
            <span className="text-sm text-muted-foreground">Aktive Nadel:</span>
            <button onClick={() => setNeedle("A")} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${needle === "A" ? "bg-needle-a text-primary-foreground" : "bg-secondary"}`}>Nadel A</button>
            <button onClick={() => setNeedle("B")} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${needle === "B" ? "bg-needle-b text-primary-foreground" : "bg-secondary"}`}>Nadel B</button>
            <Btn size="sm" variant="ghost" onClick={() => setSteps((s) => s.slice(0, -1))} disabled={!steps.length}><Undo2 size={16} /></Btn>
            <Btn size="sm" variant="ghost" onClick={() => setSteps([])} disabled={!steps.length}><X size={16} /></Btn>
          </div>
          <Thread mod={mod} onBeadTap={(i) => setSteps((s) => [...s, { kind: "pass", target: i, needle }])} />
          <p className="mt-2 text-xs text-muted-foreground">Schälchen antippen = Perle auffädeln · aufgefädelte Perle antippen = Faden erneut hindurchführen / kreuzen.</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Field label="Baustein-Name" className="min-w-0 flex-1"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Btn onClick={save} disabled={!beads.length}><Save size={18} /> {editId ? "Aktualisieren" : "Als Baustein speichern"}</Btn>
            <Btn variant="soft" onClick={reset}>Neu</Btn>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{beads.length} Perlen · {steps.filter((s) => s.kind === "pass").length} Durchgänge · {moduleLengthMm(mod).toFixed(1)} mm</p>
        </Card>
      </div>

      <Card className="h-fit">
        <h2 className="mb-3 font-display text-xl font-semibold">Bausteine</h2>
        {data.modules.length === 0 && <p className="text-sm text-muted-foreground">Noch keine gespeicherten Muster.</p>}
        <div className="space-y-2">
          {data.modules.map((m) => (
            <div key={m.id} className={`flex items-center gap-2 rounded-xl p-2 ${editId === m.id ? "bg-accent" : "bg-muted"}`}>
              <button className="min-w-0 flex-1 text-left" onClick={() => loadMod(m)}>
                <div className="truncate font-medium">{m.name}</div>
                <div className="flex gap-0.5">{moduleBeads(m).slice(0, 14).map((b, i) => <Swatch key={i} hex={b.hex} size={10} />)}</div>
              </button>
              <Btn size="sm" variant="ghost" aria-label="Löschen" onClick={() => update("modules", (p) => p.filter((x) => x.id !== m.id))}><Trash2 size={14} /></Btn>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Thread({ mod, onBeadTap }: { mod: PatternModule; onBeadTap?: (i: number) => void }) {
  const beads = moduleBeads(mod);
  const perRow = 12, sp = 40;
  const pos = (i: number) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    return { x: 30 + (r % 2 ? perRow - 1 - c : c) * sp, y: 34 + r * 60 };
  };
  const H = 34 + Math.max(1, Math.ceil(beads.length / perRow)) * 60;
  // trace thread paths per needle
  const paths: Record<"A" | "B", { x: number; y: number }[]> = { A: [], B: [] };
  let n = 0;
  for (const s of mod.steps) {
    if (s.kind === "bead") paths[s.needle].push(pos(n++));
    else if (s.target < n) paths[s.needle].push(pos(s.target));
  }
  const d = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const q = pts[i - 1];
      const dist = Math.hypot(p.x - q.x, p.y - q.y);
      return dist > sp * 1.5 ? `Q${(p.x + q.x) / 2},${Math.min(p.y, q.y) - 28 - dist * 0.08} ${p.x},${p.y}` : `L${p.x},${p.y}`;
    }).join(" ");

  return (
    <div className="overflow-x-auto rounded-2xl bg-secondary/60 p-2">
      <svg viewBox={`0 0 ${30 * 2 + (perRow - 1) * sp} ${H}`} className="w-full min-w-[480px]">
        <path d={d(paths.A)} fill="none" className="stroke-needle-a" strokeWidth={2} />
        <path d={d(paths.B)} fill="none" className="stroke-needle-b" strokeWidth={2} strokeDasharray="5 3" />
        {beads.map((b, i) => {
          const p = pos(i);
          const r = Math.min(17, 5 + b.sizeMm * 2.2);
          return (
            <g key={i} onClick={() => onBeadTap?.(i)} className={onBeadTap ? "cursor-pointer" : ""}>
              {b.shape === "Bicone" ? (
                <polygon points={`${p.x},${p.y - r} ${p.x + r},${p.y} ${p.x},${p.y + r} ${p.x - r},${p.y}`} fill={b.hex} className="stroke-foreground/20" />
              ) : (
                <circle cx={p.x} cy={p.y} r={r} fill={b.hex} className="stroke-foreground/20" />
              )}
              <circle cx={p.x - r * 0.35} cy={p.y - r * 0.35} r={r * 0.25} className="fill-card/60" />
            </g>
          );
        })}
        {!beads.length && <text x="50%" y={H / 2} textAnchor="middle" className="fill-muted-foreground text-sm">Leerer Faden – tippe ein Schälchen an</text>}
      </svg>
    </div>
  );
}

function Armband() {
  const { data, update } = useData();
  const [seq, setSeq] = useState<string[]>([]);
  const [len, setLen] = useState(17);
  const [name, setName] = useState("Mein Armband");
  const mods = seq.map((id) => data.modules.find((m) => m.id === id)).filter((m): m is PatternModule => !!m);
  const plan = planBracelet(mods, len);

  const ring = Array.from({ length: plan.repeats }, () => mods.flatMap(moduleBeads)).flat();
  const R = 120;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-display text-xl font-semibold">Bausteine hinzufügen</h2>
          {data.modules.length === 0 && <p className="text-sm text-muted-foreground">Speichere zuerst Muster auf der Perlenmatte.</p>}
          <div className="flex flex-wrap gap-2">
            {data.modules.map((m) => <Btn key={m.id} variant="soft" onClick={() => setSeq((s) => [...s, m.id])}><Plus size={16} /> {m.name}</Btn>)}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-xl font-semibold">Abfolge (eine Wiederholung)</h2>
          {mods.length === 0 && <p className="text-sm text-muted-foreground">z. B. Blume → Kreuz → Blume</p>}
          <div className="flex flex-wrap items-center gap-2">
            {mods.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pr-1 pl-3 text-sm">
                {m.name}
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-card" onClick={() => setSeq((s) => s.filter((_, k) => k !== i))} aria-label="Entfernen"><X size={14} /></button>
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Armbandlänge (cm)"><Input type="number" step="0.5" min="5" value={len} onChange={(e) => setLen(Number(e.target.value))} /></Field>
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          </div>
          <Btn className="mt-3" disabled={!mods.length} onClick={() => update("bracelets", (p) => [...p, { id: uid(), name, moduleIds: seq, lengthCm: len }])}><Save size={18} /> Armband speichern</Btn>
        </Card>
        {data.bracelets.length > 0 && (
          <Card>
            <h2 className="mb-2 font-display text-xl font-semibold">Gespeicherte Armbänder</h2>
            {data.bracelets.map((b) => (
              <div key={b.id} className="flex items-center gap-2 py-1">
                <button className="min-w-0 flex-1 truncate text-left" onClick={() => { setSeq(b.moduleIds); setLen(b.lengthCm); setName(b.name); }}>{b.name} · {b.lengthCm} cm</button>
                <Btn size="sm" variant="ghost" onClick={() => update("bracelets", (p) => p.filter((x) => x.id !== b.id))}><Trash2 size={14} /></Btn>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Card>
        <h2 className="mb-3 font-display text-xl font-semibold">Berechnung & Vorschau</h2>
        {mods.length === 0 ? <p className="text-muted-foreground">Füge Bausteine hinzu.</p> : (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat v={`${plan.repeats}×`} l="Wiederholungen" />
              <Stat v={`${plan.totalBeads}`} l="Perlen gesamt" />
              <Stat v={`${(plan.actualMm / 10).toFixed(1)} cm`} l="Ergebnislänge" />
            </div>
            <svg viewBox="-150 -150 300 300" className="mx-auto my-4 w-full max-w-sm">
              <circle r={R} fill="none" className="stroke-border" strokeWidth={1} />
              {ring.map((b, i) => {
                const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
                const r = Math.max(2, Math.min(9, (Math.PI * 2 * R) / ring.length / 2 * (b.sizeMm / 3)));
                return <circle key={i} cx={Math.cos(a) * R} cy={Math.sin(a) * R} r={r} fill={b.hex} className="stroke-foreground/20" strokeWidth={0.5} />;
              })}
            </svg>
            <h3 className="mb-2 font-semibold">Einkaufsliste</h3>
            <ul className="space-y-1 text-sm">
              {plan.totals.map((t, i) => (
                <li key={i} className="flex items-center gap-2"><Swatch hex={t.bowl.hex} size={16} /> {t.bowl.sizeMm} mm {t.bowl.shape} <span className="ml-auto font-semibold">{t.count} Stk.</span></li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return <div className="rounded-xl bg-muted p-3"><div className="font-display text-2xl font-semibold">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>;
}
