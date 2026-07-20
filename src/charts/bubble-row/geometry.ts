// BubbleRow geometry — pure, React-free. The catalog's honesty
// exemplar: r ∝ √value with NO exceptions (a linear-radius map would be a ~squared
// lie), and NO sorting (order = data order — reordering is the caller's statement).
// Area comparison is the weakest common channel — precision is LOW and the docs
// carry the standing "for precise comparison, use MiniBar" steer. All coords 2-dp.
import { round2 } from "../../core/types.js";

export type BubbleAlign = "center" | "baseline";

export interface BubbleRowGeometry {
  bubbles: { cx: number; cy: number; r: number; value: number | null; index: number }[];
  width: number;
  height: number;
  /** y where value/label numerals sit (below the bubbles). */
  labelY: number;
  /** Top of the bubble band — the frame the circles are laid out in, above the
   *  numeral band. Deterministic (padding + label reservation), never the
   *  drawn radii, so an inline seat can't move with the data. */
  y0: number;
  /** Bottom of the bubble band: the shelf `align="baseline"` rests on. */
  y1: number;
}

export function bubbleRowGeometry(opts: {
  values: readonly (number | null)[];
  height: number;
  gap: number;
  align: BubbleAlign;
  pad: number;
  /** Reserve this much at the bottom for numerals. */
  labelBand: number;
  /** Estimated numeral width per bubble — bubbles are spread so the numbers
   *  (usually wider than a small bubble) never overlap. Omit → circle spacing only. */
  labelWidths?: readonly number[] | undefined;
}): BubbleRowGeometry {
  const { values, height, gap, align, pad, labelBand, labelWidths } = opts;
  const finite = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0,
  );
  const max = finite.length ? Math.max(...finite) : 0;
  const bandTop = pad;
  // Reserve a 2px gap between the bubble band and the numeral band so the largest
  // bubble's rim never touches its label's ascenders (a 1px kiss at max radius).
  const bandH = Math.max(2, height - pad * 2 - labelBand - 2);
  const rMax = round2(bandH / 2);
  const minR = 0.5; // zero → a small presence ring

  let cursor = pad;
  let prevR = 0;
  let prevHalfW = 0;
  const bubbles = values.map((v, i) => {
    const valid = typeof v === "number" && Number.isFinite(v) && v >= 0;
    const r = !valid
      ? minR
      : max <= 0
        ? minR
        : round2(Math.max(minR, rMax * Math.sqrt((v as number) / max)));
    const halfW = (labelWidths?.[i] ?? 0) / 2;
    if (i === 0) {
      cursor += Math.max(r, halfW);
    } else {
      // center pitch = the larger of circle-edge spacing and numeral-edge spacing,
      // so wide numbers under small bubbles still read without dropping out.
      cursor += Math.max(prevR + gap + r, prevHalfW + gap + halfW);
    }
    prevR = r;
    prevHalfW = halfW;
    const cy = align === "baseline" ? round2(bandTop + bandH - r) : round2(bandTop + bandH / 2);
    return { cx: round2(cursor), cy, r, value: valid ? (v as number) : null, index: i };
  });

  // right edge = the farthest of any bubble rim or numeral half-width.
  let rightEdge = 0;
  bubbles.forEach((b, i) => {
    rightEdge = Math.max(rightEdge, b.cx + Math.max(b.r, (labelWidths?.[i] ?? 0) / 2));
  });
  const width = Math.max(1, Math.ceil(rightEdge + pad));
  const labelY = round2(height - pad);
  return {
    bubbles,
    width,
    height,
    labelY,
    y0: round2(bandTop),
    y1: round2(bandTop + bandH),
  };
}
