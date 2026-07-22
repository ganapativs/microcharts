// Shared cell vocabulary: every cell-based chart (ActivityGrid,
// HeatCell, HeatStrip, CalendarStrip) speaks the same `shape` prop and renders
// through the same mark metrics, so a "round" cell means one thing everywhere.
// `crisp` only on rectilinear marks (canon: crispEdges never on curves).
import { round2 } from "../core/types.js";

export type CellShape = "square" | "round" | "dot";

export function cellMetrics(
  size: number,
  shape: CellShape,
): { inset: number; rx: number; crisp: boolean } {
  if (shape === "dot") {
    const inset = round2(Math.max(0.5, size * 0.15));
    return { inset, rx: round2((size - inset * 2) / 2), crisp: false };
  }
  if (shape === "round") return { inset: 0, rx: round2(size * 0.3), crisp: false };
  return { inset: 0, rx: 1, crisp: true };
}

/** Discrete intensity ramp shared by every stepped-color chart — level 0 is the
 *  faint empty track; levels 1..n spread 0.25 → 1. One ramp, one calibration. */
export function stepOpacity(step: number, steps: number): number {
  if (step === 0) return 0.06;
  return steps <= 1 ? 1 : 0.25 + (step / (steps - 1)) * 0.75;
}

/** Ramp for calibrated VALUE cells (HeatCell/HeatStrip): mix accent into the
 *  band so steps stay distinct on both light and dark surfaces. Opacity-only
 *  ramps collapse when `--mc-accent` is already dark. Caps below 100 so hot
 *  cells stay tinted — pure accent washes out and kills label contrast. */
export function valueStepMixPct(step: number, steps: number): number {
  return steps <= 1 ? 82 : Math.round(28 + (step / (steps - 1)) * 54);
}

/** Opacity ramp kept for ActivityGrid empty-track semantics (level 0 faint). */
export function valueStepOpacity(step: number, steps: number): number {
  return steps <= 1 ? 1 : 0.25 + (step / (steps - 1)) * 0.75;
}

/** Bins a value into 0..steps-1 over [d0, d1], clamped (HeatCell/HeatStrip
 *  shared calibration). Zero-width domain → the single mid step. */
export function stepIndex(value: number, d0: number, d1: number, steps: number): number {
  const span = d1 - d0;
  if (span === 0) return Math.floor(steps / 2);
  const t = Math.min(1, Math.max(0, (value - d0) / span));
  return Math.min(steps - 1, Math.floor(t * steps));
}
