// MicroDonut geometry — pure, React-free. ≤ 4 category
// wedges + "Other" rollup, 2° gaps, 12-o'clock start. Each wedge is a STROKED
// open centerline at mid-radius (stroke-width = ring weight), not a filled
// annulus sector — the same mechanism as ProgressRing: a stroked arc's length
// is drawable, so the entrance builds the wheel wedge-by-wedge around the clock
// via stroke-dashoffset, and at rest the butt-capped band fills the same radial
// span [rInner, rOuter] a filled sector would, so the ring reads identically.
// The hole is mandatory: angle + arc-length double-encode where the pie's area
// read fails. 2-dp.
import { arcPath, TAU } from "../../core/arc.js";
import { normalizeShares } from "../../core/stack.js";
import { round2 } from "../../core/types.js";

export interface Wedge {
  /** Value arc — a stroked open centerline at mid-radius. */
  d: string;
  share: number;
  /** Start/end angle (radians from 12 o'clock, clockwise). */
  a0: number;
  a1: number;
  index: number;
}

export function microDonutGeometry(opts: {
  size: number;
  shares: readonly number[];
  weight: number;
  gapDeg?: number | undefined;
}): {
  wedges: Wedge[];
  weight: number;
  /** Top edge of the ring's plot box — the outer radius, not the viewBox edge.
   *  Butt-capped strokes at rMid reach exactly rOuter, so the band is the box. */
  y0: number;
  /** Bottom edge of the ring's plot box. */
  y1: number;
} {
  const { size, shares, gapDeg = 2 } = opts;
  const c = size / 2;
  const rOuter = c - 0.5;
  const y0 = round2(c - rOuter);
  const y1 = round2(c + rOuter);
  const weight = round2(Math.min(Math.max(opts.weight, 1), rOuter - 0.5));
  const norm = normalizeShares(shares);
  if (!norm) return { wedges: [], weight, y0, y1 };

  const rInner = rOuter - weight;
  const rMid = round2((rOuter + rInner) / 2);
  const positive = norm.shares.filter((s) => s > 0);
  const gap = positive.length > 1 ? (gapDeg * Math.PI) / 180 : 0;
  const usable = TAU - gap * positive.length;

  const wedges: Wedge[] = [];
  let angle = 0;
  norm.shares.forEach((share, index) => {
    if (share <= 0) return;
    const a0 = angle;
    const a1 = angle + share * usable;
    wedges.push({
      d: arcPath(c, c, rMid, a0, a1),
      share: round2(share),
      a0: round2(a0),
      a1: round2(a1),
      index,
    });
    angle = a1 + gap;
  });
  return { wedges, weight, y0, y1 };
}
