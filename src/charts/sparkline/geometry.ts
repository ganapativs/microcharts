// Sparkline geometry — pure, React-free, measurement-free (plan/03, plan/18).
// Maps a series into viewBox pixel space so the static component is a thin
// render over this. Kept here (not inline) so it is property/edge-tested in the
// node project without a browser. Coords are 2-dp (plan/07/09) via the kernel.
import { niceDomain, scaleLinear } from "../../core/scale.js";
import { seriesStats } from "../../core/stats.js";
import { isFiniteValue, round2, type Value, type XY } from "../../core/types.js";

/** A placed mark: its position (viewBox px) + the underlying data value/index. */
interface Mark {
  x: number;
  y: number;
  value: number;
  index: number;
}

export interface SparkGeometry {
  /** Scaled series in viewBox space; `null` preserves gaps for the path builders. */
  points: (XY | null)[];
  /** y of the area baseline (bottom for data-fit, y(0) when zero-anchored). */
  baselineY: number;
  /** Endpoint / extrema marks — `null` when the series has no finite value. */
  last: Mark | null;
  min: Mark | null;
  max: Mark | null;
  /** Normal-range band rect (viewBox px), clamped to the plot, or `null`. */
  band: { x: number; y: number; width: number; height: number } | null;
  /** Plot rectangle (inside the padding) for the interactive overlay. */
  plot: { x0: number; x1: number; y0: number; y1: number };
}

/**
 * Deterministic label sizing (no DOM measurement — plan/03). Font size is in
 * viewBox units (set as an SVG attribute, so it scales with the chart instead
 * of drifting against em-based CSS), and the gutter reserves enough plot width
 * that the text NEVER paints outside the viewBox (containment rule, CLAUDE.md).
 * 0.62em-per-char is a safe over-estimate for tabular digits + separators.
 */
export function labelMetrics(
  text: string,
  width: number,
  height: number,
): { fontSize: number; gutter: number } {
  const fontSize = Math.max(6, Math.min(Math.round(height * 0.5), 11));
  const gutter = Math.min(Math.ceil(text.length * fontSize * 0.62) + 4, Math.floor(width * 0.45));
  return { fontSize, gutter };
}

export interface SparkGeometryOptions {
  width: number;
  height: number;
  /** Explicit y-domain; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  /** Anchor the domain (and area baseline) at zero — the area/fill case. */
  zero?: boolean | undefined;
  /** Constant normal-range `[lo, hi]` in data units. */
  band?: readonly [number, number] | undefined;
  /** Inset so endpoint dots and strokes are not clipped. */
  pad?: number;
  /** Extra right inset reserved for a direct endpoint label (viewBox units). */
  gutterRight?: number | undefined;
}

/**
 * Places `data` into the chart's pixel box. Degenerate series are handled up
 * front (plan/09 edge matrix): empty / all-null → no marks, valid empty plot;
 * a single point sits centered; a flat series renders on the mid-line (the
 * scale maps a zero-span domain to its range midpoint).
 */
export function sparkGeometry(data: readonly Value[], opts: SparkGeometryOptions): SparkGeometry {
  const { width, height, pad = 2, gutterRight = 0 } = opts;
  const x0 = pad;
  const x1 = width - pad - gutterRight;
  const y0 = pad;
  const y1 = height - pad;
  const plot = { x0, x1, y0, y1 };

  const domain = opts.domain ?? niceDomain(data, opts.zero);
  const yScale = scaleLinear(domain, [y1, y0]); // invert: larger value → smaller y
  const n = data.length;
  const xFor = (i: number): number => (n > 1 ? x0 + (i * (x1 - x0)) / (n - 1) : (x0 + x1) / 2);

  const points: (XY | null)[] = data.map((v, i) =>
    isFiniteValue(v) ? [round2(xFor(i)), round2(yScale(v))] : null,
  );

  const stats = seriesStats(data);
  const mark = (index: number, value: number): Mark => ({
    x: round2(xFor(index)),
    y: round2(yScale(value)),
    value,
    index,
  });
  const last = stats ? mark(stats.lastIndex, stats.last) : null;
  const min = stats ? mark(stats.minIndex, stats.min) : null;
  const max = stats ? mark(stats.maxIndex, stats.max) : null;

  // Area baseline: y(0) when zero-anchored (clamped into the domain), else the
  // plot floor. Guarantees areas anchor honestly (plan/05/06, lie factor = 1).
  const baselineVal = opts.zero ? Math.min(Math.max(0, domain[0]), domain[1]) : domain[0];
  const baselineY = round2(yScale(baselineVal));

  let band: SparkGeometry["band"] = null;
  if (opts.band) {
    const [lo, hi] = opts.band;
    if (isFiniteValue(lo) && isFiniteValue(hi)) {
      const a = yScale(lo);
      const b = yScale(hi);
      const top = Math.max(y0, Math.min(a, b));
      const bottom = Math.min(y1, Math.max(a, b));
      const h = bottom - top;
      if (h > 0) band = { x: x0, y: round2(top), width: round2(x1 - x0), height: round2(h) };
    }
  }

  return { points, baselineY, last, min, max, band, plot };
}
