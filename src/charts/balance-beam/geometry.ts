// BalanceBeam geometry — pure, React-free. Which
// side outweighs, and roughly by how much. Tilt direction is instant; tilt angle
// SATURATES at maxTilt (read direction + rough magnitude, not an exact ratio).
// Weights are area-true (half = k·√value). Endpoints are pre-rotated HERE (no SVG
// transform in the static entry → containment is provable from coords). 2-dp.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export type BeamShape = "square" | "round";
export type BeamMode = "ratio" | "difference";

export interface BalanceBeamGeometry {
  tiltDeg: number;
  beam: { x1: number; y1: number; x2: number; y2: number };
  fulcrum: string;
  weights: [{ cx: number; cy: number; half: number }, { cx: number; cy: number; half: number }];
  /** -1 left heavier, 1 right heavier, 0 balanced (also when a pan is unknown). */
  heavier: -1 | 0 | 1;
  /** Per-pan: is there a real number to weigh? An unknown pan is NOT zero — the
   *  caller draws no weight for it, and the beam stays level. */
  known: [boolean, boolean];
}

export function balanceBeamGeometry(opts: {
  a: number | null | undefined;
  b: number | null | undefined;
  width: number;
  height: number;
  maxTilt: number;
  mode: BeamMode;
  domain?: readonly [number, number] | undefined;
  pad: number;
}): BalanceBeamGeometry {
  const { a, b, width, height, maxTilt, mode, domain, pad } = opts;
  // A missing/non-finite pan is UNKNOWN, never 0: weighing it as zero would
  // tilt the beam as if the side really were empty.
  const ka = isFiniteValue(a);
  const kb = isFiniteValue(b);
  const av = ka ? Math.max(0, a) : 0;
  const bv = kb ? Math.max(0, b) : 0;
  const comparable = ka && kb;

  // normalized imbalance in [-1, 1]; positive = left (a) heavier
  let norm: number;
  if (!comparable) {
    norm = 0; // nothing to compare — the beam rests level
  } else if (mode === "difference" && domain) {
    const span = isFiniteValue(domain[0]) && isFiniteValue(domain[1]) ? domain[1] - domain[0] : 0;
    norm = clamp((av - bv) / (span || 1), -1, 1);
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
  const halfA = ka ? round2(k * Math.sqrt(av)) : 0;
  const halfB = kb ? round2(k * Math.sqrt(bv)) : 0;

  const weights: BalanceBeamGeometry["weights"] = [
    { cx: leftX, cy: round2(leftY - halfA - 0.5), half: halfA },
    { cx: rightX, cy: round2(rightY - halfB - 0.5), half: halfB },
  ];

  // fulcrum triangle: apex at the pivot, base at the bottom
  const baseY = round2(height - pad);
  const fw = round2((baseY - pivotY) * 0.7);
  const fulcrum = `M${pivotX} ${pivotY}L${round2(pivotX + fw)} ${baseY}L${round2(pivotX - fw)} ${baseY}Z`;

  const heavier: -1 | 0 | 1 = !comparable || av === bv ? 0 : av > bv ? -1 : 1;

  return {
    tiltDeg,
    beam: { x1: leftX, y1: leftY, x2: rightX, y2: rightY },
    fulcrum,
    weights,
    heavier,
    known: [ka, kb],
  };
}
