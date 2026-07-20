// MoonPhase geometry — pure, React-free. The lit
// AREA equals the value exactly (not the phase-angle approximation, which
// under-lights mid-cycle). Closed form: the terminator is a semi-ellipse with
// rx = r·|2f−1|; lit area = right semicircle ± semi-ellipse = f·πr² exactly.
// Waxing lights from the right. All coords 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export type MoonMode = "progress" | "cycle";

export interface MoonGeometry {
  disc: { cx: number; cy: number; r: number };
  /** Lit-region path ("" when dark, full circle when full). */
  litPath: string;
  /** Illuminated fraction (0–1) actually drawn. */
  litFraction: number;
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
  const { value, mode, size, pad } = opts;
  const v = clamp(Number.isFinite(value) ? value : 0, 0, 1);
  const cx = round2(size / 2);
  const cy = round2(size / 2);
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
  };
}
