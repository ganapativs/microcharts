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
  // (slope overflows, then 0 × Infinity poisons results): map to the midpoint
  const m = (r1 - r0) / (d1 - d0);
  if (!Number.isFinite(m)) {
    const mid = (r0 + r1) / 2;
    return () => mid;
  }
  return (value) => r0 + (value - d0) * m;
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
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
 * A domain suitable for the y-axis. `zero: true` anchors at 0 (areas/bars —
 * , /06); otherwise fits the data. Falls back to `[0, 1]`
 * when nothing is plottable so a chart still has a valid coordinate space.
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
    return [min - pad, max + pad];
  }
  return [min, max];
}
