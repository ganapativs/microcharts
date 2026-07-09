// ChangePoint geometry — pure, React-free (plan/23 #19). When did the behaviour
// change level? A break marker + regime shading, over the series line. The
// detector lives HERE, not in core (plan/21 §6.0.C) and is a documented
// HEURISTIC, not statistics: two-segment mean-shift via binary segmentation,
// gated on both an SS-reduction ratio and an effect size, recursing up to `max`.
// Coords 2-dp, integer viewBox.
import { round2, isFiniteValue } from "../../core/types.js";

/** A split is accepted only if it cuts the pooled sum-of-squares by > this. */
export const BREAK_SS_RATIO = 0.2;
/** …and only if |Δmean| ≥ this × the pooled standard deviation. */
export const BREAK_EFFECT_SIZE = 0.8;
/** Minimum segment length = max(3, ⌈n / this⌉). */
export const BREAK_MIN_SEG_DIVISOR = 10;

interface Stat {
  sum: number;
  sumSq: number;
}

// running stats over a slice via prefix sums (O(1) per segment)
function segStat(prefix: Stat[], lo: number, hi: number): { mean: number; ss: number; n: number } {
  const n = hi - lo;
  if (n <= 0) return { mean: NaN, ss: 0, n: 0 };
  const sum = prefix[hi]!.sum - prefix[lo]!.sum;
  const sumSq = prefix[hi]!.sumSq - prefix[lo]!.sumSq;
  const mean = sum / n;
  return { mean, ss: sumSq - (sum * sum) / n, n };
}

/**
 * Detect up to `max` mean-shift breaks (indices where a new regime starts).
 * A labelled heuristic — never call this statistical significance.
 */
export function detectBreaks(values: readonly number[], max = 2, minSeg?: number): number[] {
  const finite = values.filter(isFiniteValue);
  const n = finite.length;
  const cap = Math.max(1, Math.min(3, Math.round(max)));
  const seg = minSeg ?? Math.max(3, Math.ceil(n / BREAK_MIN_SEG_DIVISOR));
  if (n < 2 * seg) return [];

  // prefix sums over the FULL (finite-filtered) series
  const prefix: Stat[] = [{ sum: 0, sumSq: 0 }];
  for (let i = 0; i < n; i++) {
    const v = finite[i]!;
    prefix.push({ sum: prefix[i]!.sum + v, sumSq: prefix[i]!.sumSq + v * v });
  }

  const bestSplit = (lo: number, hi: number): number => {
    const whole = segStat(prefix, lo, hi);
    if (whole.n < 2 * seg || whole.ss <= 0) return -1;
    let bestK = -1;
    let bestSS = whole.ss;
    for (let k = lo + seg; k <= hi - seg; k++) {
      const a = segStat(prefix, lo, k);
      const b = segStat(prefix, k, hi);
      const splitSS = a.ss + b.ss;
      if (splitSS < bestSS) {
        bestSS = splitSS;
        bestK = k;
      }
    }
    if (bestK < 0) return -1;
    const a = segStat(prefix, lo, bestK);
    const b = segStat(prefix, bestK, hi);
    const ratio = (whole.ss - bestSS) / whole.ss;
    const pooledSD = Math.sqrt(whole.ss / whole.n);
    if (ratio > BREAK_SS_RATIO && Math.abs(a.mean - b.mean) >= BREAK_EFFECT_SIZE * pooledSD)
      return bestK;
    return -1;
  };

  // binary segmentation: repeatedly split the first segment that still yields an
  // accepted cut, until none qualify or we hit `max`
  const bounds = [0, n];
  const breaks: number[] = [];
  while (breaks.length < cap) {
    let pick = -1;
    for (let s = 0; s < bounds.length - 1; s++) {
      const k = bestSplit(bounds[s]!, bounds[s + 1]!);
      if (k > 0) {
        pick = k;
        break;
      }
    }
    if (pick < 0) break;
    breaks.push(pick);
    bounds.push(pick);
    bounds.sort((x, y) => x - y);
  }
  return breaks.sort((x, y) => x - y);
}

export interface ChangePointGeometry {
  line: { d: string };
  segments: { x0: number; x1: number; meanY: number; mean: number }[];
  breaks: { index: number; x: number; before: number; after: number; delta: number }[];
  n: number;
}

export function changePointGeometry(opts: {
  width: number;
  height: number;
  data: readonly number[];
  breaks?: "auto" | readonly number[] | undefined;
  max?: number | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
}): ChangePointGeometry | null {
  const { width, height, data } = opts;
  const n = data.length;
  if (n === 0) return null;

  const pad = opts.pad ?? 2;
  // one pass for the y-domain (inlined min/max — avoids the `extent` import)
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of data)
    if (isFiniteValue(v)) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  if (lo === Infinity) return null;

  const [d0, d1] = opts.domain ?? [lo, hi];
  const plotH = height - 2 * pad;
  const plotW = width - 2 * pad;
  // inlined linear scales (avoids the `scaleLinear` import); degenerate → mid
  const sy = (v: number): number =>
    d1 === d0 ? height / 2 : height - pad - ((v - d0) / (d1 - d0)) * plotH;
  const lastX = Math.max(1, n - 1);
  const sx = (i: number): number => pad + (i / lastX) * plotW;

  // n < 8 turns detection off; explicit breaks are always honoured
  const rawBreaks =
    opts.breaks && opts.breaks !== "auto"
      ? [...opts.breaks].filter((i) => Number.isInteger(i) && i > 0 && i < n).sort((a, b) => a - b)
      : n >= 8
        ? detectBreaks(data as number[], opts.max)
        : [];
  const bpts = [...new Set(rawBreaks)];

  // segment boundaries in index space
  const bounds = [0, ...bpts, n];
  const segMean = (from: number, to: number): number => {
    let s = 0;
    let c = 0;
    for (let i = from; i < to; i++)
      if (isFiniteValue(data[i])) {
        s += data[i]!;
        c++;
      }
    return c > 0 ? s / c : NaN;
  };

  const segments = [];
  for (let s = 0; s < bounds.length - 1; s++) {
    const a = bounds[s]!;
    const b = bounds[s + 1]!;
    const mean = segMean(a, b);
    segments.push({
      x0: round2(sx(a)),
      x1: round2(sx(b - 1)),
      meanY: Number.isFinite(mean) ? round2(sy(mean)) : round2(height / 2),
      mean: Number.isFinite(mean) ? round2(mean) : NaN,
    });
  }

  const breaks = bpts.map((index, k) => {
    const before = segMean(bounds[k]!, index);
    const after = segMean(index, bounds[k + 2]!);
    const delta = before !== 0 && Number.isFinite(before) ? (after - before) / Math.abs(before) : 0;
    return {
      index,
      x: round2(sx(index)),
      before: round2(before),
      after: round2(after),
      delta: round2(delta),
    };
  });

  // line with gaps at non-finite points (inlined — avoids the `linePath` import)
  let d = "";
  let pen = false;
  for (let i = 0; i < n; i++) {
    if (isFiniteValue(data[i])) {
      d += `${pen ? " L" : "M"}${round2(sx(i))} ${round2(sy(data[i]!))}`;
      pen = true;
    } else pen = false;
  }

  return {
    line: { d },
    segments,
    breaks,
    n,
  };
}
