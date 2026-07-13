// Long-series downsampling. Max-per-bucket, NEVER mean
// a spike is usually the whole reason someone is looking, and
// averaging erases it. Buckets are index-proportional so time stays linear.
// Outputs are data-space (charts scale + round to viewBox).
import { isFiniteValue, type Value } from "./types.js";

/** Bucket edges: bucket `i` covers indices [⌊i·n/k⌋, ⌊(i+1)·n/k⌋). */
function bucketStart(i: number, n: number, k: number): number {
  return Math.floor((i * n) / k);
}

/**
 * Collapses the series to ≤ `buckets` values, keeping each bucket's maximum
 * (`abs: true` keeps the value farthest from zero, sign preserved — waveform/
 * seismogram amplitude). The global max always survives (property-tested).
 * `buckets ≥ length` returns a plain copy (no-op guard for the common short
 * series); `buckets < 1` → []. Buckets containing no finite value emit null,
 * so gaps stay gaps and are never invented away.
 */
export function maxPerBucket(
  values: readonly Value[],
  buckets: number,
  opts: { abs?: boolean } = {},
): (number | null)[] {
  const n = values.length;
  const k = Math.floor(buckets);
  if (k < 1) return [];
  if (k >= n) return values.map((v) => (isFiniteValue(v) ? v : null));

  const abs = opts.abs === true;
  const out: (number | null)[] = [];
  for (let i = 0; i < k; i++) {
    const end = bucketStart(i + 1, n, k);
    let best: number | null = null;
    for (let j = bucketStart(i, n, k); j < end; j++) {
      const v = values[j];
      if (!isFiniteValue(v)) continue;
      if (best === null || (abs ? Math.abs(v) > Math.abs(best) : v > best)) best = v;
    }
    out.push(best);
  }
  return out;
}

/** A surviving observation pinned to its original index (`value: null` = a
 *  fully-empty bucket, kept so line gaps survive decimation). */
export interface IndexedValue {
  index: number;
  value: number | null;
}

/**
 * Index-preserving min/max decimation for LINE rendering (the long-series
 * sparkline guard, ). Each bucket contributes its min and max at
 * their ORIGINAL indices, in index order — spikes keep their true x position
 * and both extremes survive (never mean, never midpoint). Output ≤ 2·buckets
 * entries; `buckets ≥ length` is an identity pass-through.
 */
export function decimateMinMax(values: readonly Value[], buckets: number): IndexedValue[] {
  const n = values.length;
  const k = Math.floor(buckets);
  if (k < 1) return [];
  if (k >= n) return values.map((v, i) => ({ index: i, value: isFiniteValue(v) ? v : null }));

  const out: IndexedValue[] = [];
  for (let i = 0; i < k; i++) {
    const end = bucketStart(i + 1, n, k);
    let lo = -1;
    let hi = -1;
    for (let j = bucketStart(i, n, k); j < end; j++) {
      const v = values[j];
      if (!isFiniteValue(v)) continue;
      if (lo < 0 || v < (values[lo] as number)) lo = j;
      if (hi < 0 || v > (values[hi] as number)) hi = j;
    }
    if (lo < 0) {
      out.push({ index: bucketStart(i, n, k), value: null });
    } else if (lo === hi) {
      out.push({ index: lo, value: values[lo] as number });
    } else {
      const a = Math.min(lo, hi);
      const b = Math.max(lo, hi);
      out.push({ index: a, value: values[a] as number }, { index: b, value: values[b] as number });
    }
  }
  return out;
}

/**
 * Min/max envelope per bucket — the shape-preserving alternative when both
 * extremes matter (waveform `style="envelope"`). Same bucket math and null
 * semantics as `maxPerBucket`; global min and max both survive.
 */
export function envelope(
  values: readonly Value[],
  buckets: number,
): { min: (number | null)[]; max: (number | null)[] } {
  const n = values.length;
  const k = Math.floor(buckets);
  if (k < 1) return { min: [], max: [] };
  if (k >= n) {
    const copy = values.map((v) => (isFiniteValue(v) ? v : null));
    return { min: [...copy], max: copy };
  }

  const min: (number | null)[] = [];
  const max: (number | null)[] = [];
  for (let i = 0; i < k; i++) {
    const end = bucketStart(i + 1, n, k);
    let lo: number | null = null;
    let hi: number | null = null;
    for (let j = bucketStart(i, n, k); j < end; j++) {
      const v = values[j];
      if (!isFiniteValue(v)) continue;
      if (lo === null || v < lo) lo = v;
      if (hi === null || v > hi) hi = v;
    }
    min.push(lo);
    max.push(hi);
  }
  return { min, max };
}
