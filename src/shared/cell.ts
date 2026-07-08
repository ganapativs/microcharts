// Shared cell vocabulary (plan/21 §3): every cell-based chart (ActivityGrid,
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
  return step === 0 ? 0.06 : 0.25 + (step / (steps - 1)) * 0.75;
}
