// TreeRings geometry — pure, React-free. The channel
// is radial ring THICKNESS (spacing between consecutive boundaries) ∝ per-period
// value — oldest at the centre, newest outermost. NOT area: equal thickness at a
// larger radius spans more area (the ring illusion), so the docs say "compare
// thicknesses". Never a minimum visual thickness — a near-zero period looks
// near-zero. `total` scales the disc to Σdata/total of the radius. All coords 2-dp.
import { isFiniteValue, round2 } from "../../core/types.js";

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
 * can be merged into one path (SSR hot path: one node, not N — brief §per-chart 4). */
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
  const { values, size, pad, total } = opts;
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const r0 = round2(Math.max(1, size * 0.06)); // small centre
  const maxR = round2(size / 2 - pad);
  const span = maxR - r0;

  const clean = values.map((v) => (isFiniteValue(v) && v >= 0 ? v : 0));
  const sum = clean.reduce((a, b) => a + b, 0);
  const denom = total && total > 0 ? total : sum > 0 ? sum : 1;

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
