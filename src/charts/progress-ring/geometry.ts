// ProgressRing geometry — pure, React-free (plan/22 #17, S3). Arc sweep from a
// FIXED 12-o'clock start, clockwise, butt caps — the two quiet ways rings
// inflate progress, both removed. `sweep` mode renders the REMAINING fraction
// as a shrinking filled sector (countdown semantics). 2-dp via core/arc.
import { annulusSector, sector, TAU } from "../../core/arc.js";
import { round2 } from "../../core/types.js";

export interface RingGeometry {
  /** Full annulus track. */
  track: string;
  /** Value arc (annulus sector) or remaining sector (sweep mode). */
  arc: string;
  labelX: number;
  labelY: number;
  /** Center font size in viewBox units. */
  fontSize: number;
}

export function ringGeometry(opts: {
  size: number;
  fraction: number;
  weight: number;
  sweep: boolean;
}): RingGeometry {
  const { size, sweep } = opts;
  const c = size / 2;
  const rOuter = c - 0.5;
  const weight = Math.min(Math.max(opts.weight, 1), rOuter - 0.5);
  const rInner = rOuter - weight;
  const f = Math.min(1, Math.max(0, opts.fraction));

  const track = annulusSector(c, c, rOuter, rInner, 0, TAU);
  let arc = "";
  if (sweep) {
    // countdown: the REMAINING fraction as a filled wedge that shrinks
    const remaining = 1 - f;
    if (remaining > 0)
      arc = sector(c, c, rInner - 0.5 > 0 ? rInner - 0.5 : rOuter, 0, remaining * TAU);
  } else if (f > 0) {
    arc = annulusSector(c, c, rOuter, rInner, 0, f * TAU);
  }

  const fontSize = Math.max(5, Math.round(rInner * 0.9));
  return {
    track,
    arc,
    labelX: round2(c),
    labelY: round2(c + fontSize * 0.35),
    fontSize,
  };
}
