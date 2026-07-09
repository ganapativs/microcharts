// SproutRow geometry — pure, React-free (plan/24 #9, S2 ordinal). Four discrete
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

/** Glyph path for a stage at (cx, baselineY) — one FILLED path (thin stem +
 *  leaves/head), scaled to the usable height `gh`. Height is strictly monotonic
 *  in stage, so taller always reads as further along. */
export function stageGlyph(stage: number, cx: number, by: number, gh: number): string {
  const r = round2;
  const lw = Math.max(1.4, gh * 0.2); // leaf half-extent
  if (stage <= 0) {
    // seed — a small dot near the soil
    const rs = round2(Math.min(1.5, gh * 0.14));
    return `M${r(cx)} ${round2(by - rs)}a${rs} ${rs} 0 1 0 0.01 0Z`;
  }
  const top = round2(by - gh * STEM_FRAC[Math.min(stage, 3)]!);
  const sw = 0.45; // half stem width
  let d = `M${r(cx - sw)} ${r(by)}L${r(cx - sw)} ${top}L${r(cx + sw)} ${top}L${r(cx + sw)} ${r(by)}Z`;
  // right leaf (sprout, leaf, bloom)
  const rly = round2(by - gh * 0.28);
  d += `M${r(cx)} ${rly}Q${round2(cx + lw)} ${round2(rly - lw * 0.5)} ${round2(cx + lw * 0.66)} ${round2(rly - lw)}Q${round2(cx + lw * 0.16)} ${round2(rly - lw * 0.5)} ${r(cx)} ${rly}Z`;
  if (stage >= 2) {
    // left leaf, a touch higher
    const lly = round2(by - gh * 0.46);
    d += `M${r(cx)} ${lly}Q${round2(cx - lw)} ${round2(lly - lw * 0.5)} ${round2(cx - lw * 0.66)} ${round2(lly - lw)}Q${round2(cx - lw * 0.16)} ${round2(lly - lw * 0.5)} ${r(cx)} ${lly}Z`;
  }
  if (stage >= 3) {
    // bloom — flower head at the stem top
    const rh = round2(Math.min(1.8, gh * 0.14));
    d += `M${r(cx)} ${round2(top - rh)}a${rh} ${rh} 0 1 0 0.01 0Z`;
  }
  return d;
}

export function sproutRowGeometry(opts: {
  stages: readonly (number | null)[];
  height: number;
  step: number;
  pad: number;
  /** Space reserved below the soil for category labels. */
  bottomReserve?: number;
}): SproutRowGeometry {
  const { stages, height, step, pad, bottomReserve = 0 } = opts;
  const n = stages.length;
  const baselineY = round2(height - pad - 1 - bottomReserve);
  const slots = stages.map((s, i) => ({
    x: round2(pad + step / 2 + i * step),
    baselineY,
    stage: s === null || !Number.isFinite(s) ? null : Math.max(0, Math.min(3, Math.round(s))),
  }));
  const width = Math.max(1, Math.ceil(n * step + 2 * pad));
  return {
    slots,
    soil: { x1: pad, y1: baselineY, x2: round2(width - pad), y2: baselineY },
    step,
    width,
  };
}
