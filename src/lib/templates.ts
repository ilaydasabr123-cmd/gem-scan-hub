import { uid, type Bowl, type PatternModule, type Step } from "./types";

export interface Template extends PatternModule {
  description: string;
}

const b = (id: string, label: string, hex: string, sizeMm: number, shape: string): Bowl => ({ id, label, hex, sizeMm, shape });
const bead = (bowlId: string, needle: "A" | "B" = "A"): Step => ({ kind: "bead", bowlId, needle });
const pass = (target: number, needle: "A" | "B" = "A"): Step => ({ kind: "pass", target, needle });

export const TEMPLATES: Template[] = [
  {
    id: "tpl-daisy",
    name: "Gänseblümchen-Blüte (Daisy Chain)",
    description: "6 Blütenblätter im Kreis, Faden zurück durch Blatt 1, Mitte einsetzen, durch Blatt 4 schließen, 2 Stegperlen.",
    bowls: [b("mitte", "Blütenmitte", "#E9C46A", 4, "Rund"), b("blatt", "Blütenblätter", "#FFFFFF", 2, "Rocaille"), b("steg", "Stege", "#7FB685", 2, "Rocaille")],
    steps: [...Array.from({ length: 6 }, () => bead("blatt")), pass(0), bead("mitte"), pass(3), bead("steg"), bead("steg")],
  },
  {
    id: "tpl-kreuz",
    name: "Kreuzmuster / Kreuzglied",
    description: "Beide Fäden nehmen je eine Seitenperle, dann kreuzen sie sich in einer gemeinsamen Mittelperle.",
    bowls: [b("seite", "Seitenperlen", "#C9A27E", 3, "Rund"), b("kreuz", "Kreuzperle", "#B5838D", 4, "Bicone")],
    steps: [bead("seite", "A"), bead("seite", "B"), bead("kreuz", "A"), pass(2, "B")],
  },
  {
    id: "tpl-chevron",
    name: "Chevron-Welle",
    description: "V-förmige Welle: 3 Grundperlen, Spitze, 3 Grundperlen, Faden zurück durch die erste Perle.",
    bowls: [b("grund", "Grundfarbe", "#9DB4C0", 2, "Rocaille"), b("spitze", "Wellenspitze", "#E07A5F", 3, "Rocaille")],
    steps: [bead("grund"), bead("grund"), bead("grund"), bead("spitze"), bead("grund"), bead("grund"), bead("grund"), pass(0)],
  },
  {
    id: "tpl-raw",
    name: "Right-Angle-Weave (RAW-Netz)",
    description: "4 Perlen bilden ein Quadrat, der Faden kreuzt zurück durch Perle 1 und läuft weiter zur nächsten Zelle.",
    bowls: [b("netz", "Netzperlen", "#A8A39D", 3, "Rund"), b("akzent", "Akzent", "#6D597A", 3, "Rund")],
    steps: [bead("netz"), bead("akzent"), bead("netz"), bead("akzent"), pass(0), pass(1), bead("netz"), bead("akzent"), bead("netz"), pass(1)],
  },
  {
    id: "tpl-raute",
    name: "Kristall-Raute",
    description: "Bicone-Raute mit Rocaille-Stegen; Faden 2 kreuzt durch die obere und untere Kristallspitze.",
    bowls: [b("kristall", "Kristalle", "#B8C4D6", 4, "Bicone"), b("steg", "Stege", "#E8D5C4", 2, "Rocaille")],
    steps: [bead("steg", "A"), bead("kristall", "A"), bead("steg", "B"), bead("kristall", "B"), bead("kristall", "A"), pass(1, "B"), pass(3, "A"), bead("steg", "A")],
  },
];

/** Copy a template into an independent, editable module with fresh ids. */
export function cloneTemplate(t: PatternModule, name = t.name): PatternModule {
  const ids = new Map(t.bowls.map((x) => [x.id, uid()]));
  return {
    id: uid(),
    name,
    bowls: t.bowls.map((x) => ({ ...x, id: ids.get(x.id)! })),
    steps: t.steps.map((s) => (s.kind === "bead" ? { ...s, bowlId: ids.get(s.bowlId)! } : { ...s })),
  };
}
