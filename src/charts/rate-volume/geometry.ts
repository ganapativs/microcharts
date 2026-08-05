// RateVolume: A rate moved — on what
// volume? The rate line is precise; the ghost volume bars are deliberately
// low-precision context (the denominator). on their own zero-anchored scale.
// A rate on zero volume is undefined and is never plotted (line gap + zero bar):
// that lie — a rate nobody generated — is the one this type exists to prevent.
// Coords 2-dp, integer viewBox.
import { linePath, stepPath } from "../../core/path.js";
import { clamp, extent, maxOf, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type XY } from "../../core/types.js";

/** Default plot inset. Exported so the no-data branch — which renders before
 *  there is any geometry to read a box from — seats on the same number the
 *  plotted chart does, instead of a literal that silently desyncs. */
export const RATE_VOLUME_PAD = 2;

export interface RateVolumePoint {
  rate: number;
  volume: number;
}

interface RatePoint {
  x: number;
  y: number;
  /** volume < minVolume — "insufficient denominator", rendered hollow. */
  low: boolean;
}

/** Rate line shape — step suits per-period aggregates (no smooth: a rate line
 *  must not imply between-period values it never measured). */
export type RateCurve = "linear" | "step";

interface VolumeBar {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RateVolumeGeometry {
  bars: VolumeBar[];
  line: { d: string };
  points: RatePoint[];
  /** Last period with a real rate (finite rate on positive volume), or null. */
  last: { x: number; y: number; rate: number; volume: number; low: boolean } | null;
  /** First real rate value (for the trend clause), or null. */
  firstRate: number | null;
  /** Period count (the "across N periods" denominator). */
  n: number;
  labelX: number;
  labelY: number;
  /** Plot floor — the padded zero line the volume bars stand on. */
  plotB: number;
  totalWidth: number;
}

export function rateVolumeGeometry(opts: {
  width: number;
  height: number;
  data: readonly RateVolumePoint[];
  domain?: readonly [number, number] | undefined;
  volumeDomain?: readonly [number, number] | undefined;
  minVolume?: number | undefined;
  curve?: RateCurve | undefined;
  pad?: number | undefined;
  gutterCh?: number | undefined;
  fontSize?: number | undefined;
}): RateVolumeGeometry | null {
  const { width, height, data } = opts;
  const n = data.length;
  if (n === 0) return null;

  const pad = opts.pad ?? RATE_VOLUME_PAD;
  const gutterCh = opts.gutterCh ?? 0;
  const fontSize = opts.fontSize ?? 0;
  // 0.72·em/char over-estimates tabular digits + the wide "%" glyph
  const gutter = gutterCh > 0 ? Math.ceil(gutterCh * fontSize * 0.72) + 4 : 0;
  const minVolume = opts.minVolume;

  const plotL = pad;
  const plotR = width - pad;
  const plotT = pad;
  const plotB = height - pad;
  const slotW = (plotR - plotL) / n;
  const center = (i: number) => plotL + slotW * (i + 0.5);

  // Volume: zero-anchored bars on their own scale (context, not a series).
  const volumes = data.map((d) => (isFiniteValue(d.volume) && d.volume > 0 ? d.volume : 0));
  // `volumeDomain` gets the same finite guard the rate `domain` gets below. A
  // host that computes it as `[0, Math.max(...volumes)]` over a series holding
  // one hole hands us `[0, NaN]`, and `scaleLinear` degrades a non-finite span
  // to its range midpoint — so every ghost bar came out the SAME half-height
  // block, a denominator that encodes nothing painted as though it did. That is
  // the fake-denominator lie this type exists to prevent. A non-increasing pair
  // is the same failure spelled with finite numbers, so it falls back too.
  const vDomain =
    opts.volumeDomain &&
    opts.volumeDomain.every((d) => Number.isFinite(d)) &&
    opts.volumeDomain[1] > opts.volumeDomain[0]
      ? opts.volumeDomain
      : null;
  // maxOf, not `Math.max(0, ...volumes)`: the spread pushes one argument per
  // period, and a caller-sized series throws past ~125k.
  const volMax = vDomain ? vDomain[1] : maxOf(volumes, 0);
  const volTop = vDomain ? vDomain[0] : 0;
  const scaleV = scaleLinear([volTop, volMax], [plotB, plotT]);
  const barW = round2(Math.max(0.5, slotW * 0.68));
  const bars: VolumeBar[] = volumes.map((v, i) => {
    const top = v > 0 ? round2(clamp(scaleV(v), plotT, plotB)) : plotB;
    return {
      x: round2(center(i) - barW / 2),
      y: top,
      width: barW,
      height: round2(plotB - top),
    };
  });

  // Rate: precise line; only periods with a real denominator are plotted.
  const valid = data.map((d) => isFiniteValue(d.rate) && isFiniteValue(d.volume) && d.volume > 0);
  const rateVals = data.filter((_, i) => valid[i]).map((d) => d.rate);
  const rateExtent = extent(rateVals);

  // nothing plottable and no volume either → an empty chart, let the caller show noData
  if (rateExtent === null && volMax === 0) return null;

  const rDomain: readonly [number, number] =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? opts.domain
      : (rateExtent ?? [0, 1]);
  const scaleR = scaleLinear(rDomain, [plotB, plotT]);
  const y = (v: number) => round2(clamp(scaleR(v), plotT, plotB));

  const linePts: (XY | null)[] = data.map((d, i) =>
    valid[i] ? [round2(center(i)), y(d.rate)] : null,
  );
  const build = opts.curve === "step" ? stepPath : linePath;

  const points: RatePoint[] = [];
  data.forEach((d, i) => {
    if (!valid[i]) return;
    points.push({
      x: round2(center(i)),
      y: y(d.rate),
      low: minVolume !== undefined && d.volume < minVolume,
    });
  });

  // last real period (for the endpoint label + trend); first real rate value
  let lastIdx = -1;
  let firstRate: number | null = null;
  for (let i = 0; i < n; i++) {
    if (!valid[i]) continue;
    if (firstRate === null) firstRate = data[i]!.rate;
    lastIdx = i;
  }
  // rate/volume are DATA values (labels + summary) — never coordinate-rounded,
  // or a fractional rate like 0.041 collapses to 0.04 ("4%" not "4.1%")
  const last =
    lastIdx >= 0
      ? {
          x: round2(center(lastIdx)),
          y: y(data[lastIdx]!.rate),
          rate: data[lastIdx]!.rate,
          volume: data[lastIdx]!.volume,
          low: minVolume !== undefined && data[lastIdx]!.volume < minVolume,
        }
      : null;

  return {
    bars,
    line: { d: build(linePts) },
    points,
    last,
    firstRate,
    n,
    // endpoint label is a readout in the reserved right gutter, vertically
    // centered (start-anchored) — never overlaps the line or escapes the plot
    labelX: round2(width + 3),
    labelY: round2(height / 2),
    plotB,
    totalWidth: width + gutter,
  };
}
