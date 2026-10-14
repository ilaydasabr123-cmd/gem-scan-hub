import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import { Btn, Card, PageHeader } from "@/components/kit";
import { refByCode } from "@/lib/colors";
import { meta } from "@/lib/meta";
import { useData } from "@/lib/store";
import { slotLabel, type Bead } from "@/lib/types";

export const Route = createFileRoute("/etiketten")({
  head: () => meta("Etiketten & Sticker", "Dosen-Aufkleber und Fächer-Beschriftungen als hochauflösendes PNG."),
  component: Etiketten,
});

function Etiketten() {
  const { data } = useData();
  const [kind, setKind] = useState<"round" | "rect">("round");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const st = (id?: string) => data.storages.find((s) => s.id === id);
  const beads = data.beads.filter((b) => sel.size === 0 || sel.has(b.id));
  const info = (b: Bead) => ({ code: b.refCode ?? b.hex, name: refByCode(b.refCode)?.name ?? b.name, place: slotLabel(st(b.storageId), b.slot) });

  const exportPng = () => {
    // 300 dpi: round 30 mm Ø, rect 40×15 mm
    const mm = 300 / 25.4;
    const w = (kind === "round" ? 30 : 40) * mm, h = (kind === "round" ? 30 : 15) * mm;
    const gap = 3 * mm, perRow = kind === "round" ? 6 : 4;
    const rowsN = Math.ceil(beads.length / perRow);
    const c = document.createElement("canvas");
    c.width = Math.round(perRow * (w + gap) + gap);
    c.height = Math.round(rowsN * (h + gap) + gap);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, c.width, c.height);
    beads.forEach((b, i) => {
      const x = gap + (i % perRow) * (w + gap), y = gap + Math.floor(i / perRow) * (h + gap);
      const { code, name, place } = info(b);
      ctx.strokeStyle = "#C9B8AE";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (kind === "round") ctx.arc(x + w / 2, y + h / 2, w / 2 - 2, 0, Math.PI * 2);
      else ctx.roundRect(x, y, w, h, 20);
      ctx.stroke();
      ctx.fillStyle = b.hex;
      ctx.beginPath();
      const dotR = kind === "round" ? w * 0.14 : h * 0.3;
      const dx = kind === "round" ? x + w / 2 : x + h / 2, dy = kind === "round" ? y + h * 0.28 : y + h / 2;
      ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4A3A33";
      ctx.textAlign = kind === "round" ? "center" : "left";
      const tx = kind === "round" ? x + w / 2 : x + h * 0.95;
      const lines: [string, number][] = kind === "round"
        ? [[code, y + h * 0.56], [name, y + h * 0.7], [place, y + h * 0.82]]
        : [[code, y + h * 0.34], [name, y + h * 0.6], [place, y + h * 0.85]];
      lines.forEach(([t, ty], k) => {
        ctx.font = `${k === 0 ? "700" : "400"} ${Math.round((kind === "round" ? w : h) * (k === 0 ? 0.11 : 0.085) * (kind === "rect" ? 2 : 1))}px Karla, sans-serif`;
        ctx.fillText(t, tx, ty, kind === "round" ? w * 0.8 : w - h * 1.05);
      });
    });
    const a = document.createElement("a");
    a.download = `etiketten-${kind === "round" ? "dosen" : "faecher"}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  return (
    <div>
      <PageHeader title="Etiketten & Sticker" subtitle="Antippen, um Perlen auszuwählen – ohne Auswahl werden alle gedruckt.">
        <Btn variant={kind === "round" ? "primary" : "soft"} onClick={() => setKind("round")}>Dosen (rund)</Btn>
        <Btn variant={kind === "rect" ? "primary" : "soft"} onClick={() => setKind("rect")}>Fächer (rechteckig)</Btn>
        <Btn disabled={!beads.length} onClick={exportPng}><Download size={18} /> PNG exportieren</Btn>
      </PageHeader>
      {data.beads.length === 0 ? (
        <Card><p className="text-muted-foreground">Noch keine Perlen im Bestand.</p></Card>
      ) : (
        <div className={`grid gap-3 ${kind === "round" ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
          {data.beads.map((b) => {
            const { code, name, place } = info(b);
            const on = sel.has(b.id);
            return (
              <button key={b.id} onClick={() => setSel((s) => { const n = new Set(s); if (n.has(b.id)) n.delete(b.id); else n.add(b.id); return n; })}
                className={`flex items-center border-2 bg-card text-foreground transition ${on ? "border-primary" : "border-border"} ${kind === "round" ? "aspect-square flex-col justify-center rounded-full p-3 text-center" : "min-h-20 gap-3 rounded-xl px-3 text-left"} ${sel.size && !on ? "opacity-40" : ""}`}>
                <span className="inline-block h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: b.hex }} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{code}</span>
                  <span className="block truncate text-xs">{name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{place}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
