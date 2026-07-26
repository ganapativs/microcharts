// Waveform: Mirrored
// amplitude bars around a center hairline, compressed by MAX-PER-BUCKET (never
// mean — a mean hides spikes, and a spike is usually the whole point). The auto
// domain is symmetric ±max|data| so shape reads honestly; the peak is disclosed
// in the summary. Absolute comparisons require an explicit shared domain. 2-dp.
import { maxPerBucket, envelope } from "../../core/downsample.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface WaveBar {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

const PAD = 1;

/** buckets = min(⌊width/2⌋, samples), documented cap 64. */
export function bucketCount(width: number, samples: number): number {
  return Math.max(1, Math.min(Math.floor(width / 2), samples, 64));
}

/** Bars TILE the inner width: k slots of `bucketW`, each inset by half a gap. */
function barPitch(width: number, k: number): { bucketW: number; gap: number } {
  const bucketW = (width - PAD * 2) / k;
  return { bucketW, gap: Math.min(bucketW * 0.35, 1) };
}

/** Envelope vertices SPAN the inner width — first and last sit on the edges, so
 *  the pitch is `k - 1` steps, not `k` slots. */
function envelopeStep(width: number, k: number): number {
  return (width - PAD * 2) / Math.max(1, k - 1);
}

/**
 * The painted x of bucket `i`: a bar's centre, or an envelope vertex. The two
 * variants sit on DIFFERENT pitches, so the hit-test, crosshair and readout must
 * all read the one that is actually on screen.
 */
export function bucketX(
  i: number,
  opts: { width: number; buckets: number; mode: "bars" | "envelope" },
): number {
  const k = Math.max(1, Math.floor(opts.buckets));
  if (opts.mode === "envelope") return round2(PAD + i * envelopeStep(opts.width, k));
  const { bucketW, gap } = barPitch(opts.width, k);
  return round2(PAD + i * bucketW + gap / 2 + Math.max(0.4, bucketW - gap) / 2);
}

function maxAbs(values: readonly Value[]): number {
  let m = 0;
  for (const v of values) if (isFiniteValue(v) && Math.abs(v) > m) m = Math.abs(v);
  return m;
}

export interface WaveformGeometry {
  bars: WaveBar[];
  path: string;
  peak: number;
  peakIndex: number;
  /** Top edge of the plot box — the mirrored band's upper bound. */
  y0: number;
  /** Bottom edge of the plot box — where bars land when `mirror` is off. */
  y1: number;
}

export function waveformGeometry(opts: {
  data: readonly Value[];
  width: number;
  height: number;
  buckets: number;
  domain: readonly [number, number] | null;
  mirror: boolean;
}): WaveformGeometry {
  const { data, width, height, buckets, domain, mirror } = opts;
  const k = Math.max(1, Math.floor(buckets));
  const dmax = domain ? Math.max(Math.abs(domain[0]), Math.abs(domain[1])) : maxAbs(data);

  const innerH = height - PAD * 2;
  const cy = round2(height / 2);
  const halfH = innerH / 2;
  const { bucketW, gap } = barPitch(width, k);

  const vals = maxPerBucket(data, k, { abs: true });
  let peak = 0;
  let peakIndex = 0;
  const bars: WaveBar[] = vals.map((v, i) => {
    const amp = v == null ? 0 : Math.abs(v);
    if (amp > peak) {
      peak = amp;
      peakIndex = i;
    }
    const frac = dmax > 0 ? Math.min(1, amp / dmax) : 0;
    const x = round2(PAD + i * bucketW + gap / 2);
    const w = round2(Math.max(0.4, bucketW - gap));
    if (mirror) {
      const half = round2(frac * halfH);
      return { x, y: round2(cy - half), width: w, height: round2(half * 2), index: i };
    }
    const h = round2(frac * innerH);
    return { x, y: round2(height - PAD - h), width: w, height: h, index: i };
  });

  const path = barsPath(bars, mirror, cy);
  return { bars, path, peak: round2(peak), peakIndex, y0: PAD, y1: height - PAD };
}

/** One `<path>` of rect subpaths (1 node regardless of sample count). A
 *  zero-height bar draws a 0.4-unit tick so silence still reads as a bucket. */
export function barsPath(bars: readonly WaveBar[], mirror: boolean, cy: number): string {
  let d = "";
  for (const b of bars) {
    const h = b.height <= 0 ? 0.4 : b.height;
    const y = b.height <= 0 ? (mirror ? cy - 0.2 : b.y) : b.y;
    d += `M${b.x} ${round2(y)}h${b.width}v${round2(h)}h${-b.width}z`;
  }
  return d;
}

/** Filled min/max envelope area (waveform `mode="envelope"`) — same bucket
 *  math + null semantics as the bars; a smoother editorial texture. */
export function envelopePath(opts: {
  data: readonly Value[];
  width: number;
  height: number;
  buckets: number;
  domain: readonly [number, number] | null;
  mirror: boolean;
}): string {
  const { data, width, height, buckets, domain, mirror } = opts;
  const k = Math.max(1, Math.floor(buckets));
  const dmax = domain ? Math.max(Math.abs(domain[0]), Math.abs(domain[1])) : maxAbs(data);
  const innerH = height - PAD * 2;
  const cy = height / 2;
  const halfH = innerH / 2;
  const step = envelopeStep(width, k);
  const { min, max } = envelope(data, k);

  const yFor = (v: number | null, top: boolean): number => {
    const val = v ?? 0;
    if (mirror) {
      const f = dmax > 0 ? Math.max(-1, Math.min(1, val / dmax)) : 0;
      return round2(cy - f * halfH);
    }
    const f = dmax > 0 ? Math.min(1, Math.abs(val) / dmax) : 0;
    return round2(top ? height - PAD - f * innerH : height - PAD);
  };

  const topPts = max.map((v, i) => `${round2(PAD + i * step)} ${yFor(v, true)}`);
  const botPts = min
    .map((v, i) => `${round2(PAD + i * step)} ${yFor(mirror ? v : 0, false)}`)
    .reverse();
  return `M${topPts.join("L")}L${botPts.join("L")}Z`;
}
