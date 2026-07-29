// PictogramRow: N constant-size
// units on one row; unit size NEVER scales with value (the classic pictogram
// lie). A fractional last unit is a circular-segment / partial-rect PATH — not
// a <clipPath>, which would need a generated id (canon: static components
// never generate ids). Coords 2-dp.
import { chartSide, round2 } from "../../core/types.js";

/** Drawn-unit ceiling. One unit is one DOM node, and `total` is unbounded
 *  caller data — see the saturation note in `pictogramGeometry`. */
const PICTOGRAM_MAX_UNITS = 200;

/** The documented box. Exported so this geometry, the static entry and the
 *  client entry all resolve a hostile `width`/`height` to the SAME fallback —
 *  `<Chart>` clamps the frame on its own, and a second, different fallback here
 *  would frame the row at one scale and lay it out at another. */
export const DEFAULT_WIDTH = 60;
export const DEFAULT_HEIGHT = 12;

export interface PictogramUnit {
  cx: number;
  cy: number;
  /** Unit radius (dot) or half-edge (square). */
  r: number;
  /**
   * Radius / half-edge of the HOLLOW unit's ring, inset by a hairline so the
   * stroke sits inside the unit rather than straddling its edge. Clamped: on a
   * sub-pixel unit the inset is wider than the unit, and `r - 0.3` went negative
   * — an SVG error, so the empty units silently dropped while the filled ones
   * still painted, and the row read as full.
   */
  ringR: number;
  /** 0 = empty, 1 = filled, else the true fraction. */
  fill: number;
  /** Present when 0 < fill < 1 — the partial-fill path (left-anchored). */
  partial?: string;
  index: number;
}

export interface PictogramGeometry {
  units: PictogramUnit[];
  /** Top of the unit band. Unit size is constant, so this frame is fixed by
   *  `width`/`height`/`total` alone — the fill fraction never moves it. */
  y0: number;
  /** Bottom of the unit band. */
  y1: number;
}

/** Left part of a circle cut by a vertical chord at fraction `f` of its width. */
function circleSegment(cx: number, cy: number, r: number, f: number): string {
  const dx = (f * 2 - 1) * r; // chord x-offset from center
  const half = Math.sqrt(Math.max(0, r * r - dx * dx));
  const x = round2(cx + dx);
  const y0 = round2(cy - half);
  const y1 = round2(cy + half);
  const largeArc = f > 0.5 ? 1 : 0;
  // top chord point → counterclockwise (sweep 0, through the leftmost point) → bottom, close by chord
  return `M${x} ${y0}A${round2(r)} ${round2(r)} 0 ${largeArc} 0 ${x} ${y1}Z`;
}

/** Left part of a square cut at fraction `f` of its width. */
function squareSegment(cx: number, cy: number, r: number, f: number): string {
  const x0 = round2(cx - r);
  const x1 = round2(cx - r + f * 2 * r);
  const y0 = round2(cy - r);
  const y1 = round2(cy + r);
  return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
}

export function pictogramGeometry(opts: {
  width: number;
  height: number;
  value: number;
  total: number;
  shape: "dot" | "square";
  /** "clip" keeps the true partial unit; "round" snaps to whole units. */
  fractional: "clip" | "round";
}): PictogramGeometry {
  const { shape, fractional } = opts;
  // A non-finite box is fatal in a way a bad mark is not: `<Chart>` clamps the
  // viewBox but this ran on the raw prop, so `width={NaN}` emitted a frame of 1
  // full of `cx="NaN"` units, and `width={Infinity}` emitted `cx="Infinity"`.
  // Same function as the wrapper's, so the frame and the layout stay in step.
  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);
  // `total` is caller data with no upper bound in the type, and one unit is one
  // DOM node: an accidental `total={3e6}` (a raw count where a share was meant)
  // exhausts memory, and `1e21` throws `Invalid array length`. Saturate like
  // TallyMarks does — a row this dense stopped being countable at ~20 anyway,
  // and the accessible summary still reports the true numbers.
  const total = Number.isFinite(opts.total)
    ? Math.min(PICTOGRAM_MAX_UNITS, Math.max(0, Math.floor(opts.total)))
    : 0;
  // No units to draw: collapse the band to the box mid-line so a seated empty
  // chart still centres where a drawn one would.
  if (total <= 0) {
    const mid = round2(height / 2);
    return { units: [], y0: mid, y1: mid };
  }

  const raw = Number.isFinite(opts.value) ? opts.value : 0;
  const value = fractional === "round" ? Math.round(raw) : raw;

  // A FIXED inter-unit gap outgrows the row once the units get dense: at the
  // default 60-unit width the gaps alone swallowed the box at total ≥ 41, so
  // `size` went NEGATIVE and every unit rendered with r < 0 — an SVG error, i.e.
  // a blank chart that still announced a count, with unit centres outside the
  // viewBox. Cap the gap at half the per-unit pitch: exactly a no-op for every
  // countable row (≤ 20 units in the documented box), and a denser or narrower
  // one degrades to units that touch rather than to nothing at all.
  const gap = Math.min(shape === "square" ? 1 : 1.5, width / total / 2);
  const size = Math.min(height, (width - gap * (total - 1)) / total);
  const r = round2((size / 2) * (shape === "dot" ? 0.92 : 0.9)); // breathing room
  const ringR = round2(Math.max(0, r - 0.3));
  const step = (width - size) / Math.max(1, total - 1);
  const cy = round2(height / 2);

  const units: PictogramUnit[] = Array.from({ length: total }, (_, i) => {
    const cx = round2(size / 2 + (total === 1 ? 0 : i * step));
    const f = Math.min(1, Math.max(0, value - i));
    const fill = round2(f);
    const unit: PictogramUnit = { cx, cy, r, ringR, fill, index: i };
    if (fill > 0 && fill < 1) {
      unit.partial =
        shape === "dot" ? circleSegment(cx, cy, r, fill) : squareSegment(cx, cy, r, fill);
    }
    return unit;
  });

  return { units, y0: round2(cy - r), y1: round2(cy + r) };
}
