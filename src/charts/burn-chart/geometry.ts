// BurnChart: Will we finish on time?
// A plan line (dashed, full length). the actual line to today, and a dotted
// projection whose slope is a linear fit over the last k actual points (never a
// smoothed or optimistic curve). History is precise; the projection is dotted
// and provisional by construction. Y zero-anchored. Coords 2-dp.
import { linePath } from "../../core/path.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type XY } from "../../core/types.js";

export type BurnMode = "down" | "up";

interface BurnPoint {
  period: number;
  x: number;
  /** Marker y (actual if present, else the projected y). */
  y: number;
  actual: number | null;
  plan: number | null;
  projected: number | null;
}

export interface BurnGeometry {
  plan: { d: string };
  actual: { d: string };
  /** Today = the last actual point (x + its y). */
  today: { x: number; y: number };
  projection: { d: string } | null;
  /** Present only when the projection reaches the target; delta = schedule
   *  days vs the deadline (signed, + = late). */
  landing: { delta: number; value: number } | null;
  /** For the summary — the latest actual + the plan at that period. */
  nowActual: number;
  nowPlan: number | null;
  /** Whether the projection reaches the target at all (false = flatlined). */
  finishes: boolean;
  /** Per-period positions — overlays + nearest-x (history + projection). */
  points: BurnPoint[];
  labelX: number;
  labelY: number;
  totalWidth: number;
  /** Zero-anchored value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
  /** Period index the x-scale spans to (`[0, spanEnd]`). */
  spanEnd: number;
  /** Plot inset (viewBox units) shared by both scales. */
  pad: number;
}

// least-squares slope of y over consecutive integer x (per-period burn rate)
function fitSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const xbar = (n - 1) / 2;
  const ybar = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xbar) * (ys[i]! - ybar);
    den += (i - xbar) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function burnGeometry(opts: {
  width: number;
  height: number;
  plan: readonly number[];
  actual: readonly number[];
  mode?: BurnMode | undefined;
  projection?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): BurnGeometry | null {
  const plan = opts.plan.filter(isFiniteValue);
  const actual = opts.actual.filter(isFiniteValue);
  if (actual.length === 0 && plan.length === 0) return null;

  const { width, height } = opts;
  const pad = opts.pad ?? 2;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const mode: BurnMode = opts.mode ?? "down";
  const wantProjection = opts.projection !== false;

  const deadline = plan.length > 0 ? plan.length - 1 : Math.max(0, actual.length - 1);
  const today = Math.max(0, actual.length - 1);
  const target = mode === "down" ? 0 : plan.length > 0 ? plan[plan.length - 1]! : 0;

  // projection slope over the last k = max(2, ⌈today/3⌉) actual points
  const k = Math.max(2, Math.ceil(actual.length / 3));
  const window = actual.slice(Math.max(0, actual.length - k));
  const slope = actual.length >= 2 ? fitSlope(window) : 0;
  const nowActual = actual.length > 0 ? actual[actual.length - 1]! : 0;

  // does the projection reach the target, and when?
  const towardTarget = mode === "down" ? slope < 0 : slope > 0;
  const finishPeriod = towardTarget ? today + (target - nowActual) / slope : Infinity;
  const finishes = wantProjection && actual.length >= 2 && Number.isFinite(finishPeriod);
  const delta = finishes ? Math.round(finishPeriod - deadline) : 0;

  // x domain spans history + deadline + a late finish (capped to avoid runaway)
  const spanEnd = Math.max(
    deadline,
    today,
    finishes ? Math.min(finishPeriod, deadline * 2 + 2) : deadline,
  );
  const yValues = [...plan, ...actual, target];
  const yMax = opts.domain?.[1] ?? Math.max(1, ...yValues);
  const yMin = opts.domain?.[0] ?? 0; // zero-anchored
  const xScale = scaleLinear([0, Math.max(1, spanEnd)], [pad, width - pad]);
  const yScale = scaleLinear([yMin, yMax], [height - pad, pad]);
  const X = (i: number) => round2(xScale(i));
  const Y = (v: number) => round2(clamp(yScale(v), pad, height - pad));

  const planPts: XY[] = plan.map((v, i) => [X(i), Y(v)]);
  const actualPts: XY[] = actual.map((v, i) => [X(i), Y(v)]);

  // projection: from the last actual to the deadline x at the fitted slope
  let projection: { d: string } | null = null;
  if (wantProjection && actual.length >= 2) {
    const projEndPeriod = spanEnd;
    const projEndVal = nowActual + slope * (projEndPeriod - today);
    projection = {
      d: linePath([
        [X(today), Y(nowActual)],
        [X(projEndPeriod), Y(projEndVal)],
      ]),
    };
  }

  const landing = finishes
    ? { delta, value: round2(nowActual + slope * (deadline - today)) }
    : null;

  const points: BurnPoint[] = [];
  const spanInt = Math.round(spanEnd);
  for (let i = 0; i <= spanInt; i++) {
    const a = i < actual.length ? actual[i]! : null;
    const p = i < plan.length ? plan[i]! : null;
    const proj =
      wantProjection && actual.length >= 2 && i > today ? nowActual + slope * (i - today) : null;
    if (a === null && p === null && proj === null) continue;
    points.push({
      period: i,
      x: X(i),
      y: Y(a ?? proj ?? p ?? 0),
      actual: a === null ? null : round2(a),
      plan: p === null ? null : round2(p),
      projected: proj === null ? null : round2(proj),
    });
  }

  return {
    plan: { d: plan.length > 0 ? linePath(planPts) : "" },
    actual: { d: actual.length > 0 ? linePath(actualPts) : "" },
    today: { x: X(today), y: Y(nowActual) },
    projection,
    landing,
    nowActual: round2(nowActual),
    nowPlan: plan.length > today ? round2(plan[today]!) : null,
    finishes,
    points,
    labelX: round2(width + 3),
    // `dominant-baseline: central` straddles y by half a font EACH way, so the
    // clamp is symmetric. Below `height < fontSize` no clamp exists and the
    // caller drops the label rather than painting it past the box.
    labelY:
      fontSize > 0
        ? round2(clamp(Y(nowActual), fontSize * 0.5, height - fontSize * 0.5))
        : Y(nowActual),
    totalWidth: width + gutter,
    domain: [yMin, yMax],
    spanEnd: Math.max(1, spanEnd),
    pad,
  };
}
