import { Link } from "@tanstack/react-router";
import { Camera, Gem, LayoutDashboard, Palette, Printer, Settings } from "lucide-react";
import type { ReactNode } from "react";
import { useData } from "@/lib/store";

const NAV = [
  { to: "/", label: "Übersicht", icon: LayoutDashboard },
  { to: "/scan", label: "Foto-Scan", icon: Camera },
  { to: "/bestand", label: "Bestand", icon: Gem },
  { to: "/etiketten", label: "Etiketten", icon: Printer },
  { to: "/atelier", label: "Atelier", icon: Palette },
  { to: "/einstellungen", label: "Sicherung", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { ready } = useData();
  return (
    <div className="min-h-screen bg-background font-sans text-foreground md:flex">
      <aside className="no-print hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-5 md:block">
        <div className="mb-8">
          <div className="font-display text-2xl font-semibold leading-tight">Perlenatelier</div>
          <div className="text-xs tracking-widest text-muted-foreground uppercase">Perlen-Manager</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent font-semibold" }}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <p className="mt-10 text-xs text-muted-foreground">Alle Daten & Fotos bleiben lokal in diesem Browser.</p>
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-8 md:pb-10">{ready ? children : <p className="text-muted-foreground">Lade Daten…</p>}</main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-card/95 backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Icon size={20} /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
