// Two lines, ONE shared domain (the entire point is comparability): no dual
// axes, no per-series normalization. Length mismatch → aligned from index 0,
// the shorter series simply ends (stretching would fake correlation). 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { linePath, smoothPath, type Curve } from "../../core/path.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { textGutter } from "../../core/labels.js";

type XY = readonly [number, number];

export interface DualGeometry {
  dPrimary: string;
  dCompare: string;
  /** Primary/compare points 1:1 with the LONGER index range (nulls = gaps). */
  primaryPoints: (XY | null)[];
  comparePoints: (XY | null)[];
  lastPrimary: { x: number; y: number; value: number } | null;
  lastCompare: { x: number; y: number; value: number } | null;
  /** True when the two endpoints coincide (dedupe to one dot/label). */
  coincident: boolean;
  /** Band rect (shared grammar) or null. */
  band: { x: number; y: number; width: number; height: number } | null;
  plot: { x0: number; x1: number; y0: number; y1: number };
  /** Resolved shared value domain `[min,max]` — the annotation-host y-frame. */
  domain: readonly [number, number];
}

// step is intentionally absent: on a two-line benchmark strip it reads as
// noise, and dropping it keeps the entry inside the 3 kB hard cap
const CURVE: Record<Curve, (pts: ReadonlyArray<XY | null>) => string> = {
  linear: linePath,
  smooth: smoothPath,
  step: linePath,
};

export function dualSparklineGeometry(opts: {
  width: number;
  height: number;
  primary: readonly Value[];
  compare: readonly Value[];
  domain?: readonly [number, number] | undefined;
  band?: readonly [number, number] | undefined;
  curve?: Curve | undefined;
  gutterCh: number;
  fontSize: number;
}): DualGeometry {
  const { width, height, primary, compare, curve = "linear", gutterCh, fontSize } = opts;
  const pad = 2;
  const gutter = gutterCh > 0 ? textGutter(gutterCh, fontSize, 4) : 0;
  const x0 = pad;
  const x1 = width - pad - gutter;
  const y0 = pad;
  const y1 = height - pad;
  const n = Math.max(primary.length, compare.length);

  // ONE domain across both series (+ band if wider)
  const all = [...primary, ...compare, ...(opts.band ?? [])];
  let domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (extent(all) ?? [0, 1]);
  if (domain[0] === domain[1]) domain = [domain[0] - 1, domain[1] + 1];
  const yScale = scaleLinear(domain, [y1, y0]);
  const xFor = (i: number) => (n > 1 ? x0 + (i * (x1 - x0)) / (n - 1) : (x0 + x1) / 2);

  const project = (series: readonly Value[]): (XY | null)[] =>
    Array.from({ length: n }, (_, i) => {
      const v = series[i];
      return isFiniteValue(v)
        ? ([round2(xFor(i)), round2(clamp(yScale(v), y0, y1))] as const)
        : null;
    });

  const primaryPoints = project(primary);
  const comparePoints = project(compare);

  const lastOf = (
    pts: (XY | null)[],
    series: readonly Value[],
  ): { x: number; y: number; value: number } | null => {
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      if (p && isFiniteValue(series[i])) return { x: p[0], y: p[1], value: series[i] as number };
    }
    return null;
  };
  const lastPrimary = lastOf(primaryPoints, primary);
  const lastCompare = lastOf(comparePoints, compare);
  const coincident =
    lastPrimary !== null &&
    lastCompare !== null &&
    Math.abs(lastPrimary.x - lastCompare.x) < 0.5 &&
    Math.abs(lastPrimary.y - lastCompare.y) < 1.5;

  let band: DualGeometry["band"] = null;
  if (opts.band && opts.band.every((b) => Number.isFinite(b))) {
    const top = clamp(yScale(Math.max(opts.band[0], opts.band[1])), y0, y1);
    const bot = clamp(yScale(Math.min(opts.band[0], opts.band[1])), y0, y1);
    band = { x: x0, y: round2(top), width: round2(x1 - x0), height: round2(bot - top) };
  }

  return {
    dPrimary: CURVE[curve](primaryPoints),
    dCompare: CURVE[curve](comparePoints),
    primaryPoints,
    comparePoints,
    lastPrimary,
    lastCompare,
    coincident,
    band,
    plot: { x0, x1, y0, y1 },
    domain,
  };
}
