// ProgressRing: Arc sweep from a
// FIXED 12-o'clock start, clockwise, butt caps. `sweep` renders remaining.
// Value arc = stroked centerline (drawable + accent CSS strokes paths).
import { annulusSector, arcPath, TAU } from "../../core/arc.js";
import { isFiniteValue, round2 } from "../../core/types.js";

/** Documented prop defaults. They live here, not in the two entries, because
 *  this geometry, the static entry and the interactive entry all resolve the
 *  same two scalars and have to land on the same number. */
export const RING_SIZE = 24;
const RING_WEIGHT = 3;

/** Box side: positive-finite, else the default. A non-finite `size` made
 *  `annulusSector`/`arcPath` reject every radius, so the ring painted NOTHING
 *  under a full accessible name ("50% complete."), and reached `<Chart seat>`
 *  as `--mc-seat: NaN`. */
export function ringSize(size: number | undefined): number {
  return isFiniteValue(size) && size > 0 ? size : RING_SIZE;
}

interface Radii {
  c: number;
  rOuter: number;
  rInner: number;
  weight: number;
}

/** The one place the band's radii are derived. */
function ringRadii(size: number | undefined, weight: number | undefined): Radii {
  const c = ringSize(size) / 2;
  const rOuter = c - 0.5;
  // Upper bound floored at 0. `size={1}` leaves no room for a band and the
  // clamp went NEGATIVE — a negative stroke-width is an SVG error, so the
  // browser dropped the value arc rather than drawing a thin one. A non-finite
  // `weight` took the same route through NaN, where `annulusSector` reads
  // rInner as 0 and paints the track as a solid disc: no hole, no value arc,
  // still announcing a percent.
  const w = Math.min(
    Math.max(isFiniteValue(weight) ? weight : RING_WEIGHT, 1),
    Math.max(rOuter - 0.5, 0),
  );
  return { c, rOuter, rInner: rOuter - w, weight: w };
}

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

/** Does a ring of this box and weight print `chars` glyphs in its hole? 0 = no.
 *  Exported so the interactive entry can ask whether the static entry actually
 *  painted the percent, not merely whether the caller asked for it. */
export function ringLabelSize(
  size: number | undefined,
  weight: number | undefined,
  chars: number,
): number {
  return ringLabelFont(ringRadii(size, weight).rInner, chars);
}

export function ringGeometry(opts: {
  size?: number | undefined;
  fraction: number;
  weight?: number | undefined;
  sweep: boolean;
  labelChars?: number;
}): RingGeometry {
  const { sweep } = opts;
  const { c, rOuter, rInner, weight } = ringRadii(opts.size, opts.weight);
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
