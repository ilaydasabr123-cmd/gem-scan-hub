export type StorageType = "box" | "smallJar" | "largeJar";

export interface Storage {
  id: string;
  name: string;
  type: StorageType;
  cols: number;
  rows: number;
}

export interface Bead {
  id: string;
  name: string;
  hex: string;
  refCode?: string;
  sizeMm?: number;
  shape?: string;
  material?: string;
  surface?: string;
  effect?: string;
  transparency?: string;
  quantity?: number;
  unit?: "stk" | "g";
  storageId?: string;
  slot?: number;
  photo?: string;
}

export const BEAD_SURFACES = ["Glänzend", "Glatt", "Facettiert", "Matt", "Satin", "Perlmutt"];
export const BEAD_EFFECTS = ["Crackle", "Opak", "Marmoriert", "Inneneinzug", "Silbereinzug", "Perlmutt", "Transparent", "Irisierend", "Metallic", "Lustre", "Glänzend"];
export const BEAD_SHAPES = ["Rund", "Rocailles", "Bicone", "Rondell"];
export const BEAD_MATERIALS = ["Plastik", "Glas", "Kristallglas"];
export const BEAD_TRANSPARENCY = ["Transparent", "Opak", "Transluzent", "Kristallklar"];
export const BEAD_SIZES = [2, 3, 4, 5, 6, 7, 8, 10];
export const UNIT_LABEL = { stk: "Stk.", g: "g" } as const;

export const qtyLabel = (b: Bead) => (b.quantity == null ? "—" : `${b.quantity} ${UNIT_LABEL[b.unit ?? "stk"]}`);

export interface Bowl {
  id: string;
  label: string;
  hex: string;
  sizeMm: number;
  shape: string;
}

export type Step =
  | { kind: "bead"; bowlId: string; needle: "A" | "B" }
  | { kind: "pass"; target: number; needle: "A" | "B" };

export interface PatternModule {
  id: string;
  name: string;
  bowls: Bowl[];
  steps: Step[];
}

export interface Bracelet {
  id: string;
  name: string;
  moduleIds: string[];
  lengthCm: number;
}

export interface AppData {
  beads: Bead[];
  storages: Storage[];
  modules: PatternModule[];
  bracelets: Bracelet[];
}

export const SHAPES = ["Rocaille", "Bicone", "Rund", "Würfel", "Tropfen", "Delica", "Rondelle", "Perle"];
export const MATERIALS = ["Glas", "Kristall", "Acryl", "Metall", "Holz", "Süßwasserperle", "Halbedelstein"];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function storageSlots(s: Storage) {
  return s.type === "box" ? s.cols * s.rows : 1;
}

export function slotLabel(s: Storage | undefined, slot?: number) {
  if (!s) return "—";
  if (s.type !== "box" || slot == null) return s.name;
  const r = Math.floor(slot / s.cols);
  const c = slot % s.cols;
  return `${s.name} · ${String.fromCharCode(65 + r)}${c + 1}`;
}
