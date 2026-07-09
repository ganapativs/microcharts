// BubbleRow geometry — pure, React-free (plan/24 #11, S2). The catalog's honesty
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
}

export function bubbleRowGeometry(opts: {
  values: readonly (number | null)[];
  height: number;
  gap: number;
  align: BubbleAlign;
  pad: number;
  /** Reserve this much at the bottom for numerals. */
  labelBand: number;
}): BubbleRowGeometry {
  const { values, height, gap, align, pad, labelBand } = opts;
  const finite = values.filter(
    (v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0,
  );
  const max = finite.length ? Math.max(...finite) : 0;
  const bandTop = pad;
  const bandH = Math.max(2, height - pad * 2 - labelBand);
  const rMax = round2(bandH / 2);
  const minR = 0.5; // zero → a small presence ring

  let cursor = pad;
  let prevR = 0;
  const bubbles = values.map((v, i) => {
    const valid = typeof v === "number" && Number.isFinite(v) && v >= 0;
    const r = !valid
      ? minR
      : max <= 0
        ? minR
        : round2(Math.max(minR, rMax * Math.sqrt((v as number) / max)));
    cursor += i === 0 ? r : prevR + gap + r;
    prevR = r;
    const cy = align === "baseline" ? round2(bandTop + bandH - r) : round2(bandTop + bandH / 2);
    return { cx: round2(cursor), cy, r, value: valid ? (v as number) : null, index: i };
  });

  const last = bubbles[bubbles.length - 1];
  const width = Math.max(1, Math.ceil((last ? last.cx + last.r : 0) + pad));
  const labelY = round2(height - pad);
  return { bubbles, width, height, labelY };
}
