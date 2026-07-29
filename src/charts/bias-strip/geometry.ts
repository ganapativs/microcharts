// BiasStrip: A word-sized
// Bland–Altman plot (Bland & Altman 1986): x = the mean of a paired measurement
// (a+b)/2, y = their difference (a−b) centered on 0, so a systematic offset from
// the zero line reads as vertical drift. The bias (mean difference) and the
// ±k·σ limits of agreement live here, property-tested; the y-domain is symmetric
// about 0 so "no bias" is always the visual center. Non-finite pairs dropped,
// > 40 dots uniformly downsampled for display (stats use every finite pair).
// Coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { labelFont } from "../../core/labels.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export interface BiasPair {
  a: number;
  b: number;
}

/** Dot radii + caption metrics, shared by both entries so the static and the
 *  interactive overlay compute one identical geometry (canon). `captionPad` is
 *  the top gutter reserved for the seat-gated bias caption; the plot compresses
 *  below it so no dot ever sits under the caption. */
export function biasLayout(
  width: number,
  height: number,
  label: string,
  r: number | undefined,
): { rad: number; outlierRad: number; fontSize: number; captionPad: number } {
  // `clamp` is NaN-transparent by design (see core/scale.ts), so an `r` of NaN
  // sailed straight through it and poisoned every cx/cy/r, the band rect, and
  // the `--mc-seat` variable — a chart that paints nothing and unseats itself
  // on the text line. Anything unusable falls back to the documented default.
  const rad = clamp(isFiniteValue(r) ? r : 1.5, 1, 3);
  const fontSize = labelFont(height, 0.28);
  const captionPad = label === "bias" && width >= 40 && height >= 3 * fontSize ? fontSize + 2 : 0;
  return { rad, outlierRad: round2(rad + 0.3), fontSize, captionPad };
}

export interface BiasGeometry {
  /** Projected dots (downsampled to ≤ 40 for display), 2-dp. */
  dots: { x: number; y: number; index: number; outside: boolean }[];
  /** Limits-of-agreement band rect (full width), or null when n < 5. */
  band: { y: number; height: number } | null;
  /** Pixel y of the zero-difference reference line (always the center). */
  zeroY: number;
  /** Pixel y of the bias (mean-difference) line, or null when n < 5. */
  biasY: number | null;
  /** Mean difference over every finite pair, 2-dp; null when n === 0. */
  bias: number | null;
  /** Share (0–100) of finite pairs inside the limits, or null when n < 5. */
  withinPct: number | null;
  /** Count of finite pairs (stats basis). */
  n: number;
  /** Plot box (viewBox y) the symmetric diff scale paints into — the caption
   *  gutter is already subtracted, so the zero line is its exact centre. */
  y0: number;
  y1: number;
}

/** Uniform down-sample preserving first/last — display only, never stats.
 *  The sole caller maps over the result, so the small-case can pass `arr` back
 *  unchanged rather than copying it. */
function downsample<T>(arr: readonly T[], cap: number): readonly T[] {
  if (arr.length <= cap) return arr;
  const out: T[] = [];
  const step = (arr.length - 1) / (cap - 1);
  for (let i = 0; i < cap; i++) out.push(arr[Math.round(i * step)]!);
  return out;
}

