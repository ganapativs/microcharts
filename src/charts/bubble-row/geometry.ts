// BubbleRow: The catalog's honesty
// exemplar: r ∝ √value with NO exceptions (a linear-radius map would be a ~squared
// lie). and NO sorting (order = data order — reordering is the caller's statement).
// Area comparison is the weakest common channel — precision is LOW and the docs
// carry the standing "for precise comparison, use MiniBar" steer. All coords 2-dp.
import { round2 } from "../../core/types.js";
import { maxOf } from "../../core/scale.js";
import { labelFitsY, labelFont } from "../../core/labels.js";

export type BubbleAlign = "center" | "baseline";

/** Row padding, viewBox units. Shared so the two entries lay out the same box. */
export const PAD = 1;

/**
 * A magnitude the area channel can carry: finite and non-negative. A circle has
 * no way to say "minus", so geometry answers a negative with the same presence
 * ring it gives a null — and the numeral, the summary and the spoken readout
 * have to agree with it. They did not: a row of negatives painted "-5" and "-2"
 * under two dots meaning "nothing measurable" while its accessible name read
 * "No data."
 */
export function isBubbleValue(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/**
 * One caller-supplied layout scalar. A `NaN`/`±Infinity` `height`, `gap` or
 * `fontSize` reached every coordinate the chart emits — `viewBox` included — so
 * the row rendered nothing at all while its summary still read correctly. A
 * value below `min` is refused for the same reason: a negative `gap` marched the
 * row leftwards past x=0, and `.mc-root` is `overflow: visible`, so that spills
 * onto the page instead of clipping.
 */
function dim(v: number | undefined, fallback: number, min: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= min ? v : fallback;
}

export interface BubbleLayout {
  height: number;
  gap: number;
  fontSize: number;
  /** Room reserved under the bubbles for numerals; 0 when none render. */
  band: number;
  /** Text baseline for the numerals. */
  labelY: number;
  /** Per-character width estimate for a numeral's slot; 0 when none render. */
  charW: number;
}

/**
 * Resolves every layout scalar the static and interactive entries share. Both
 * compute geometry independently (the interactive one composes the static), so
 * one source is what keeps the overlay ring on its bubble.
 */
export function bubbleLayout(opts: {
  height?: number | undefined;
  gap?: number | undefined;
  fontSize?: number | undefined;
  label: "value" | "both" | "none";
}): BubbleLayout {
  const height = dim(opts.height, 30, 0);
  const gap = dim(opts.gap, 2, 0);
  // Numerals scale with height (floor 7) so they read at the library norm — a
  // fixed size looked ~40 % smaller than every other chart's labels.
  const fontSize = dim(opts.fontSize, labelFont(height, 0.34), 0);
  const labelY = round2(height - PAD - fontSize * 0.32);
  // Alphabetic baseline, so `mid: false`. A numeral the box can no longer seat
  // is DROPPED, never shrunk or painted past the edge — the library's
  // degradation rule (core/labels.ts).
  const show = opts.label !== "none" && labelFitsY(labelY, fontSize, height, false);
  return {
    height,
    gap,
    fontSize,
    band: show ? fontSize + 2 : 0,
    labelY,
    // 0.72 em/char covers the tabular figures this chart formats itself. `both`
    // prepends CALLER text, whose measured worst case is 0.95 (see
    // `textGutterProse`) — at 0.72 an all-caps row name paints past the viewBox.
    charW: show ? (opts.label === "both" ? 0.95 : 0.72) : 0,
  };
}

export interface BubbleRowGeometry {
  bubbles: { cx: number; cy: number; r: number; value: number | null; index: number }[];
  width: number;
  height: number;
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
  const finite = values.filter(isBubbleValue);
  const max = finite.length ? maxOf(finite) : 0;
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
    const valid = isBubbleValue(v);
    const r = !valid ? minR : max <= 0 ? minR : round2(Math.max(minR, rMax * Math.sqrt(v / max)));
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
    return { cx: round2(cursor), cy, r, value: valid ? v : null, index: i };
  });

  // right edge = the farthest of any bubble rim or numeral half-width.
  let rightEdge = 0;
  bubbles.forEach((b, i) => {
    rightEdge = Math.max(rightEdge, b.cx + Math.max(b.r, (labelWidths?.[i] ?? 0) / 2));
  });
  const width = Math.max(1, Math.ceil(rightEdge + pad));
  return {
    bubbles,
    width,
    height,
    y0: round2(bandTop),
    y1: round2(bandTop + bandH),
  };
}
