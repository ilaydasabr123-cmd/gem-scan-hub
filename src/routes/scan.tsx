import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, Lock, ScanLine, Unlock, Upload } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as RPE } from "react";
import { Btn, Card, Field, Input, PageHeader, Select, Swatch } from "@/components/kit";
import { matchColor, rgbToHex, rgbToLab, type RGB } from "@/lib/colors";
import { meta } from "@/lib/meta";
import { homography, robustColor, samplePixels, type Pt } from "@/lib/scan";
import { useData } from "@/lib/store";
import { uid, type Bead, type StorageType } from "@/lib/types";

export const Route = createFileRoute("/scan")({
  head: () => meta("Foto-Scan & Farberkennung", "Sortierkästen und Dosen fotografieren, Farben per CIEDE2000 erkennen."),
  component: Scan,
});

interface Result { idx: number; label: string; rgb: RGB; thumb: string; large?: boolean; added?: boolean }

const MAX = 1600;

function Scan() {
  const { data, update } = useData();
  const [mode, setMode] = useState<"box" | "jars">("box");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [imgData, setImgData] = useState<ImageData | null>(null);
  const [corners, setCorners] = useState<Pt[]>([]);
  const [locked, setLocked] = useState(false);
  const [cols, setCols] = useState(7);
  const [rows, setRows] = useState(4);
  const [margin, setMargin] = useState(18);
  const [filter, setFilter] = useState(true);
  const [small, setSmall] = useState(6);
  const [large, setLarge] = useState(0);
  const [isLarge, setIsLarge] = useState<boolean[]>([]);
  const [dividers, setDividers] = useState<number[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [target, setTarget] = useState("");
  const [size, setSize] = useState(2);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ kind: "c" | "d"; i: number } | null>(null);

  const jarCount = small + large;

  // keep large-flags consistent with counts
  useEffect(() => {
    setIsLarge((prev) => {
      const arr = Array.from({ length: jarCount }, (_, i) => prev[i] ?? false);
      let l = arr.filter(Boolean).length;
      for (let i = 0; i < arr.length && l < large; i++) if (!arr[i]) { arr[i] = true; l++; }
      for (let i = arr.length - 1; i >= 0 && l > large; i--) if (arr[i]) { arr[i] = false; l--; }
      return arr;
    });
  }, [jarCount, large]);

  // proportional dividers when jar layout changes
  useEffect(() => {
    const w = isLarge.map((x) => (x ? 1.5 : 1));
    const sum = w.reduce((a, b) => a + b, 0);
    let acc = 0;
    setDividers(w.slice(0, -1).map((x) => (acc += x) / sum));
  }, [isLarge]);

  const load = (file: File) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, MAX / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      const ctx = c.getContext("2d")!;
      ctx.drawImage(im, 0, 0, c.width, c.height);
      setImgData(ctx.getImageData(0, 0, c.width, c.height));
      const disp = new Image();
      disp.src = c.toDataURL("image/jpeg", 0.9);
      setImg(disp);
      const W = c.width, H = c.height;
      setCorners([{ x: W * 0.08, y: H * 0.08 }, { x: W * 0.92, y: H * 0.08 }, { x: W * 0.92, y: H * 0.92 }, { x: W * 0.08, y: H * 0.92 }]);
      setLocked(false);
      setResults([]);
    };
    im.src = url;
  };

  const toImg = (e: RPE) => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * imgData!.width, y: ((e.clientY - r.top) / r.height) * imgData!.height };
  };

  const onMove = (e: RPE) => {
    if (!drag.current || locked) return;
    const p = toImg(e);
    if (drag.current.kind === "c") {
      const i = drag.current.i;
      setCorners((c) => c.map((q, k) => (k === i ? p : q)));
    } else {
      // project pointer onto top edge to find u
      const [a, b] = corners;
      const dx = b.x - a.x, dy = b.y - a.y;
      const u = Math.min(0.98, Math.max(0.02, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
      const i = drag.current.i;
      setDividers((d) => d.map((v, k) => (k === i ? Math.min(d[k + 1] ?? 1, Math.max(d[k - 1] ?? 0, u)) : v)));
    }
  };

  const crop = (map: (u: number, v: number) => Pt, u0: number, u1: number, v0: number, v1: number) => {
    const c = document.createElement("canvas");
    c.width = c.height = 48;
    const ctx = c.getContext("2d")!;
    const im = ctx.createImageData(48, 48);
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 48; x++) {
        const p = map(u0 + ((u1 - u0) * x) / 47, v0 + ((v1 - v0) * y) / 47);
        const sx = Math.min(imgData!.width - 1, Math.max(0, Math.round(p.x)));
        const sy = Math.min(imgData!.height - 1, Math.max(0, Math.round(p.y)));
        const k = (sy * imgData!.width + sx) * 4, o = (y * 48 + x) * 4;
        im.data.set(imgData!.data.subarray(k, k + 4), o);
      }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL("image/jpeg", 0.8);
  };

  const analyze = () => {
    if (!imgData) return;
    const map = homography(corners);
    const m = margin / 100;
    const out: Result[] = [];
    if (mode === "box") {
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const cw = 1 / cols, ch = 1 / rows;
          const u0 = c * cw + cw * m, u1 = (c + 1) * cw - cw * m;
          const v0 = r * ch + ch * m, v1 = (r + 1) * ch - ch * m;
          const rgb = robustColor(samplePixels(imgData, map, u0, u1, v0, v1), filter);
          if (rgb) out.push({ idx: r * cols + c, label: `${String.fromCharCode(65 + r)}${c + 1}`, rgb, thumb: crop(map, u0, u1, v0, v1) });
        }
    } else {
      const edges = [0, ...dividers, 1];
      for (let i = 0; i < jarCount; i++) {
        const w = edges[i + 1] - edges[i];
        const u0 = edges[i] + w * m, u1 = edges[i + 1] - w * m;
        const v0 = m, v1 = 1 - m;
        const rgb = robustColor(samplePixels(imgData, map, u0, u1, v0, v1, true), filter);
        if (rgb) out.push({ idx: i, label: `Dose ${i + 1}`, rgb, thumb: crop(map, u0, u1, v0, v1), large: isLarge[i] });
      }
    }
    setResults(out);
  };

  const accept = (r: Result) => {
    const best = matchColor(r.rgb, 1)[0];
    let storageId = target || undefined;
    let slot: number | undefined = mode === "box" ? r.idx : undefined;
    if (mode === "jars" && !target) {
      const type: StorageType = r.large ? "largeJar" : "smallJar";
      storageId = uid();
      const count = data.storages.filter((s) => s.type === type).length + 1;
      update("storages", (p) => [...p, { id: storageId!, name: `${r.large ? "Große" : "Kleine"} Dose ${count}`, type, cols: 1, rows: 1 }]);
      slot = undefined;
    }
    const bead: Bead = {
      id: uid(), name: best.color.name, hex: rgbToHex(r.rgb), refCode: best.color.code,
      sizeMm: size, shape: "Rocaille", material: "Glas", storageId, slot, photo: r.thumb,
    };
    update("beads", (p) => [...p, bead]);
    setResults((rs) => rs.map((x) => (x === r ? { ...x, added: true } : x)));
  };

  const map = corners.length === 4 ? homography(corners) : null;
  const W = imgData?.width ?? 1, H = imgData?.height ?? 1;
  const line = (u0: number, v0: number, u1: number, v1: number, key: string, cls = "stroke-primary") => {
    const a = map!(u0, v0), b = map!(u1, v1);
    return <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={cls} strokeWidth={W / 400} />;
  };
  const hr = W / 60;

  return (
    <div>
      <PageHeader title="Foto-Scan & Farberkennung" subtitle="Foto aufnehmen, Raster ausrichten, Farben analysieren.">
        <Btn variant={mode === "box" ? "primary" : "soft"} onClick={() => { setMode("box"); setResults([]); }}>Sortierkasten</Btn>
        <Btn variant={mode === "jars" ? "primary" : "soft"} onClick={() => { setMode("jars"); setResults([]); }}>Dosen</Btn>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
              <Camera size={18} /> Kamera
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-medium">
              <Upload size={18} /> Foto hochladen
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
            </label>
            {img && (
              <Btn variant={locked ? "soft" : "primary"} onClick={() => setLocked(!locked)}>
                {locked ? <><Unlock size={18} /> Ausrichtung entsperren</> : <><Lock size={18} /> Raster-Ausrichtung fertig</>}
              </Btn>
            )}
          </div>
          {!img ? (
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted text-muted-foreground">
              <ScanLine size={40} /><p className="mt-2">Foto vom {mode === "box" ? "Sortierkasten" : "Dosen-Set"} wählen</p>
            </div>
          ) : (
            <div className="relative select-none" style={{ touchAction: locked ? "auto" : "none" }}>
              <img src={img.src} alt="Scan" className="block w-full rounded-xl" draggable={false} />
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className="absolute inset-0 h-full w-full"
                onPointerMove={onMove}
                onPointerUp={() => (drag.current = null)}
                onPointerLeave={() => (drag.current = null)}
              >
                {map && (
                  <>
                    <polygon points={corners.map((p) => `${p.x},${p.y}`).join(" ")} className="fill-primary/10 stroke-primary" strokeWidth={W / 300} />
                    {mode === "box" && (
                      <>
                        {Array.from({ length: cols - 1 }, (_, i) => line((i + 1) / cols, 0, (i + 1) / cols, 1, "c" + i))}
                        {Array.from({ length: rows - 1 }, (_, i) => line(0, (i + 1) / rows, 1, (i + 1) / rows, "r" + i))}
                        {Array.from({ length: rows * cols }, (_, k) => {
                          const r = Math.floor(k / cols), c = k % cols, m = margin / 100;
                          const pts = [[c + m, r + m], [c + 1 - m, r + m], [c + 1 - m, r + 1 - m], [c + m, r + 1 - m]].map(([u, v]) => map(u / cols, v / rows));
                          return <polygon key={"m" + k} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} className="fill-none stroke-card" strokeDasharray={`${W / 200}`} strokeWidth={W / 600} />;
                        })}
                      </>
                    )}
                    {mode === "jars" && dividers.map((u, i) => (
                      <g key={"d" + i}>
                        {line(u, 0, u, 1, "dl" + i, "stroke-needle-b")}
                        {!locked && (() => { const p = map(u, 0); return (
                          <circle cx={p.x} cy={p.y} r={hr * 0.8} className="cursor-ew-resize fill-needle-b stroke-card" strokeWidth={W / 400}
                            onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { kind: "d", i }; }} />
                        ); })()}
                      </g>
                    ))}
                    {!locked && corners.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={hr} className="cursor-grab fill-primary stroke-card" strokeWidth={W / 300}
                        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { kind: "c", i }; }} />
                    ))}
                  </>
                )}
              </svg>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-display text-xl font-semibold">Einstellungen</h2>
            <div className="grid grid-cols-2 gap-3">
              {mode === "box" ? (
                <>
                  <Field label="Spalten"><Input type="number" min={1} max={20} value={cols} onChange={(e) => setCols(Math.max(1, Number(e.target.value)))} /></Field>
                  <Field label="Zeilen"><Input type="number" min={1} max={20} value={rows} onChange={(e) => setRows(Math.max(1, Number(e.target.value)))} /></Field>
                </>
              ) : (
                <>
                  <Field label="Kleine Dosen"><Input type="number" min={0} max={30} value={small} onChange={(e) => setSmall(Math.max(0, Number(e.target.value)))} /></Field>
                  <Field label="Große Dosen"><Input type="number" min={0} max={30} value={large} onChange={(e) => setLarge(Math.max(0, Number(e.target.value)))} /></Field>
                  <div className="col-span-2">
                    <p className="mb-1 text-sm text-muted-foreground">Große Dosen markieren</p>
                    <div className="flex flex-wrap gap-1.5">
                      {isLarge.map((l, i) => (
                        <button key={i} className={`min-h-10 rounded-lg px-3 text-xs font-medium ${l ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                          onClick={() => { const n = isLarge.map((x, k) => (k === i ? !x : x)); setIsLarge(n); const nl = n.filter(Boolean).length; setLarge(nl); setSmall(n.length - nl); }}>
                          Dose {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Field label={`Randabschlag: ${margin}%`} className="col-span-2">
                <input type="range" min={0} max={40} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="accent-primary" />
              </Field>
              <label className="col-span-2 flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={filter} onChange={(e) => setFilter(e.target.checked)} className="h-5 w-5 accent-primary" /> Glanz- & Schattenfilter
              </label>
            </div>
            <Btn className="mt-3 w-full" disabled={!imgData} onClick={analyze}>
              <ScanLine size={18} /> {mode === "box" ? "Fächer analysieren" : "Dosen analysieren"}
            </Btn>
          </Card>

          {results.length > 0 && (
            <Card>
              <h2 className="mb-3 font-display text-xl font-semibold">Entwurf ({results.length})</h2>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Field label="Ziel-Lagerort">
                  <Select value={target} onChange={(e) => setTarget(e.target.value)}>
                    <option value="">{mode === "jars" ? "Neue Dosen anlegen" : "ohne"}</option>
                    {data.storages.filter((s) => (mode === "box" ? s.type === "box" : s.type !== "box")).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label="Perlengröße (mm)"><Input type="number" step="0.5" value={size} onChange={(e) => setSize(Number(e.target.value))} /></Field>
              </div>
              <Btn variant="soft" className="mb-3 w-full" onClick={() => results.filter((r) => !r.added).forEach(accept)}>Alle übernehmen</Btn>
              <div className="max-h-[60vh] space-y-2 overflow-auto">
                {results.map((r) => {
                  const lab = rgbToLab(r.rgb);
                  const top = matchColor(r.rgb, 3);
                  return (
                    <div key={r.idx} className="flex items-center gap-3 rounded-xl border border-border p-2">
                      <img src={r.thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg" />
                      <Swatch hex={rgbToHex(r.rgb)} size={32} />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="font-semibold">{r.label}{r.large ? " (groß)" : ""} · {rgbToHex(r.rgb)}</div>
                        <div className="text-muted-foreground">RGB {r.rgb.join(",")} · Lab {lab.map((v) => v.toFixed(0)).join("/")}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {top.map((t) => <span key={t.color.code} className="inline-flex items-center gap-1"><Swatch hex={t.color.hex} size={12} />{t.color.code} ΔE {t.dE.toFixed(1)}</span>)}
                        </div>
                      </div>
                      <Btn size="sm" variant={r.added ? "soft" : "primary"} disabled={r.added} onClick={() => accept(r)}>{r.added ? <Check size={16} /> : "Übernehmen"}</Btn>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
