// SVG path builders (plan/03 §4). Inputs are points ALREADY in pixel/viewBox
// space; `null` breaks the line into separate subpaths (gaps, plan/03). Coords
// are rounded to 2 decimals at generation (plan/07: smaller output + stable
// attribute assertions, plan/09). Static-safe: no measurement, no DOM.
import { round2 as r, type XY } from "./types.js";

export type Curve = "linear" | "smooth" | "step";

/** Splits a gapped point list into runs of consecutive finite points. */
function runs(points: ReadonlyArray<XY | null>): XY[][] {
  const out: XY[][] = [];
  let cur: XY[] = [];
  for (const p of points) {
    if (p === null) {
      if (cur.length) out.push(cur);
      cur = [];
    } else {
      cur.push(p);
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

const pt = (p: XY): string => `${r(p[0])} ${r(p[1])}`;

/** Polyline through the points. Single-point runs emit just a move (the mark
 *  is drawn as a dot by the component, not the path). Empty → "". */
export function linePath(points: ReadonlyArray<XY | null>): string {
  return runs(points)
    .map((run) => "M" + run.map(pt).join(" L"))
    .join(" ");
}

/** Step-after: hold value, then jump. Uses H/V for compact output. */
export function stepPath(points: ReadonlyArray<XY | null>): string {
  return runs(points)
    .map((run) => {
      const first = run[0]!;
      let d = `M${pt(first)}`;
      let prevY = first[1];
      for (let i = 1; i < run.length; i++) {
        const [x, y] = run[i]!;
        d += ` H${r(x)}`;
        if (y !== prevY) d += ` V${r(y)}`;
        prevY = y;
      }
      return d;
    })
    .join(" ");
}

/** Catmull-Rom → cubic Bézier (uniform, tension 1/6). Runs of < 3 fall back to
 *  a straight segment. Deterministic, closed-form, no measurement. */
export function smoothPath(points: ReadonlyArray<XY | null>): string {
  return runs(points)
    .map((run) => {
      const n = run.length;
      if (n < 3) return "M" + run.map(pt).join(" L");
      let d = `M${pt(run[0]!)}`;
      for (let i = 0; i < n - 1; i++) {
        const p0 = run[i === 0 ? 0 : i - 1]!;
        const p1 = run[i]!;
        const p2 = run[i + 1]!;
        const p3 = run[i + 2 < n ? i + 2 : n - 1]!;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C${r(c1x)} ${r(c1y)} ${r(c2x)} ${r(c2y)} ${r(p2[0])} ${r(p2[1])}`;
      }
      return d;
    })
    .join(" ");
}

const TOP: Record<Curve, (p: ReadonlyArray<XY | null>) => string> = {
  linear: linePath,
  smooth: smoothPath,
  step: stepPath,
};

/**
 * Filled area between the series and a baseline (in the same pixel space).
 * Each gap-free run is closed independently: baseline → top curve → baseline.
 * Areas anchor at a zero/baseline y (plan/06: lie factor = 1).
 */
export function areaPath(
  points: ReadonlyArray<XY | null>,
  baselineY: number,
  curve: Curve = "linear",
): string {
  const by = r(baselineY);
  return runs(points)
    .map((run) => {
      if (run.length === 0) return "";
      const top = TOP[curve](run).replace(/^M/, "L"); // top edge as line-tos
      const x0 = r(run[0]![0]);
      const xN = r(run[run.length - 1]![0]);
      return `M${x0} ${by} ${top} L${xN} ${by} Z`;
    })
    .filter(Boolean)
    .join(" ");
}
