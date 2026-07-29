// An ambient load read. The STATIC frame is a real chart: a core dot (colored by
// threshold band) plus a level ring whose distance from the core encodes the
// level. The interactive entry adds a pulse whose rate is the level (motion IS
// the encoding) — but the ring offset here carries the same information without
// motion. band: 0 calm / 1 elevated / 2 strained. All coords 2-dp.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

/** Documented defaults, shared by the geometry and the summary. */
const DEFAULT_SIZE = 16;
const DEFAULT_THRESHOLDS: readonly [number, number] = [0.5, 0.8];

export interface BreathingDotGeometry {
  core: { cx: number; cy: number; r: number };
  ring: { cx: number; cy: number; r: number };
  band: 0 | 1 | 2;
  /** level ∈ [0,1], or NaN when the value is unknown. */
  level: number;
  unknown: boolean;
  size: number;
}

/**
 * Band edges, resolved once. Hosts compute these — a settings field, a config
 * fetch — so a non-finite edge is ordinary: `Number("")` is NaN, and NaN loses
 * every comparison, so `thresholds={[NaN, NaN]}` painted a red dot and
 * announced "strained" at every load. A descending pair is normalised the way
 * `Bullet` normalises its bands, so "elevated" stays reachable.
 */
export function resolveThresholds(
  t?: readonly [number, number] | undefined,
): readonly [number, number] {
  if (!t || !isFiniteValue(t[0]) || !isFiniteValue(t[1])) return DEFAULT_THRESHOLDS;
  return t[0] <= t[1] ? t : [t[1], t[0]];
}

/**
 * calm / elevated / strained from a level already clamped to [0,1]. One
 * function, so the core's color and the spoken band word read the same edges.
 */
export function loadBand(level: number, thresholds: readonly [number, number]): 0 | 1 | 2 {
  return level < thresholds[0] ? 0 : level < thresholds[1] ? 1 : 2;
}

/**
 * Glyph box, resolved once. `size` arrives from a host too (a CSS var read back,
 * a collapsed flex measurement, an empty numeric input). Every coordinate below
 * derives from THIS value: the old code drew from the raw prop while exporting a
 * clamped box, so `size={-20}` put the dot at cx=-10 inside a 1×1 viewBox —
 * `.mc-root` is `overflow: visible`, so that paints on the page rather than
 * clipping — and `size={NaN}` emitted `viewBox="0 0 NaN NaN"`.
 */
export function resolveSize(size: number): number {
  return isFiniteValue(size) ? Math.max(1, Math.round(size)) : DEFAULT_SIZE;
}

export function breathingDotGeometry(opts: {
  value: number | null;
  size: number;
  thresholds: readonly [number, number];
  pad: number;
}): BreathingDotGeometry {
  const size = resolveSize(opts.size);
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const rCore = round2(size * 0.16);
  // The ring may never travel inside the core: at a box small enough that the
  // PAD inset eats the whole radius, `rCore + level * (rMax - rCore)` went
  // negative, and a negative `r` drops the circle from the render entirely.
  const rMax = Math.max(rCore, size / 2 - opts.pad);

  const unknown = !isFiniteValue(opts.value);
  const level = unknown ? NaN : clamp(opts.value as number, 0, 1);

  const band: 0 | 1 | 2 = unknown ? 0 : loadBand(level, resolveThresholds(opts.thresholds));

  const ringR = unknown ? rCore : round2(rCore + level * (rMax - rCore));

  return {
    core: { cx, cy, r: rCore },
    ring: { cx, cy, r: ringR },
    band,
    level,
    unknown,
    size,
  };
}
