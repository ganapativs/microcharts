// SVG path builders. Inputs are points ALREADY in pixel/viewBox
// space; `null` breaks the line into separate subpaths (gaps). Coords
// are rounded to 2 decimals at generation — smaller output + stable attribute
// assertions. Static-safe: no measurement, no DOM.
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

/**
 * Monotone cubic (Fritsch–Carlson) → cubic Bézier. Runs of < 3 fall back to a
 * straight segment. Deterministic, closed-form, no measurement.
 *
 * The tangents are clamped so the curve never leaves the interval its two
 * endpoints span: a smoothed series cannot dip below its own minimum or rise
 * above its own maximum. That is an honest-encoding requirement, not a taste
 * call — uniform Catmull-Rom (what this was) overshot `[0, 10, 0, 0]` by 1.33
 * viewBox units on a 20-unit-tall spark, i.e. it painted 6.7% of the plot at
 * values the data never contained, and with `fill` it painted them below the
 * zero baseline the area is anchored to.
 *
 * x is assumed non-decreasing (every caller places points on an index axis).
 * A zero-width step has no defined secant, so its tangents flatten to 0, which
 * is also what the monotonicity filter would do to a repeated value.
 */
export function smoothPath(points: ReadonlyArray<XY | null>): string {
  return runs(points)
    .map((run) => {
      const n = run.length;
      if (n < 3) return "M" + run.map(pt).join(" L");

      // Secant slopes, then one-sided tangents at the ends and averaged
      // tangents inside — zeroed at every local extremum so the curve turns
      // flat there instead of swinging past the point.
      const delta: number[] = [];
      for (let i = 0; i < n - 1; i++) {
        const h = run[i + 1]![0] - run[i]![0];
        // A secant needs a forward step to be defined. Repeated or decreasing x
        // never reaches here from a chart (every caller places points on an
        // index axis), but the builders' documented guarantee is that no input
        // produces NaN/Infinity — so a degenerate step is simply flat.
        const s = h > 0 ? (run[i + 1]![1] - run[i]![1]) / h : 0;
        delta.push(Number.isFinite(s) ? s : 0);
      }
      const m: number[] = [delta[0]!];
      for (let i = 1; i < n - 1; i++) {
        m.push(delta[i - 1]! * delta[i]! <= 0 ? 0 : (delta[i - 1]! + delta[i]!) / 2);
      }
      m.push(delta[n - 2]!);
      // Fritsch–Carlson: pull any tangent pair back inside the circle of
      // radius 3 around its secant, which is the exact monotonicity bound.
      for (let i = 0; i < n - 1; i++) {
        if (delta[i] === 0) {
          m[i] = 0;
          m[i + 1] = 0;
          continue;
        }
        const a = m[i]! / delta[i]!;
        const b = m[i + 1]! / delta[i]!;
        const s = a * a + b * b;
        if (s > 9) {
          // Scale the tangents themselves — `t * a * delta` is the same number
          // algebraically but multiplies an overflowed ratio back by its
          // divisor, which is Infinity × 0 (NaN) for a near-zero secant.
          const t = 3 / Math.sqrt(s);
          m[i] = t * m[i]!;
          m[i + 1] = t * m[i + 1]!;
        }
      }

      let d = `M${pt(run[0]!)}`;
      for (let i = 0; i < n - 1; i++) {
        const p1 = run[i]!;
        const p2 = run[i + 1]!;
        const t = (p2[0] - p1[0]) / 3;
        d += ` C${r(p1[0] + t)} ${r(p1[1] + m[i]! * t)} ${r(p2[0] - t)} ${r(p2[1] - m[i + 1]! * t)} ${r(p2[0])} ${r(p2[1])}`;
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
 * Areas anchor at a zero/baseline y.
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
