// TallyMarks geometry — pure, React-free (plan/24 #1, S4). Counts the way a
// human counts: four verticals struck through by a fifth per cluster of five,
// then the remainder. Every stroke lands in ONE path (node budget 2 with the
// overflow numeral). The `drawn` pen perturbs stroke RENDERING only via seeded
// jitter (core/jitter) — deterministic, SSR-stable, never Math.random; the
// count is never touched. All coords 2-dp.
import { round2 } from "../../core/types.js";

// Minimal mulberry32 stream, seeded straight from the integer count — inlined
// (not core/jitter) to keep the static entry under the Delta-class 1.5 kB cap
// while staying byte-identical across server, hydration, and visual-test runs.
function seededFrom(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TallyPen = "ruled" | "drawn";
export type TallyOverflow = "numeral" | "clamp";

export interface TallyGeometry {
  /** Every stroke (verticals + strikes) merged into one path. */
  d: string;
  /** Integer viewBox width the strokes + numeral gutter need. */
  width: number;
  /** Marks actually drawn (≤ total). */
  drawn: number;
  /** Count beyond `total` not drawn as marks (numeral carries it). */
  overflow: number;
  /** x for the `+N` numeral (text-anchor start), or null when none. */
  numeralX: number | null;
}

// Saturate drawn marks at a legible bound. `total` is a caller prop; a
// non-physical value (e.g. 1e15, with a matching value) would otherwise loop
// unbounded — trillions of stroke segments (OOM) running off the growing
// viewBox. The overflow numeral carries the remainder, so the summary stays
// truthful; only the drawn marks saturate.
export const TALLY_MAX_MARKS = 200;

const STROKE_GAP = 3; // horizontal gap between verticals within a cluster
const CLUSTER_GAP = 5; // gap between clusters (clears the diagonal strike)
const VERT_SPAN = 3 * STROKE_GAP; // span of a full cluster's 4 verticals
const OVERHANG = 1; // how far the strike pokes past the outer verticals

export function tallyGeometry(opts: {
  value: number;
  /** Discrete-count denominator (plan/04 §8 — renamed from `max`). */
  total: number;
  height: number;
  pad: number;
  pen: TallyPen;
  overflow: TallyOverflow;
  /** viewBox font size of the overflow numeral (gutter reservation). */
  fontSize: number;
}): TallyGeometry {
  const { value, total, height, pad, pen, overflow, fontSize } = opts;
  // count is floored + never negative; the summary always carries the truth.
  const count = Math.max(0, Math.floor(isFinite(value) ? value : 0));
  const cap = Math.min(Math.max(0, Math.floor(total)), TALLY_MAX_MARKS);
  const drawn = Math.min(count, cap);
  const overflowCount = count - drawn;

  // seeded stream for the drawn pen — seed from the count so identical inputs
  // render identically on server, client, and visual-test runs.
  const rand = pen === "drawn" ? seededFrom(count + 1) : null;
  const jx = (): number => (rand ? round2((rand() * 2 - 1) * 0.3) : 0);

  const yTop = pad;
  const yBot = round2(height - pad);
  const segs: string[] = [];
  let cursor = pad;
  let remaining = drawn;
  let maxX = pad;

  while (remaining > 0) {
    const inThis = Math.min(5, remaining);
    const full = inThis === 5;
    const nVert = full ? 4 : inThis;
    for (let i = 0; i < nVert; i++) {
      const x = cursor + i * STROKE_GAP;
      segs.push(`M${round2(x + jx())} ${yTop}L${round2(x + jx())} ${yBot}`);
      maxX = Math.max(maxX, x);
    }
    if (full) {
      // strike: bottom-left → top-right across the four verticals
      const x1 = cursor - OVERHANG;
      const x2 = cursor + VERT_SPAN + OVERHANG;
      segs.push(`M${round2(x1 + jx())} ${yBot}L${round2(x2 + jx())} ${yTop}`);
      maxX = Math.max(maxX, x2);
    }
    const span = full ? VERT_SPAN : (nVert - 1) * STROKE_GAP;
    cursor += span + CLUSTER_GAP;
    remaining -= inThis;
  }

  const showNumeral = overflow === "numeral" && overflowCount > 0;
  const glyphs = showNumeral ? `+${overflowCount}`.length : 0;
  const gutter = glyphs * 0.62 * fontSize;
  const numeralX = showNumeral ? round2(maxX + STROKE_GAP) : null;
  const rightEdge = showNumeral ? (numeralX ?? 0) + gutter : maxX;
  const width = Math.max(1, Math.ceil(rightEdge + pad));

  return { d: segs.join(""), width, drawn, overflow: overflowCount, numeralX };
}
