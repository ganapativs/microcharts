// SproutRow: Four discrete
// growth stages (seed → sprout → leaf → bloom) with glyph height STRICTLY
// MONOTONIC so the ordering reads untrained (taller = further along). No
// interpolated half-stages — a growth metaphor must not fake continuity. Each
// item is ONE path (stem stroked + leaves/head filled). All coords 2-dp.
import { round2 } from "../../core/types.js";

export interface SproutRowGeometry {
  slots: { x: number; baselineY: number; stage: number | null }[];
  soil: { x1: number; y1: number; x2: number; y2: number };
  step: number;
  width: number;
}

/** Stem-top height per stage as a fraction of the usable glyph height. */
const STEM_FRAC = [0, 0.5, 0.72, 0.84];

/** Half stem width — the glyph's minimum horizontal reach at every stage. */
const SW = 0.45;

/**
 * Leaf half-extent for a glyph of usable height `g`. The 1.4 floor keeps a leaf
 * visible at ordinary sizes, but it may not exceed the height the plant has to
 * grow in: a 4-unit row hit the floor with `g` near zero and painted its leaves
 * 2.3 units ABOVE the viewBox. Identical to the old `max(1.4, g·0.2)` for every
 * `g ≥ 1.4`, i.e. every row taller than ~6 units.
 */
function leafHalf(g: number): number {
  return Math.max(Math.min(1.4, g), g * 0.2);
}

/** Glyph path for a stage at (cx, baselineY) — one FILLED path (thin stem +
 *  leaves/head), scaled to the usable height `gh`. Height is strictly monotonic
 *  in stage, so taller always reads as further along. A `gh` a caller derived
 *  from a collapsed box can be negative; that flipped the glyph and emitted a
 *  negative arc radius, so it floors at 0 (no room, no plant). */
export function stageGlyph(stage: number, cx: number, by: number, gh: number): string {
  const r = round2;
  const g = Math.max(0, gh);
  const lw = leafHalf(g);
  if (stage <= 0) {
    // seed — a small dot near the soil
    const rs = round2(Math.min(1.5, g * 0.14));
    return `M${r(cx)} ${round2(by - rs)}a${rs} ${rs} 0 1 0 0.01 0Z`;
  }
  const top = round2(by - g * STEM_FRAC[Math.min(stage, 3)]!);
  const sw = SW; // half stem width
  let d = `M${r(cx - sw)} ${r(by)}L${r(cx - sw)} ${top}L${r(cx + sw)} ${top}L${r(cx + sw)} ${r(by)}Z`;
  // right leaf (sprout, leaf, bloom)
  const rly = round2(by - g * 0.28);
  d += `M${r(cx)} ${rly}Q${round2(cx + lw)} ${round2(rly - lw * 0.5)} ${round2(cx + lw * 0.66)} ${round2(rly - lw)}Q${round2(cx + lw * 0.16)} ${round2(rly - lw * 0.5)} ${r(cx)} ${rly}Z`;
  if (stage >= 2) {
    // left leaf, a touch higher
    const lly = round2(by - g * 0.46);
    d += `M${r(cx)} ${lly}Q${round2(cx - lw)} ${round2(lly - lw * 0.5)} ${round2(cx - lw * 0.66)} ${round2(lly - lw)}Q${round2(cx - lw * 0.16)} ${round2(lly - lw * 0.5)} ${r(cx)} ${lly}Z`;
  }
  if (stage >= 3) {
    // bloom — flower head at the stem top
    const rh = round2(Math.min(1.8, g * 0.14));
    d += `M${r(cx)} ${round2(top - rh)}a${rh} ${rh} 0 1 0 0.01 0Z`;
  }
  return d;
}

/** The painted extents of `stageGlyph` — what the glyph actually inks, not the
 *  slot band. A focus ring built from a fixed radius (the old `r=7` puck) sits
 *  concentric only at one height and one stage; built from this box it is
 *  concentric always. Mirrors the path above command-for-command: the leaf
 *  quadratics peak at 0.746·lw (max of `2t − 1.34t²`), and both `a` arcs draw a
 *  FULL circle centred on their anchor, so the seed straddles the soil and the
 *  bloom head straddles the stem top. */
export function stageGlyphBox(
  stage: number,
  cx: number,
  by: number,
  gh: number,
): { x0: number; y0: number; x1: number; y1: number } {
  const r = round2;
  const g = Math.max(0, gh);
  if (stage <= 0) {
    const rs = Math.min(1.5, g * 0.14);
    return { x0: r(cx - rs), y0: r(by - rs), x1: r(cx + rs), y1: r(by + rs) };
  }
  const s = Math.min(stage, 3);
  const lw = leafHalf(g);
  // Sideways reach of one leaf. Below `g ≈ 0.6` the leaf is narrower than the
  // stem, so the stem sets the edge — the ring is built from this box and must
  // never cut through the stalk.
  const leaf = Math.max(SW, 0.746 * lw);
  const head = s >= 3 ? Math.min(1.8, g * 0.14) : 0;
  return {
    // left leaf only from stage 2; before that the left edge is the bare stem
    x0: r(cx - (s >= 2 ? leaf : SW)),
    // whichever reaches higher: the bloom head above the stem top, or the
    // topmost leaf (left leaf from stage 2, else the right one). A leaf's
    // quadratics run linearly in y, so it peaks exactly `lw` above its anchor.
    y0: r(Math.min(by - g * STEM_FRAC[s]! - head, by - g * (s >= 2 ? 0.46 : 0.28) - lw)),
    x1: r(cx + leaf),
    // the stem foot sits on the soil; nothing in stages 1–3 paints below it
    y1: r(by),
  };
}

export function sproutRowGeometry(opts: {
  stages: readonly (number | null)[];
  height: number;
  step: number;
  pad: number;
  /** Horizontal side gutter so outer labels never clip (defaults to `pad`). */
  padX?: number;
  /** Space reserved below the soil for category labels. */
  bottomReserve?: number;
}): SproutRowGeometry {
  const { stages, height, step, pad, padX = pad, bottomReserve = 0 } = opts;
  const n = stages.length;
  // A box too short to hold the pad put the soil — and every glyph standing on
  // it — above the frame. Nothing may paint outside the viewBox, so the soil
  // rides the top edge instead and the plants have no room left to grow.
  const baselineY = round2(Math.max(0, height - pad - 1 - bottomReserve));
  const slots = stages.map((s, i) => ({
    x: round2(padX + step / 2 + i * step),
    baselineY,
    stage: s === null || !Number.isFinite(s) ? null : Math.max(0, Math.min(3, Math.round(s))),
  }));
  const width = Math.max(1, Math.ceil(n * step + 2 * padX));
  return {
    slots,
    soil: { x1: padX, y1: baselineY, x2: round2(width - padX), y2: baselineY },
    step,
    width,
  };
}
