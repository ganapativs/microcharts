// MicroDonut geometry — pure, React-free (plan/22 #18, S3). ≤ 4 annulus
// sectors + "Other" rollup, 2° gaps, 12-o'clock start. The hole is mandatory:
// angle + arc-length double-encode where the pie's area read fails. 2-dp.
import { annulusSector, TAU } from "../../core/arc.js";
import { normalizeShares } from "../../core/stack.js";
import { round2 } from "../../core/types.js";

export interface Wedge {
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
}): { wedges: Wedge[] } {
  const { size, shares, weight, gapDeg = 2 } = opts;
  const norm = normalizeShares(shares);
  if (!norm) return { wedges: [] };

  const c = size / 2;
  const rOuter = c - 0.5;
  const rInner = Math.max(1, rOuter - Math.min(weight, rOuter - 1));
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
      d: annulusSector(c, c, rOuter, rInner, a0, a1),
      share: round2(share),
      a0: round2(a0),
      a1: round2(a1),
      index,
    });
    angle = a1 + gap;
  });
  return { wedges };
}
