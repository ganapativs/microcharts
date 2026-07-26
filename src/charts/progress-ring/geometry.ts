// ProgressRing: Arc sweep from a
// FIXED 12-o'clock start, clockwise, butt caps. `sweep` renders remaining.
// Value arc = stroked centerline (drawable + accent CSS strokes paths).
import { annulusSector, arcPath, TAU } from "../../core/arc.js";
import { round2 } from "../../core/types.js";

export interface RingGeometry {
  track: string;
  arc: string;
  weight: number;
  labelX: number;
  labelY: number;
  /** 0 = label cannot seat inside the hole without touching the ring. */
  fontSize: number;
  y0: number;
  y1: number;
}

/** Font for a centered percent: ≥1 unit air from the inner ring, sized for
 *  up to 3-digit values (`100%`/`999%` = 4 glyphs). 0 when it won't fit. */
export function ringLabelFont(rInner: number, chars: number): number {
  if (chars <= 0) return 0;
  const hole = 2 * (rInner - 1);
  if (hole < 5) return 0;
  const n = Math.max(chars, 4);
  const fs = Math.floor(Math.min(hole / (n * 0.62), hole, Math.max(5, Math.round(rInner * 0.9))));
  return fs >= 5 && (n * fs * 0.62) / 2 <= rInner - 1 && fs / 2 <= rInner - 1 ? fs : 0;
}

export function ringGeometry(opts: {
  size: number;
  fraction: number;
  weight: number;
  sweep: boolean;
  labelChars?: number;
}): RingGeometry {
  const { size, sweep } = opts;
  const c = size / 2;
  const rOuter = c - 0.5;
  const weight = Math.min(Math.max(opts.weight, 1), rOuter - 0.5);
  const rInner = rOuter - weight;
  const rMid = round2((rOuter + rInner) / 2);
  const f = Math.min(1, Math.max(0, opts.fraction));
  const shown = sweep ? 1 - f : f;
  const chars = opts.labelChars ?? 0;

  return {
    track: annulusSector(c, c, rOuter, rInner, 0, TAU),
    arc: shown > 0 ? arcPath(c, c, rMid, 0, shown * TAU) : "",
    weight: round2(weight),
    labelX: round2(c),
    labelY: round2(c),
    fontSize: chars > 0 ? ringLabelFont(rInner, chars) : Math.max(5, Math.round(rInner * 0.9)),
    y0: round2(c - rOuter),
    y1: round2(c + rOuter),
  };
}
