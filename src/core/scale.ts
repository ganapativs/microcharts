// Linear scale + domain helpers. No d3 — `(v-min)/(max-min)*h`.
import { isFiniteValue, type Value } from "./types.js";

export type Scale = (value: number) => number;

/**
 * Maps `domain` → `range` linearly. Degenerate domain (min === max) maps every
 * value to the range midpoint, so a flat series renders centered, not at an
 * edge or NaN. Values outside the domain are NOT clamped (callers clamp when
 * they need to); this keeps the scale a pure affine map.
 */
export function scaleLinear(
  domain: readonly [number, number],
  range: readonly [number, number],
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  // degenerate domain — zero span (slope NaN/±Infinity) or a denormal span
  // (slope overflows, then 0 × Infinity poisons results): map to the midpoint.
  //
  // The span itself must be checked too, not just the slope: an INFINITE span
  // (`[-Infinity, Infinity]`, or a finite domain whose difference overflows —
  // e.g. a running total past 1e308) gives a slope of exactly 0, which is
  // finite and sails through. Then `(value - d0) * 0` is `Infinity * 0` → NaN,
  // and every downstream `clamp` is NaN-transparent (`NaN < min` and
  // `NaN > max` are both false), so the NaN reaches the emitted coordinate and
  // the mark silently vanishes.
  const span = d1 - d0;
  const m = (r1 - r0) / span;
  if (!Number.isFinite(m) || !Number.isFinite(span) || !Number.isFinite(d0)) {
    const mid = (r0 + r1) / 2;
    return () => mid;
  }
  return (value) => r0 + (value - d0) * m;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * `Math.max(...values, seed)` without the spread. Same semantics — including
 * NaN propagation and the `-Infinity` identity — but it never pushes one
 * argument per element onto the call stack.
 *
 * The spread form throws `RangeError: Maximum call stack size exceeded` past
 * roughly 125k arguments, and `data` is caller-sized: a chart handed a long
 * series would crash rather than render. Use this (or `extent`) for anything
 * derived from caller data; never spread an array whose length you don't own.
 */
export function maxOf(values: Iterable<number>, seed = -Infinity): number {
  let m = seed;
  for (const v of values) {
    if (Number.isNaN(v)) return NaN;
    if (v > m) m = v;
  }
  return m;
}

/** `Math.min(...values, seed)` without the spread — see `maxOf`. */
export function minOf(values: Iterable<number>, seed = Infinity): number {
  let m = seed;
  for (const v of values) {
    if (Number.isNaN(v)) return NaN;
    if (v < m) m = v;
  }
  return m;
}

/**
 * Min/max of the finite values, ignoring null/NaN/±Infinity. Returns null when
 * nothing is plottable (empty, all-null) so callers decide the empty behavior.
 */
export function extent(values: readonly Value[]): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (!isFiniteValue(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return min === Infinity ? null : [min, max];
}

/**
 * A domain suitable for the y-axis. `zero: true` anchors at 0 (areas/bars);
 * otherwise fits the data. Falls back to `[0, 1]` when nothing is plottable so
 * a chart still has a valid coordinate space.
 */
export function niceDomain(values: readonly Value[], zero = false): [number, number] {
  const e = extent(values);
  if (!e) return [0, 1];
  let [min, max] = e;
  if (zero) {
    if (min > 0) min = 0;
    if (max < 0) max = 0;
  }
  if (min === max) {
    // pad a flat series so it has a non-degenerate band to sit in
    const pad = min === 0 ? 1 : Math.abs(min) * 0.5;
    // …but an all-zero series still owes `zero` its anchor. The block above is a
    // no-op there (0 is already both ends), and a symmetric pad then put 0 at
    // the MIDDLE of the domain — the one flat input where the zero anchor was
    // dropped, so the baseline drew across the midline instead of the floor.
    if (zero && min === 0) return [0, pad];
    return [min - pad, max + pad];
  }
  return [min, max];
}
