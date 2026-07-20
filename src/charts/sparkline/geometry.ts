// Sparkline geometry — pure, React-free, measurement-free.
// Maps a series into viewBox pixel space so the static component is a thin
// render over this. Kept here (not inline) so it is property/edge-tested in the
// node project without a browser. Coords are 2-dp via the kernel.
import { niceDomain, scaleLinear } from "../../core/scale.js";
import { seriesStats } from "../../core/stats.js";
import { isFiniteValue, round2, type Value, type XY } from "../../core/types.js";

/** Series longer than this auto-decimate for line drawing (documented guard). */
const DEFAULT_MAX_POINTS = 200;

/** A placed mark: its position (viewBox px) + the underlying data value/index. */
interface Mark {
  x: number;
  y: number;
  value: number;
  index: number;
}

export interface SparkGeometry {
  /** Scaled series in viewBox space; `null` preserves gaps for the path builders.
   *  Always 1:1 with `data` (the interactive overlay indexes it by data index). */
  points: (XY | null)[];
  /** What the line/area actually draw: `points` itself for short series, or an
   *  index-preserving min/max decimation past `maxPoints` (spikes survive at
   *  their true x; summaries/marks always come from the raw data). */
  linePoints: (XY | null)[];
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
  /** Resolved y-domain (explicit or auto-fit) — the annotations frame maps
   *  data-space coordinates through it. */
  domain: readonly [number, number];
}

/**
 * Deterministic label sizing — text is unmeasurable server-side, so it is never
 * measured. Font size is in viewBox units (an SVG attribute, so it scales with
 * the chart instead of drifting against em-based CSS); 0.62em-per-char is a safe
 * over-estimate for tabular digits + separators.
 *
 * The label budget is ~45% of the width: past that the endpoint figure has eaten
 * the series it is annotating. A long value (`1,234,567` on a narrow spark) can
 * ask for more than that, and it shrinks rather than paint into the margin —
 * down to a 5-unit floor, below which the budget yields instead.
 *
 * The gutter is then always what the chosen size actually needs; clamping it to
 * the budget while the text still rendered at full length overhung the viewBox
 * by up to 8 units and broke containment.
 */
export function labelMetrics(
  text: string,
  width: number,
  height: number,
): { fontSize: number; gutter: number } {
  const ideal = Math.max(6, Math.min(Math.round(height * 0.5), 11));
  const budget = Math.floor(width * 0.45);
  const needs = (size: number): number => Math.ceil(text.length * size * 0.62) + 6;

  let fontSize = ideal;
  if (needs(fontSize) > budget && text.length > 0) {
    // Largest size whose gutter fits the budget, floored so the figure stays
    // readable and capped at `ideal` so a roomy chart never grows its label.
    const fitted = Math.floor((budget - 6) / (text.length * 0.62));
    fontSize = Math.max(5, Math.min(ideal, fitted));
  }
  return { fontSize, gutter: needs(fontSize) };
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
  /** Vertical insets reserved for min/max value labels (viewBox units). */
  gutterTop?: number | undefined;
  gutterBottom?: number | undefined;
  /** Line-drawing point cap before min/max decimation kicks in (default 200).
   *  `Infinity` opts out. */
  maxPoints?: number | undefined;
}

/**
 * Places `data` into the chart's pixel box. Degenerate series are handled up
 * front: empty / all-null → no marks, valid empty plot;
 * a single point sits centered; a flat series renders on the mid-line (the
 * scale maps a zero-span domain to its range midpoint).
 */
export function sparkGeometry(data: readonly Value[], opts: SparkGeometryOptions): SparkGeometry {
  const { width, height, pad = 2, gutterRight = 0, gutterTop = 0, gutterBottom = 0 } = opts;
  const x0 = pad;
  const x1 = width - pad - gutterRight;
  const y0 = pad + gutterTop;
  const y1 = height - pad - gutterBottom;
  const plot = { x0, x1, y0, y1 };

  const domain = opts.domain ?? niceDomain(data, opts.zero);
  const yScale = scaleLinear(domain, [y1, y0]); // invert: larger value → smaller y
  const n = data.length;
  const xFor = (i: number): number => (n > 1 ? x0 + (i * (x1 - x0)) / (n - 1) : (x0 + x1) / 2);

  const points: (XY | null)[] = data.map((v, i) =>
    isFiniteValue(v) ? [round2(xFor(i)), round2(yScale(v))] : null,
  );

  // Long-series guard: past maxPoints the DRAWN line drops to
  // an index-preserving min/max envelope — same rule as core/downsample, but
  // reusing the already-scaled points so the guard costs no extra mapping.
  // Spikes keep their true x/y, empty buckets stay gaps; marks/summaries always
  // read the raw data.
  const maxPoints = opts.maxPoints ?? DEFAULT_MAX_POINTS;
  let linePoints = points;
  if (n > maxPoints) {
    const k = Math.max(1, Math.floor(maxPoints / 2));
    linePoints = [];
    for (let b = 0; b < k; b++) {
      const end = Math.floor(((b + 1) * n) / k);
      let lo = -1;
      let hi = -1;
      for (let j = Math.floor((b * n) / k); j < end; j++) {
        const v = data[j];
        if (!isFiniteValue(v)) continue;
        if (lo < 0 || v < (data[lo] as number)) lo = j;
        if (hi < 0 || v > (data[hi] as number)) hi = j;
      }
      if (lo < 0) linePoints.push(null);
      else if (lo === hi) linePoints.push(points[lo]!);
      else linePoints.push(points[Math.min(lo, hi)]!, points[Math.max(lo, hi)]!);
    }
  }

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
  // plot floor. Guarantees areas anchor honestly.
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

  return { points, linePoints, baselineY, last, min, max, band, plot, domain };
}
