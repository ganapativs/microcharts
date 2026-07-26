// An ambient load read. The STATIC frame is a real chart: a core dot (colored by
// threshold band) plus a level ring whose distance from the core encodes the
// level. The interactive entry adds a pulse whose rate is the level (motion IS
// the encoding) — but the ring offset here carries the same information without
// motion. band: 0 calm / 1 elevated / 2 strained. All coords 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export interface BreathingDotGeometry {
  core: { cx: number; cy: number; r: number };
  ring: { cx: number; cy: number; r: number };
  band: 0 | 1 | 2;
  /** level ∈ [0,1], or NaN when the value is unknown. */
  level: number;
  unknown: boolean;
  size: number;
}

export function breathingDotGeometry(opts: {
  value: number | null;
  size: number;
  thresholds: readonly [number, number];
  pad: number;
}): BreathingDotGeometry {
  const { size, pad } = opts;
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const rCore = round2(size * 0.16);
  const rMax = size / 2 - pad;

  const unknown = !(typeof opts.value === "number" && Number.isFinite(opts.value));
  const level = unknown ? NaN : clamp(opts.value as number, 0, 1);

  const [lo, hi] = opts.thresholds;
  // Band assignment: < lower = calm, [lower, upper) = elevated, ≥ upper = strained.
  const band: 0 | 1 | 2 = unknown ? 0 : level < lo ? 0 : level < hi ? 1 : 2;

  const ringR = unknown ? rCore : round2(rCore + level * (rMax - rCore));

  return {
    core: { cx, cy, r: rCore },
    ring: { cx, cy, r: ringR },
    band,
    level,
    unknown,
    size: Math.max(1, Math.round(size)),
  };
}
