// PercentileLadder: What does the
// tail look like, not just the median? Ticks at chosen percentiles on a
// zero-anchored track, graduated so the tail reads strongest (taller + accent).
// Tick DISTANCES carry the story, so the origin is never cropped; a log
// transform (long latency tails) is never silent — a `log` tag renders in a
// reserved left gutter so it never collides with a mark. Coords 2-dp.
import { quantiles } from "../../core/quantile.js";
import { clamp, extent, maxOf, minOf, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { labelFitsY, textGutter } from "../../core/labels.js";

interface LadderTick {
  p: number;
  value: number;
  x: number;
  /** 0..k-1, tail highest — drives graduated emphasis (height + color). */
  emphasis: number;
  /** Half-height of this tick around the track (taller = more emphasis). */
  half: number;
}

export interface PercentileLadderGeometry {
  track: { x0: number; x1: number; y: number };
  ticks: LadderTick[];
  /** The sample's median — what "× the median" measures against, in both entries. Unrounded. */
  median: number;
  /** last tick value / the median, 2-dp; 0 when the median is 0. */
  ratio: number;
  /** Log scale actually applied (falls back to linear on any value ≤ 0). */
  log: boolean;
  /** Placement of the in-chart `log` tag (left gutter), or null. */
  logTag: { x: number; y: number } | null;
  /** All tick values coincide → render one tick. */
  collapsed: boolean;
  labelY: number;
  /** Plot box (viewBox y): the reach of the tallest tick either side of the
   *  track. Fixed by `height` alone — never the drawn ticks, whose halves vary
   *  with the percentile count. */
  y0: number;
  y1: number;
}

const LADDER_MAX_PS = 4;
const DEFAULT_PS = [50, 90, 99];

export function percentileLadderGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  ps?: readonly number[] | undefined;
  scale?: "linear" | "log" | undefined;
  domain?: readonly [number, number] | undefined;
  /** Label font (viewBox units) — sizes the reserved `log`-tag gutter. */
  font?: number;
}): PercentileLadderGeometry | null {
  const { width, height } = opts;
  const pad = 3;
  const font = opts.font ?? 6;

  const finite = opts.data.filter(isFiniteValue);
  if (finite.length === 0) return null;

  // Percentiles outside (0, 100) are DROPPED, not clamped: `quantiles` clamps p
  // into the sample, so a `p200` tick PAINTED the maximum while the summary
  // announced "p200 … — the slowest -100%". NaN fails both comparisons, so this
  // is also the finiteness filter. A `ps` that filters down to nothing is a
  // config mistake, not an absent sample (`ps={[]}`, `ps={[0, 100]}`, a NaN out
  // of an empty number input): returning null announced "No data." over a
  // perfectly good series, so fall back to the documented default.
  const asked = [...new Set((opts.ps ?? DEFAULT_PS).filter((p) => p > 0 && p < 100))]
    .sort((a, b) => a - b)
    .slice(0, LADDER_MAX_PS);
  const ps = asked.length > 0 ? asked : DEFAULT_PS;
  const k = ps.length;

  // One sort for the ticks AND the reference: the summary and the probe both
  // say "× the median", so that is the sample's p50 — not vals[0], which
  // announced p99/p25 under the median's name whenever p50 was not the lowest
  // requested percentile, and disagreed with the interactive readout.
  const qs = quantiles(finite, [...ps.map((p) => p / 100), 0.5])!;
  const vals = qs.slice(0, k);
  const median = qs[k]!;
  const dataMax = maxOf(vals, 0);
  const dataMin = minOf(vals);
  // One requested percentile is not "all percentiles equal at X" — a single
  // tick trivially equals itself, and the flat phrasing stated a fact about the
  // distribution that was never checked.
  const collapsed = k > 1 && dataMax === dataMin;

  // log only when every sample value is > 0 (a single ≤ 0 makes log a lie)
  const log = opts.scale === "log" && finite.every((v) => v > 0) && dataMax > 0;
  const y = round2(height * 0.35); // track sits upper — labels get room below
  // The tag rides the track's midline, so it needs half a font of room above
  // `y`. Below that the tag paints out of the top of the box, so it DROPS —
  // and its gutter drops with it, rather than reserving space for absent text.
  // At that size the chart is too small to state anything in ink; the scale is
  // still declared in the accessible summary and the docs.
  const showTag = log && labelFitsY(y, font, height);
  // left gutter for the "log" tag, sized to the tag width ("log" ≈ 3 ch) so it
  // never collides with the p50 tick/label at any font size
  const lead = showTag ? textGutter(3, font, 6) : 0;

  const x0 = pad + lead;

  let x: (v: number) => number;
  if (log) {
    const lo = minOf(vals);
    const s = scaleLinear([Math.log(lo), Math.log(dataMax)], [x0, width - pad]);
    x = (v) => round2(clamp(s(Math.log(Math.max(v, lo))), x0, width - pad));
  } else {
    const dm =
      opts.domain && opts.domain.every((d) => Number.isFinite(d))
        ? opts.domain
        : ([0, dataMax || (extent(finite)?.[1] ?? 1)] as const);
    const domain: readonly [number, number] = dm[0] === dm[1] ? [dm[0], dm[1] + 1] : dm;
    const s = scaleLinear(domain, [x0, width - pad]);
    x = (v) => round2(clamp(s(v), x0, width - pad));
  }

  const maxHalf = round2(Math.min(3, height * 0.28));
  const ticks: LadderTick[] = ps.map((p, i) => ({
    p,
    value: round2(vals[i]!),
    x: x(vals[i]!),
    emphasis: k === 1 ? 0 : i,
    half: round2(maxHalf * (k === 1 ? 1 : 0.6 + 0.4 * (i / (k - 1)))),
  }));

  const quotient = median === 0 ? 0 : vals[k - 1]! / median;
  // round2 multiplies by 100 first, so a finite-but-huge quotient (denormal
  // inputs → e.g. 1.8e306) overflows to Infinity — guard the ROUNDED result
  const rounded = round2(quotient);
  const ratio = Number.isFinite(rounded) ? rounded : 0;

  return {
    track: { x0: round2(x0), x1: round2(width - pad), y },
    ticks,
    // unrounded on purpose: it is a divisor, never a painted coordinate, and
    // round2 (×100 first) overflows a denormal-scale sample to Infinity —
    // which would turn every announced multiple into 0×
    median,
    ratio,
    log,
    logTag: showTag ? { x: round2(pad - 2), y } : null,
    collapsed,
    labelY: round2(height - 0.5),
    y0: round2(y - maxHalf),
    y1: round2(y + maxHalf),
  };
}
