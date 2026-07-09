// BalanceBeam geometry — pure, React-free (plan/24 #8, S2 exactly two). Which
// side outweighs, and roughly by how much. Tilt direction is instant; tilt angle
// SATURATES at maxTilt (read direction + rough magnitude, not an exact ratio).
// Weights are area-true (half = k·√value). Endpoints are pre-rotated HERE (no SVG
// transform in the static entry → containment is provable from coords). 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

export type BeamShape = "square" | "round";
export type BeamMode = "ratio" | "difference";

export interface BalanceBeamGeometry {
  tiltDeg: number;
  beam: { x1: number; y1: number; x2: number; y2: number };
  fulcrum: string;
  weights: [{ cx: number; cy: number; half: number }, { cx: number; cy: number; half: number }];
  /** -1 left heavier, 1 right heavier, 0 balanced. */
  heavier: -1 | 0 | 1;
}

export function balanceBeamGeometry(opts: {
  a: number;
  b: number;
  width: number;
  height: number;
  maxTilt: number;
  mode: BeamMode;
  domain?: readonly [number, number] | undefined;
  pad: number;
}): BalanceBeamGeometry {
  const { a, b, width, height, maxTilt, mode, domain, pad } = opts;
  const av = Math.max(0, Number.isFinite(a) ? a : 0);
  const bv = Math.max(0, Number.isFinite(b) ? b : 0);

  // normalized imbalance in [-1, 1]; positive = left (a) heavier
  let norm: number;
  if (mode === "difference" && domain) {
    const span = domain[1] - domain[0] || 1;
    norm = clamp((av - bv) / span, -1, 1);
  } else {
    const sum = av + bv;
    norm = sum === 0 ? 0 : clamp((av - bv) / sum, -1, 1);
  }
  const tiltDeg = round2(norm * maxTilt);
  const theta = (tiltDeg * Math.PI) / 180;

  const pivotX = round2(width / 2);
  // pivot sits ~60% down so the weights have room ABOVE the beam
  const pivotY = round2(height * 0.6);
  const bh = round2(width / 2 - pad - 4); // beam half-length

  // rotate the beam about the pivot (positive tilt → left end DOWN)
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const leftX = round2(pivotX - bh * cos);
  const leftY = round2(pivotY + bh * sin);
  const rightX = round2(pivotX + bh * cos);
  const rightY = round2(pivotY - bh * sin);

  // area-true weights: half = k·√value. maxHalf is bounded so the largest weight
  // fits both vertically (above the beam) and horizontally (at the beam end).
  const maxV = Math.max(av, bv, 1);
  const maxHalf = round2(Math.max(1, Math.min((pivotY - 1) / 2, pivotX - bh, bh * 0.4)));
  const k = maxHalf / Math.sqrt(maxV);
  const halfA = round2(k * Math.sqrt(av));
  const halfB = round2(k * Math.sqrt(bv));

  const weights: BalanceBeamGeometry["weights"] = [
    { cx: leftX, cy: round2(leftY - halfA - 0.5), half: halfA },
    { cx: rightX, cy: round2(rightY - halfB - 0.5), half: halfB },
  ];

  // fulcrum triangle: apex at the pivot, base at the bottom
  const baseY = round2(height - pad);
  const fw = round2((baseY - pivotY) * 0.7);
  const fulcrum = `M${pivotX} ${pivotY}L${round2(pivotX + fw)} ${baseY}L${round2(pivotX - fw)} ${baseY}Z`;

  const heavier: -1 | 0 | 1 = av === bv ? 0 : av > bv ? -1 : 1;

  return {
    tiltDeg,
    beam: { x1: leftX, y1: leftY, x2: rightX, y2: rightY },
    fulcrum,
    weights,
    heavier,
  };
}
