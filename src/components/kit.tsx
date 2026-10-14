import { X } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" | "danger"; size?: "sm" | "md" };
export function Btn({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex touch-manipulation items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50",
        size === "md" ? "min-h-11 px-4 text-sm" : "min-h-9 px-3 text-xs",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "soft" && "bg-secondary text-secondary-foreground hover:bg-accent",
        variant === "ghost" && "text-foreground hover:bg-accent",
        variant === "danger" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
        className,
      )}
    />
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "min-h-11 rounded-xl border border-input bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn(inputCls, p.className)} />;
}
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn(inputCls, p.className)} />;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-card p-6 shadow-soft sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <Btn variant="ghost" size="sm" onClick={onClose} aria-label="Schließen"><X size={18} /></Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Swatch({ hex, size = 24, className }: { hex: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full border border-foreground/10 shadow-inner", className)}
      style={{ backgroundColor: hex, width: size, height: size, backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), transparent 45%)" }}
    />
  );
}
