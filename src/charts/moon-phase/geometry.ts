// MoonPhase: The lit
// AREA equals the value exactly (not the phase-angle approximation, which
// under-lights mid-cycle). Closed form: the terminator is a semi-ellipse with
// rx = r·|2f−1|; lit area = right semicircle ± semi-ellipse = f·πr² exactly.
// Waxing lights from the right. All coords 2-dp.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export type MoonMode = "progress" | "cycle";

export interface MoonGeometry {
  disc: { cx: number; cy: number; r: number };
  /** Lit-region path ("" when dark, full circle when full). */
  litPath: string;
  /** Illuminated fraction (0–1) actually drawn. */
  litFraction: number;
  /** The resolved box every coordinate above derives from — use it, not the prop. */
  size: number;
}

/** Default box, in viewBox units — the `size` prop's default and its fallback. */
export const DEFAULT_SIZE = 16;

/**
 * Glyph box, resolved once. `size` reaches a chart from a host as often as a
 * literal — a CSS var read back, a collapsed flex measurement, an empty numeric
 * input (`Number("")` → NaN) — and every coordinate here derives from it:
 * `size={NaN}` drew a NaN disc and a NaN terminator inside `viewBox="0 0 1 1"`
 * (the wrapper's own clamp) with a `--mc-seat` of NaN, and any `size < 1` gave
 * the two discs a NEGATIVE `r`, an SVG error that drops them, while `size={-20}`
 * put what survived at cx=-10 — outside the box, and `.mc-root` is
 * `overflow: visible`, so that paints on the page. The accessible name read
 * normally through all of it.
 */
export function resolveSize(size: number): number {
  return isFiniteValue(size) ? Math.max(1, Math.round(size)) : DEFAULT_SIZE;
}

/** Lit path for illumination `f` (0–1). `litLeft` mirrors it (waning). */
function litPathFor(cx: number, cy: number, r: number, f: number, litLeft: boolean): string {
  if (f <= 0.005) return "";
  if (f >= 0.995) {
    // full disc, drawn as two half-arcs (single closed path)
    return `M${cx} ${round2(cy - r)}A${r} ${r} 0 0 1 ${cx} ${round2(cy + r)}A${r} ${r} 0 0 1 ${cx} ${round2(cy - r)}Z`;
  }
  const rx = round2(r * Math.abs(2 * f - 1));
  const top = round2(cy - r);
  const bot = round2(cy + r);
  // outer semicircle sweep: right side for waxing, left for waning
  const outerSweep = litLeft ? 0 : 1;
  // terminator bulges toward the dark side when gibbous (f>0.5)
  const gibbous = f > 0.5;
  const termSweep = litLeft ? (gibbous ? 0 : 1) : gibbous ? 1 : 0;
  return (
    `M${cx} ${top}` +
    `A${r} ${r} 0 0 ${outerSweep} ${cx} ${bot}` +
    `A${rx} ${r} 0 0 ${termSweep} ${cx} ${top}Z`
  );
}

export function moonGeometry(opts: {
  value: number;
  mode: MoonMode;
  size: number;
  pad: number;
}): MoonGeometry {
  const { value, mode, pad } = opts;
  const size = resolveSize(opts.size);
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 1);
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  // Never negative once `size` is resolved (the floor is 1, and PAD is 0.5) — a
  // negative `r` is an SVG error that drops the disc entirely.
  const r = round2(size / 2 - pad);

  let f: number;
  let litLeft: boolean;
  if (mode === "cycle") {
    // 0 = new → 0.5 = full → 1 = new; waxing then waning
    if (v <= 0.5) {
      f = v * 2;
      litLeft = false;
    } else {
      f = (1 - v) * 2;
      litLeft = true;
    }
  } else {
    f = v; // progress: monotonic illumination, waxing
    litLeft = false;
  }

  return {
    disc: { cx, cy, r },
    litPath: litPathFor(cx, cy, r, f, litLeft),
    litFraction: round2(f),
    size,
  };
}
