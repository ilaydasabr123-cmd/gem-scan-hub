import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Camera, Gem, Palette, Sparkles } from "lucide-react";
import { Card, PageHeader, Swatch } from "@/components/kit";
import { REF_COLORS } from "@/lib/colors";
import { meta } from "@/lib/meta";
import { useData } from "@/lib/store";
import { storageSlots } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => meta("Übersicht", "Kennzahlen, Schnellaktionen und Lagerbelegung deiner Perlensammlung."),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useData();
  const usedRefs = new Set(data.beads.map((b) => b.refCode).filter(Boolean)).size;
  const stats = [
    { label: "Perlen im Bestand", value: data.beads.length, icon: Gem },
    { label: `Referenzfarben belegt (von ${REF_COLORS.length})`, value: usedRefs, icon: Sparkles },
    { label: "Lagerorte", value: data.storages.length, icon: Archive },
    { label: "Muster erstellt", value: data.modules.length, icon: Palette },
  ];
  const actions = [
    { to: "/scan", label: "Neuer Foto-Scan", icon: Camera },
    { to: "/atelier", label: "Neues Armband planen", icon: Palette },
    { to: "/bestand", label: "Bestand ansehen", icon: Gem },
  ] as const;

  const boxes = data.storages.filter((s) => s.type === "box");
  const jars = data.storages.filter((s) => s.type !== "box");
  const jarUsed = jars.filter((j) => data.beads.some((b) => b.storageId === j.id)).length;

  return (
    <div>
      <PageHeader title="Willkommen im Atelier" subtitle="Deine Perlen, Farben und Muster auf einen Blick." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <Icon className="text-primary" size={22} />
            <div className="mt-3 font-display text-4xl font-semibold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {actions.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex min-h-16 items-center gap-3 rounded-2xl bg-primary px-5 text-primary-foreground shadow-soft hover:bg-primary/90">
            <Icon size={22} /> <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-display text-2xl font-semibold">Lager-Schnellübersicht</h2>
        {data.storages.length === 0 && (
          <p className="text-muted-foreground">Noch keine Lagerorte. Lege im <Link to="/bestand" className="text-primary underline">Bestand</Link> Boxen oder Dosen an.</p>
        )}
        <div className="space-y-4">
          {boxes.map((s) => {
            const inBox = data.beads.filter((b) => b.storageId === s.id);
            const used = new Set(inBox.map((b) => b.slot)).size;
            const total = storageSlots(s);
            return <Bar key={s.id} label={s.name} used={used} total={total} hexes={inBox.map((b) => b.hex)} />;
          })}
          {jars.length > 0 && (
            <Bar label={`Dosen-Set (${jars.length} Dosen)`} used={jarUsed} total={jars.length} hexes={data.beads.filter((b) => jars.some((j) => j.id === b.storageId)).map((b) => b.hex)} />
          )}
        </div>
      </Card>
    </div>
  );
}

function Bar({ label, used, total, hexes }: { label: string; used: number; total: number; hexes: string[] }) {
  const pct = total ? Math.round((used / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 text-muted-foreground">{used}/{total} · {pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">{hexes.slice(0, 40).map((h, i) => <Swatch key={i} hex={h} size={14} />)}</div>
    </div>
  );
}