export function biasStripGeometry(opts: {
  width: number;
  height: number;
  data: readonly BiasPair[];
  /** k in bias ± k·σ. Non-finite or negative → 1.96 (≈ 95% limits). */
  limits: number;
  /** Dot radius (used only to pad the plot so marks never clip). */
  rad: number;
  /** Top gutter reserved for the bias caption; applied only when a band exists. */
  captionPad?: number;
}): BiasGeometry {
  const { width, height, data, limits, rad, captionPad = 0 } = opts;

  const finite = data
    .map((p, i) => ({ i, mean: (p.a + p.b) / 2, diff: p.a - p.b }))
    .filter((p) => isFiniteValue(p.mean) && isFiniteValue(p.diff));
  const n = finite.length;

  if (n === 0) {
    return {
      dots: [],
      band: null,
      zeroY: round2(height / 2),
      biasY: null,
      bias: null,
      withinPct: null,
      n: 0,
      y0: round2(rad),
      y1: round2(height - rad),
    };
  }

  // stats over EVERY finite pair (display down-sampling never moves the band).
  const diffs = finite.map((p) => p.diff);
  const bias = diffs.reduce((s, d) => s + d, 0) / n;
  const sd = Math.sqrt(diffs.reduce((s, d) => s + (d - bias) ** 2, 0) / (n - 1));

  // k has to be finite and non-negative. `bias ± k·σ` is symmetric, so a
  // negative k names the same band while making `d >= lower && d <= upper`
  // unsatisfiable — every pair is re-inked as an outlier and the summary
  // announces 0% within. A non-finite k is worse: it poisons the symmetric
  // y-domain below, `scaleLinear` degenerates to its midpoint, every dot stacks
  // on the zero line, and the summary still announces a within-limits share for
  // limits the chart never painted.
  const k = isFiniteValue(limits) && limits >= 0 ? limits : 1.96;
  const upper = bias + k * sd;
  const lower = bias - k * sd;

  // micro-box precedent: with fewer than 5 pairs the limits aren't meaningful —
  // show the dots and the zero reference only. The same degradation covers
  // unpaintable limits, and the test is the SPAN, not each end: a k of 1e308
  // leaves both ends finite but overflows the symmetric domain 2m, and
  // `scaleLinear` then maps every dot onto one midpoint while the summary still
  // announces "100% within". Dropping the band keeps the domain on the diffs,
  // so the cloud stays readable and the summary claims only what it painted.
  // It is also what keeps the n === 1 `sd` of NaN off every coordinate.
  const hasBand = n >= 5 && isFiniteValue(upper - lower);
  // integer percentage — the summary renders it verbatim (no re-rounding)
  const withinPct = hasBand
    ? Math.round((diffs.filter((d) => d >= lower && d <= upper).length / n) * 100)
    : null;

  // symmetric y-domain about 0 so the zero line is always the center and a
  // systematic offset reads as vertical drift. Fits every dot AND the limits.
  let m = 0;
  for (const d of diffs) m = Math.max(m, Math.abs(d));
  if (hasBand) m = Math.max(m, Math.abs(upper), Math.abs(lower));
  if (m === 0) m = 1; // perfect agreement — a non-degenerate band to sit in

  let xd = extent(finite.map((p) => p.mean)) ?? [0, 1];
  if (xd[0] === xd[1]) xd = [xd[0] - 1, xd[1] + 1];

  // reserve the caption gutter (top) only when a bias line exists to sit in it.
  // means lie within their extent domain and diffs within [-m, m], so both
  // scales already land inside their range — no clamp needed on the marks.
  const y1 = height - rad;
  const y0 = rad + (hasBand ? captionPad : 0);
  const sx = scaleLinear(xd, [rad, width - rad]);
  const sy = scaleLinear([-m, m], [y1, y0]);
  const cy = (v: number) => round2(sy(v));
  const zeroY = cy(0);
  const biasY = hasBand ? cy(bias) : null;

  let band: BiasGeometry["band"] = null;
  if (hasBand) {
    const yTop = sy(upper);
    const yBot = sy(lower);
    let top = Math.min(yTop, yBot);
    let h = Math.abs(yBot - yTop);
    if (h < 0.75) {
      // collapsed limits (near-perfect agreement) → a hair-thin band, still seen
      h = 0.75;
      top = (biasY ?? zeroY) - h / 2;
    }
    // top and h derive from in-range sy values, so the band already fits
    band = { y: round2(top), height: round2(h) };
  }

  const dots = downsample(finite, 40).map((p) => ({
    x: round2(sx(p.mean)),
    y: cy(p.diff),
    index: p.i,
    outside: hasBand && (p.diff > upper || p.diff < lower),
  }));

  return {
    dots,
    band,
    zeroY,
    biasY,
    bias: round2(bias),
    withinPct,
    n,
    y0: round2(y0),
    y1: round2(y1),
  };
}
