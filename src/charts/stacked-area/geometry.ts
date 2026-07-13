// StackedArea geometry — pure, React-free.
// Zero-anchored cumulative stacking via core/stack. `style="ridge"` renders
// the SAME stack offsets with smooth silhouettes (editorial texture, zero
// semantic change — the visual test asserts identical offsets). 2-dp.
import { linePath, smoothPath, type Curve } from "../../core/path.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { stackSeries } from "../../core/stack.js";
import { normalizeShares } from "../../core/stack.js";
import { round2, type Value } from "../../core/types.js";

type XY = readonly [number, number];

interface StackLayerGeo {
  /** Closed area path (top edge + reversed bottom edge). */
  dArea: string;
  /** Top-edge hairline path. */
  dTop: string;
  /** Share of the final column's total (endpoint label). */
  lastShare: number;
  index: number;
}

export interface StackedAreaGeometry {
  layers: StackLayerGeo[];
  baselineY: number;
  /** Per-x shares for the interactive readout: shares[x][layer]. */
  sharesAt: number[][];
  plot: { x0: number; x1: number; y0: number; y1: number };
  n: number;
}

export function stackedAreaGeometry(opts: {
  width: number;
  height: number;
  series: readonly (readonly Value[])[];
  domain?: readonly [number, number] | undefined;
  curve: Curve;
  gutterCh: number;
  fontSize: number;
}): StackedAreaGeometry {
  const { width, height, series, curve, gutterCh, fontSize } = opts;
  const pad = 1;
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.62) + 3 : 0;
  const x0 = pad;
  const x1 = width - pad - gutter;
  const y0 = pad;
  const y1 = height - pad;

  const stacked = stackSeries(series);
  const n = stacked.totals.length;
  if (n === 0) {
    return { layers: [], baselineY: y1, sharesAt: [], plot: { x0, x1, y0, y1 }, n: 0 };
  }

  const maxTotal = Math.max(...stacked.totals, 0);
  const domain =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : ([0, Math.max(maxTotal, 1)] as const);
  const yScale = (v: number) => round2(clamp(scaleLinear(domain, [y1, y0])(v), y0, y1));
  const xFor = (i: number) => round2(n > 1 ? x0 + (i * (x1 - x0)) / (n - 1) : (x0 + x1) / 2);

  const path = curve === "smooth" ? smoothPath : linePath;

  const layers: StackLayerGeo[] = stacked.layers.map((layer, index) => {
    const top: XY[] = layer.y1.map((v, i) => [xFor(i), yScale(v)] as const);
    const bottom: XY[] = layer.y0.map((v, i) => [xFor(i), yScale(v)] as const);
    const dTop = path(top);
    // closed area: top edge forward, bottom edge reversed
    const dBottomRev = path([...bottom].reverse()).replace(/^M/, "L");
    const dArea = dTop && bottom.length > 0 ? `${dTop}${dBottomRev}Z` : "";
    const lastTotal = stacked.totals[n - 1]!;
    const lastVal = layer.y1[n - 1]! - layer.y0[n - 1]!;
    return {
      dArea,
      dTop,
      lastShare: lastTotal > 0 ? round2(lastVal / lastTotal) : 0,
      index,
    };
  });

  const sharesAt: number[][] = Array.from({ length: n }, (_, i) => {
    const col = series.map((s) => (i < s.length ? (s[i] ?? null) : null));
    const norm = normalizeShares(col);
    return norm ? norm.shares.map((s) => round2(s)) : series.map(() => 0);
  });

  return { layers, baselineY: yScale(0), sharesAt, plot: { x0, x1, y0, y1 }, n };
}
