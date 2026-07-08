// Arc / sector / annulus SVG path builders (plan/21 §6.0.C). Ring-family
// charts share one angle convention: radians, 0 at 12 o'clock, positive =
// clockwise (variable starts make identical fractions look different — the
// start is fixed at the chart layer and documented there). Coords are rounded
// to 2 decimals at generation (plan/07/09). Degenerate inputs (non-finite,
// r ≤ 0, zero/negative sweep) return "" — an empty `d` renders nothing, so a
// fraction-0 ring shows its track only, never a zero-length arc artifact.
import { round2 as r2 } from "./types.js";

export const TAU = Math.PI * 2;

const EPS = 1e-9;

/** Point at `angle` on the circle — 12 o'clock start, clockwise, 2-dp. */
export function polarPoint(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): readonly [number, number] {
  return [r2(cx + r * Math.sin(angle)), r2(cy - r * Math.cos(angle))];
}

/** Raw `A` command (elliptical arc segment) — the primitive composite shapes
 *  (moon-phase terminators etc.) build from. Endpoint + radii at 2-dp. */
export function arcTo(
  rx: number,
  ry: number,
  xRotation: number,
  largeArc: boolean,
  sweep: boolean,
  x: number,
  y: number,
): string {
  return `A${r2(rx)} ${r2(ry)} ${r2(xRotation)} ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${r2(x)} ${r2(y)}`;
}

/** Sweep clamped to [0, TAU]; NaN for unusable inputs. */
function sweepOf(r: number, a0: number, a1: number): number {
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(a0) || !Number.isFinite(a1)) return NaN;
  const s = a1 - a0;
  if (s <= 0) return NaN;
  return Math.min(s, TAU);
}

/** Clockwise arc command(s) from the current point to angle `a1`. A full
 *  sweep is split into two half-arcs (SVG cannot draw a single 360° arc). */
function cwArcs(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const sweep = a1 - a0;
  if (sweep >= TAU - EPS) {
    const [hx, hy] = polarPoint(cx, cy, r, a0 + Math.PI);
    const [ex, ey] = polarPoint(cx, cy, r, a0);
    return `${arcTo(r, r, 0, false, true, hx, hy)} ${arcTo(r, r, 0, false, true, ex, ey)}`;
  }
  const [ex, ey] = polarPoint(cx, cy, r, a1);
  return arcTo(r, r, 0, sweep > Math.PI, true, ex, ey);
}

/** Counter-clockwise arc command(s) from the current point back to `a0`. */
function ccwArcs(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const sweep = a1 - a0;
  if (sweep >= TAU - EPS) {
    const [hx, hy] = polarPoint(cx, cy, r, a0 + Math.PI);
    const [sx, sy] = polarPoint(cx, cy, r, a0);
    return `${arcTo(r, r, 0, false, false, hx, hy)} ${arcTo(r, r, 0, false, false, sx, sy)}`;
  }
  const [sx, sy] = polarPoint(cx, cy, r, a0);
  return arcTo(r, r, 0, sweep > Math.PI, false, sx, sy);
}

/** Open circular arc (for stroked arcs). Full sweep → closed circle outline. */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const sweep = sweepOf(r, a0, a1);
  if (Number.isNaN(sweep)) return "";
  const [sx, sy] = polarPoint(cx, cy, r, a0);
  return `M${sx} ${sy} ${cwArcs(cx, cy, r, a0, a0 + sweep)}`;
}

/** Filled pie sector (center → rim → arc → close). Full sweep → full disc,
 *  built as two half-arcs — no center spoke, no 360°-arc degenerate. */
export function sector(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const sweep = sweepOf(r, a0, a1);
  if (Number.isNaN(sweep)) return "";
  const [sx, sy] = polarPoint(cx, cy, r, a0);
  if (sweep >= TAU - EPS) {
    return `M${sx} ${sy} ${cwArcs(cx, cy, r, a0, a0 + TAU)} Z`;
  }
  return `M${r2(cx)} ${r2(cy)} L${sx} ${sy} ${cwArcs(cx, cy, r, a0, a0 + sweep)} Z`;
}

/**
 * Filled annulus sector (donut wedge): outer arc clockwise, inner arc back
 * counter-clockwise. `rInner` is clamped to [0, rOuter]; 0 collapses to a
 * plain sector. A full sweep emits two subpaths — outer ring clockwise, inner
 * counter-clockwise — so the default nonzero fill rule punches the hole.
 */
export function annulusSector(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  a0: number,
  a1: number,
): string {
  const sweep = sweepOf(rOuter, a0, a1);
  if (Number.isNaN(sweep)) return "";
  const ri = Math.max(0, Math.min(Number.isFinite(rInner) ? rInner : 0, rOuter));
  if (ri === 0) return sector(cx, cy, rOuter, a0, a1);

  const [ox, oy] = polarPoint(cx, cy, rOuter, a0);
  if (sweep >= TAU - EPS) {
    const [ix, iy] = polarPoint(cx, cy, ri, a0);
    return (
      `M${ox} ${oy} ${cwArcs(cx, cy, rOuter, a0, a0 + TAU)} Z ` +
      `M${ix} ${iy} ${ccwArcs(cx, cy, ri, a0 - TAU, a0)} Z`
    );
  }
  const [ix, iy] = polarPoint(cx, cy, ri, a0 + sweep);
  return `M${ox} ${oy} ${cwArcs(cx, cy, rOuter, a0, a0 + sweep)} L${ix} ${iy} ${ccwArcs(cx, cy, ri, a0, a0 + sweep)} Z`;
}

/** Alias — ring charts (track/value arc) reference `annulusArc`; the geometry
 *  is the annulus sector with butt ends. */
export const annulusArc = annulusSector;

/** Circular arc length for the sweep (clamped to one turn), 2-dp — feeds
 *  stroke-dasharray so dash math is exact at any radius. 0 when degenerate. */
export function arcLength(r: number, a0: number, a1: number): number {
  const sweep = sweepOf(r, a0, a1);
  return Number.isNaN(sweep) ? 0 : r2(r * sweep);
}

/**
 * `[dash, gap]` for exactly `count` dashes around a full circle of radius `r`
 * (`duty` = lit fraction of each segment). Derived from the true circumference
 * so the pattern closes on itself; 2-dp. Degenerate input → `[0, 0]`.
 */
export function evenDashes(r: number, count: number, duty = 0.5): readonly [number, number] {
  if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(count) || count < 1) return [0, 0];
  const segment = (TAU * r) / Math.round(count);
  const d = Math.min(Math.max(duty, 0), 1);
  return [r2(segment * d), r2(segment * (1 - d))];
}
