import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Check, MapPin, RotateCcw, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Btn, Swatch } from "@/components/kit";
import { craftPlan, type CraftProject } from "@/lib/crafting";
import { useData } from "@/lib/store";
import { slotLabel } from "@/lib/types";

export function CraftMode({ project, onClose }: { project: CraftProject; onClose: () => void }) {
  const { data } = useData();
  const plan = useMemo(() => craftPlan(project), [project]);
  const [index, setIndex] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const returnFocus = useRef(typeof document !== "undefined" ? document.activeElement : null);
  const current = plan.at(index);
  const finished = plan.total > 0 && index === plan.total;
  const next = () => setIndex((i) => Math.min(plan.total, i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));
  const bowl = current?.bowl;
  const matches = bowl ? data.beads.filter((b) => b.hex.toLowerCase() === bowl.hex.toLowerCase() && b.sizeMm === bowl.sizeMm && b.shape === bowl.shape) : [];
  const locations = [...new Set(matches.flatMap((b) => {
    const storage = data.storages.find((s) => s.id === b.storageId);
    return storage ? [slotLabel(storage, b.slot)] : [];
  }))];

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background" />
        <Dialog.Content
          className="craft-mode fixed inset-0 z-50 flex h-dvh flex-col bg-background text-foreground outline-none"
          onCloseAutoFocus={(event) => { event.preventDefault(); if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus(); }}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
            if (event.key === "ArrowRight" || (event.key === " " && !(event.target instanceof Element && event.target.closest("button")))) { event.preventDefault(); next(); }
            if (event.key === "ArrowLeft") { event.preventDefault(); back(); }
          }}
        >
          <header className="mx-auto flex w-full max-w-3xl shrink-0 items-center gap-3 px-4 py-3 sm:px-8 sm:py-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Bastelmodus</p>
              <Dialog.Title className="break-words font-display text-2xl font-semibold sm:text-3xl">{project.title}</Dialog.Title>
            </div>
            <Btn variant="ghost" aria-label="Bastelmodus schließen" title="Bastelmodus schließen (Esc)" className="h-12 w-12 shrink-0 p-0" onClick={onClose}><X size={24} /></Btn>
          </header>

          <div className="mx-auto w-full max-w-3xl shrink-0 px-4 sm:px-8">
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
              <span>{finished ? "Alle Schritte erledigt" : `Schritt ${plan.total ? index + 1 : 0} von ${plan.total}`}</span>
              <span>{Math.round(plan.total ? index / plan.total * 100 : 0)} %</span>
            </div>
            <progress className="craft-progress h-2 w-full overflow-hidden rounded-full" max={Math.max(1, plan.total)} value={index} aria-label="Erledigte Fädelschritte" />
          </div>

          <main
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-8"
            onTouchStart={(e) => { const t = e.touches[0]; touch.current = t ? { x: t.clientX, y: t.clientY } : null; }}
            onTouchCancel={() => { touch.current = null; }}
            onTouchEnd={(e) => {
              const start = touch.current, end = e.changedTouches[0];
              touch.current = null;
              if (!start || !end) return;
              const dx = end.clientX - start.x, dy = end.clientY - start.y;
              if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else back(); }
            }}
          >
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center" aria-live="polite" aria-atomic="true">
              {finished ? (
                <div className="space-y-5 text-center">
                  <Check size={64} className="mx-auto text-primary" />
                  <h2 className="font-display text-4xl font-semibold">Geschafft!</h2>
                  <p className="text-lg text-muted-foreground">Alle {plan.total} Fädelschritte sind erledigt.</p>
                  <Btn variant="soft" onClick={() => setIndex(0)}><RotateCcw size={18} /> Von vorn beginnen</Btn>
                </div>
              ) : current ? (
                <>
                  <p className="mb-4 break-words text-center text-sm text-muted-foreground">
                    {project.repeats > 1 && <>Wiederholung {current.repeat} von {project.repeats} · </>}
                    {current.moduleName} · Baustein {current.moduleIndex + 1} · Schritt {current.localStep}/{current.moduleSteps}
                  </p>
                  <div className={`mb-5 flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-lg font-semibold ${current.step.needle === "A" ? "bg-needle-a/10 text-needle-a" : "bg-needle-b/10 text-needle-b"}`}>
                    {current.step.needle === "A" ? <ArrowLeft size={22} className="shrink-0" /> : <ArrowRight size={22} className="shrink-0" />}
                    {current.step.needle === "A" ? "Faden 1 (links)" : "Faden 2 (rechts) / Nadel B"}
                  </div>
                  <div className="mb-4 flex justify-center">
                    {bowl && <svg viewBox="0 0 140 120" role="img" aria-label={`${bowl.shape}, Farbe ${bowl.hex}`} className="h-28 w-36 sm:h-36 sm:w-44">
                      <path d="M0 60H140" className={current.step.needle === "A" ? "stroke-needle-a" : "stroke-needle-b"} strokeWidth="3" strokeDasharray={current.step.needle === "B" ? "6 4" : undefined} />
                      {bowl.shape === "Bicone" ? <polygon points="70,10 120,60 70,110 20,60" fill={bowl.hex} className="stroke-foreground/20" /> : bowl.shape === "Würfel" ? <rect x="25" y="15" width="90" height="90" rx="6" fill={bowl.hex} className="stroke-foreground/20" /> : <ellipse cx="70" cy="60" rx="48" ry="43" fill={bowl.hex} className="stroke-foreground/20" />}
                      <circle cx="70" cy="60" r="6" className="fill-background stroke-foreground/20" />
                      <ellipse cx="51" cy="38" rx="10" ry="6" className="fill-card/60" />
                    </svg>}
                  </div>
                  <h2 className="text-center font-display text-3xl font-semibold sm:text-4xl">{current.step.kind === "bead" ? "Eine Perle auffädeln" : `Erneut durch Perle ${current.beadNumber} fädeln`}</h2>
                  <p className="mt-2 text-center text-base text-muted-foreground sm:text-lg">{current.step.kind === "bead" ? `Die nächste Perle auf das ${current.step.needle === "A" ? "linke" : "rechte"} Fadenende aufnehmen.` : `Das ${current.step.needle === "A" ? "linke" : "rechte"} Fadenende durch die bereits aufgefädelte Perle führen. Keine neue Perle aufnehmen.`}</p>
                  {bowl ? <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-border py-4 text-lg">
                    <div><dt className="text-xs text-muted-foreground">Farbe</dt><dd className="mt-1 flex flex-wrap items-center gap-2 break-all"><Swatch hex={bowl.hex} size={22} />{bowl.hex.toUpperCase()}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Größe & Form</dt><dd className="mt-1 break-words">{bowl.sizeMm} mm · {bowl.shape}</dd></div>
                    <div className="col-span-2"><dt className="text-xs text-muted-foreground">Schälchen</dt><dd className="mt-1 break-words font-semibold">{bowl.label}</dd></div>
                    <div className="col-span-2"><dt className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={13} /> Passende Lagerplätze</dt><dd className="mt-1 break-words text-base">{locations.length ? locations.join(" · ") : "Kein passender Lagerplatz im Bestand zugeordnet."}</dd></div>
                  </dl> : <p role="alert" className="mt-6 text-center text-destructive">Perlendetails fehlen. Bitte das Schälchen oder den Zielschritt im Muster prüfen.</p>}
                  <Dialog.Description className="mt-4 text-center text-xs text-muted-foreground">Auch ohne Nadel: Gemeint ist das linke bzw. rechte Fadenende.</Dialog.Description>
                </>
              ) : <><h2 className="text-center text-2xl">Keine Fädelschritte vorhanden.</h2><Dialog.Description className="text-center text-muted-foreground">Dieses Muster enthält noch keine Schritte.</Dialog.Description></>}
              {finished && <Dialog.Description className="sr-only">Dein Muster ist vollständig durchgefädelt.</Dialog.Description>}
            </div>
          </main>

          <footer className="craft-footer shrink-0 border-t border-border bg-card px-4 pt-3 sm:px-8 sm:pt-4">
            <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3">
              <Btn variant="soft" className="min-h-14 text-base" disabled={index === 0} onClick={back} title="Vorheriger Schritt (Pfeil links)"><ArrowLeft size={22} /> Zurück</Btn>
              {finished ? <Btn className="min-h-14 text-base" onClick={onClose}><Check size={22} /> Fertig</Btn> : <Btn className="min-h-14 text-base" disabled={!current} onClick={next} title="Nächster Schritt (Pfeil rechts)">{index === plan.total - 1 ? "Abschließen" : "Weiter"}<ArrowRight size={22} /></Btn>}
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}