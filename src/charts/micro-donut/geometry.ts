// MicroDonut: ≤ 4 category
// wedges + "Other" rollup, 2° gaps, 12-o'clock start. Each wedge is a STROKED
// open centerline at mid-radius (stroke-width = ring weight). not a filled
// annulus sector — the same mechanism as ProgressRing: a stroked arc's length
// is drawable, so the entrance builds the wheel wedge-by-wedge around the clock
// via stroke-dashoffset, and at rest the butt-capped band fills the same radial
// span [rInner, rOuter] a filled sector would, so the ring reads identically.
// The hole is mandatory: angle + arc-length double-encode where the pie's area
// read fails. 2-dp.
import { arcPath, TAU } from "../../core/arc.js";
import { normalizeShares } from "../../core/stack.js";
import { isFiniteValue, round2 } from "../../core/types.js";

/** Documented prop defaults. They live here, not in the two entries, because
 *  the static entry, the interactive entry and this geometry all resolve the
 *  same three scalars and must land on the same number — a NaN `size` painted
 *  nothing (arcPath rejects a non-finite radius) under a full accessible name. */
export const DONUT_SIZE = 24;
const DONUT_WEIGHT = 5;
export const DONUT_MAX_WEDGES = 4;

/** Box side: positive-finite, else the default. Also fixes the seat — a
 *  non-finite `size` reached `<Chart seat>` as `--mc-seat: NaN`. */
export function donutSize(size: number | undefined): number {
  return isFiniteValue(size) && size > 0 ? size : DONUT_SIZE;
}

/** Wedge cap: at least one whole wedge. The cap is a legibility CEILING, and a
 *  hostile value used to breach it — `0` reaches `slice(0, -1)`, which keeps
 *  every category but the last, so `maxWedges={0}` rendered five wedges. */
export function donutMaxWedges(n: number | undefined): number {
  return isFiniteValue(n) && n >= 1 ? Math.floor(n) : DONUT_MAX_WEDGES;
}

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
  weight?: number | undefined;
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
  const { shares, gapDeg = 2 } = opts;
  const size = donutSize(opts.size);
  const c = size / 2;
  const rOuter = c - 0.5;
  const y0 = round2(c - rOuter);
  const y1 = round2(c + rOuter);
  const asked = isFiniteValue(opts.weight) ? opts.weight : DONUT_WEIGHT;
  // Upper bound floored at 0: a `size` of 1 or 2 leaves no room for a band, and
  // a NEGATIVE stroke-width is an SVG error — the browser drops the whole
  // element rather than drawing a thin ring. 0 draws nothing, honestly.
  const weight = round2(Math.min(Math.max(asked, 1), Math.max(rOuter - 0.5, 0)));
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
