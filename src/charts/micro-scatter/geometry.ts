// MicroScatter: 2-D position
// on common scales — the highest-precision correlation display. Least-squares
// trend (linear ONLY, never smoothed) + Pearson r live here, property-tested:
// r ∈ [−1, 1], trend within bounds, non-finite pairs dropped. Coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export interface ScatterGeometry {
  /** Finite pairs only, projected, 2-dp. */
  dots: { x: number; y: number; index: number }[];
  /** Least-squares line clipped to the plot, or null (n < 2 / zero variance). */
  trendLine: { x1: number; y1: number; x2: number; y2: number } | null;
  /** Pearson r over finite pairs, 2-dp; null if n < 3 or zero variance. */
  r: number | null;
  /** How many input pairs were dropped as non-finite. */
  dropped: number;
}

export function microScatterGeometry(opts: {
  width: number;
  height: number;
  points: readonly { x: number; y: number }[];
  xDomain?: readonly [number, number] | undefined;
  yDomain?: readonly [number, number] | undefined;
  trend: boolean;
  r?: number | undefined;
}): ScatterGeometry {
  const { width, height, points, trend } = opts;
  const rad = opts.r ?? 1.5;

  const finite = points
    .map((p, index) => ({ ...p, index }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const dropped = points.length - finite.length;

  let xd =
    opts.xDomain && opts.xDomain.every((d) => Number.isFinite(d))
      ? opts.xDomain
      : (extent(finite.map((p) => p.x)) ?? [0, 1]);
  let yd =
    opts.yDomain && opts.yDomain.every((d) => Number.isFinite(d))
      ? opts.yDomain
      : (extent(finite.map((p) => p.y)) ?? [0, 1]);
  if (xd[0] === xd[1]) xd = [xd[0] - 1, xd[1] + 1];
  if (yd[0] === yd[1]) yd = [yd[0] - 1, yd[1] + 1];

  const sx = scaleLinear(xd, [rad, width - rad]);
  const sy = scaleLinear(yd, [height - rad, rad]);

  const dots = finite.map((p) => ({
    x: round2(clamp(sx(p.x), rad, width - rad)),
    y: round2(clamp(sy(p.y), rad, height - rad)),
    index: p.index,
  }));

  // Pearson r + least squares over the RAW finite pairs
  let r: number | null = null;
  let trendLine: ScatterGeometry["trendLine"] = null;
  const n = finite.length;
  if (n >= 2) {
    const mx = finite.reduce((s, p) => s + p.x, 0) / n;
    const my = finite.reduce((s, p) => s + p.y, 0) / n;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const p of finite) {
      sxx += (p.x - mx) ** 2;
      syy += (p.y - my) ** 2;
      sxy += (p.x - mx) * (p.y - my);
    }
    if (sxx > 0 && syy > 0) {
      if (n >= 3) r = round2(Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy))));
      if (trend) {
        const slope = sxy / sxx;
        const y0 = my + slope * (xd[0] - mx);
        const y1 = my + slope * (xd[1] - mx);
        trendLine = {
          x1: round2(clamp(sx(xd[0]), rad, width - rad)),
          y1: round2(clamp(sy(y0), rad, height - rad)),
          x2: round2(clamp(sx(xd[1]), rad, width - rad)),
          y2: round2(clamp(sy(y1), rad, height - rad)),
        };
      }
    }
  }

  return { dots, trendLine, r, dropped };
}

/** |r| tier for the summary — a documented heuristic, not a statistical claim. */
export function relationshipTier(r: number): "strong" | "moderate" | "weak" | "none" {
  const a = Math.abs(r);
  return a >= 0.7 ? "strong" : a >= 0.4 ? "moderate" : a >= 0.2 ? "weak" : "none";
}
