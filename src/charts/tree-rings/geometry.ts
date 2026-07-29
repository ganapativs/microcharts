// TreeRings: The channel
// is radial ring THICKNESS (spacing between consecutive boundaries) ∝ per-period
// value — oldest at the centre, newest outermost. NOT area: equal thickness at a
// larger radius spans more area (the ring illusion). so the docs say "compare
// thicknesses". Never a minimum visual thickness — a near-zero period looks
// near-zero. `total` scales the disc to Σdata/total of the radius. All coords 2-dp.
import { chartSide, isFiniteValue, round2 } from "../../core/types.js";

/** Documented default `size`, and the fallback for an unusable one. Lives here
 *  because this geometry, the static entry and the interactive entry all
 *  resolve the same scalar and have to land on the same number. */
export const TREE_SIZE = 24;

/** Ring of empty box the disc is inset by. Exported so the interactive entry
 *  cannot drift from the paint. */
export const TREE_PAD = 1;

/**
 * The disc's box, resolved once. `size` is a caller prop, and a non-finite one
 * is uniquely destructive (see `chartSide`): every radius went NaN, so the disc
 * emitted `cx="NaN"` and reached `<Chart seat>` as `--mc-seat: NaN`, inside a
 * viewBox `Chart` had already clamped to 1×1 — under a correct-sounding
 * accessible name. Rounded because the viewBox carries integers.
 */
export function treeRingsSize(size: number | undefined): number {
  return Math.max(1, Math.round(chartSide(size ?? TREE_SIZE, TREE_SIZE)));
}

interface TreeRing {
  rInner: number;
  rOuter: number;
  value: number;
  index: number;
}

export interface TreeRingsGeometry {
  rings: TreeRing[];
  center: { cx: number; cy: number };
  r0: number;
  maxR: number;
}

/** A full circle as two half-arcs, 2-dp — exported so multiple ring outlines
 * can be merged into one path (SSR hot path: one node, not N). */
export function ringOutline(cx: number, cy: number, r: number): string {
  const l = round2(cx - r);
  const rt = round2(cx + r);
  const rr = round2(r);
  return `M${l} ${cy}A${rr} ${rr} 0 1 0 ${rt} ${cy}A${rr} ${rr} 0 1 0 ${l} ${cy}Z`;
}

/** Full annulus (outer + inner ring); render with fill-rule evenodd. Inlined
 *  (not core/arc) and built only for the fill variant to keep the static lean. */
export function ringAnnulus(cx: number, cy: number, rOuter: number, rInner: number): string {
  return `${ringOutline(cx, cy, rOuter)}${ringOutline(cx, cy, rInner)}`;
}

export function treeRingsGeometry(opts: {
  values: readonly number[];
  size: number;
  pad: number;
  total?: number | undefined;
}): TreeRingsGeometry {
  const { values, pad, total } = opts;
  const size = treeRingsSize(opts.size);
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const r0 = round2(Math.max(1, size * 0.06)); // small centre
  // Below ~size 4 the pad eats the whole radius, and `maxR < r0` ran the span
  // NEGATIVE: rings marched INWARD, past the centre and out the far side of the
  // box. Floored at r0 instead, so the span is 0 and a disc too small to hold
  // rings paints just the centre dot — which still fits, since its radius is
  // half of r0.
  const maxR = round2(Math.max(r0, size / 2 - pad));
  const span = maxR - r0;

  const clean = values.map((v) => (isFiniteValue(v) && v >= 0 ? v : 0));
  const sum = clean.reduce((a, b) => a + b, 0);
  // `total` is a caller-computed scalar. An INFINITE one passed `total > 0`,
  // drove every thickness to zero, and left the disc blank while the summary
  // still announced eight periods — announced scale ≠ painted scale.
  const denom = isFiniteValue(total) && total > 0 ? total : sum > 0 ? sum : 1;

  const rings: TreeRing[] = [];
  let rInner = r0;
  clean.forEach((v, i) => {
    const thickness = (v / denom) * span;
    const rOuter = round2(Math.min(rInner + thickness, maxR));
    rings.push({ rInner: round2(rInner), rOuter, value: v, index: i });
    rInner = rOuter;
  });

  return { rings, center: { cx, cy }, r0, maxR };
}
