import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { Card, PageHeader, Swatch } from "@/components/kit";
import { REF_COLORS } from "@/lib/colors";
import { meta } from "@/lib/meta";
import { useData } from "@/lib/store";
import type { AppData } from "@/lib/types";

export const Route = createFileRoute("/einstellungen")({
  head: () => meta("Datensicherung & Einstellungen", "JSON-Backup herunterladen, wiederherstellen und Referenztöne ansehen."),
  component: Settings,
});

function Settings() {
  const { data, replaceAll } = useData();
  const [msg, setMsg] = useState("");

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "perlen-manager", version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `perlen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importJson = async (f: File) => {
    try {
      const d = JSON.parse(await f.text()) as AppData;
      if (!Array.isArray(d.beads)) throw new Error();
      if (!confirm("Aktuelle Daten werden durch das Backup ersetzt. Fortfahren?")) return;
      await replaceAll(d);
      setMsg(`Wiederhergestellt: ${d.beads.length} Perlen, ${d.storages?.length ?? 0} Lagerorte, ${d.modules?.length ?? 0} Muster.`);
    } catch {
      setMsg("Die Datei ist kein gültiges Perlen-Backup.");
    }
  };

  return (
    <div>
      <PageHeader title="Datensicherung & Einstellungen" subtitle="Alle Daten liegen nur in diesem Browser – sichere sie regelmäßig." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-semibold">Backup herunterladen</h2>
          <p className="mb-4 text-sm text-muted-foreground">Enthält Perlen inkl. Fotos, Lagerorte, Muster und Armbänder.</p>
          <button onClick={exportJson} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"><Download size={18} /> JSON exportieren</button>
        </Card>
        <Card>
          <h2 className="font-display text-xl font-semibold">Backup wiederherstellen</h2>
          <p className="mb-4 text-sm text-muted-foreground">Ersetzt alle aktuellen Daten.</p>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-medium">
            <Upload size={18} /> JSON importieren
            <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          {msg && <p className="mt-3 text-sm">{msg}</p>}
        </Card>
      </div>
      <Card className="mt-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">{REF_COLORS.length} Referenz-Farbtöne</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {REF_COLORS.map((c) => (
            <div key={c.code} className="flex items-center gap-2 rounded-xl bg-muted p-2">
              <Swatch hex={c.hex} size={28} />
              <div className="min-w-0 text-xs"><div className="font-semibold">{c.code}</div><div className="truncate text-muted-foreground">{c.name}</div></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
