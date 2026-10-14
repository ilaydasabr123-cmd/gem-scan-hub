import type { Bowl, PatternModule, Step } from "./types";

export interface CraftProject {
  title: string;
  modules: PatternModule[];
  repeats: number;
}

export interface CraftStep {
  step: Step;
  bowl?: Bowl;
  beadNumber: number;
  moduleName: string;
  moduleIndex: number;
  localStep: number;
  moduleSteps: number;
  repeat: number;
}

/** Targets are zero-based bead indices within each module, not step indices. */
export function craftSequence(modules: PatternModule[]): CraftStep[] {
  let offset = 0;
  return modules.flatMap((mod, moduleIndex) => {
    const strung: (Bowl | undefined)[] = [];
    const result = mod.steps.map((step, localStep): CraftStep => {
      const bowl = step.kind === "bead"
        ? mod.bowls.find((b) => b.id === step.bowlId)
        : strung[step.target];
      if (step.kind === "bead") strung.push(bowl);
      return {
        step, bowl,
        beadNumber: offset + (step.kind === "bead" ? strung.length : step.target + 1),
        moduleName: mod.name, moduleIndex, localStep: localStep + 1,
        moduleSteps: mod.steps.length, repeat: 1,
      };
    });
    offset += strung.length;
    return result;
  });
}

/** Resolve repeated sequences without allocating every bracelet step. */
export function craftPlan(project: CraftProject) {
  const sequence = craftSequence(project.modules);
  const repeats = Number.isFinite(project.repeats) ? Math.max(0, Math.floor(project.repeats)) : 0;
  const beadsPerRepeat = sequence.filter((s) => s.step.kind === "bead").length;
  return {
    total: sequence.length * repeats,
    at(index: number): CraftStep | undefined {
      if (!Number.isInteger(index) || index < 0 || index >= sequence.length * repeats) return undefined;
      const current = sequence[index % sequence.length];
      if (!current) return undefined;
      const repeat = Math.floor(index / sequence.length);
      return { ...current, repeat: repeat + 1, beadNumber: current.beadNumber + repeat * beadsPerRepeat };
    },
  };
}