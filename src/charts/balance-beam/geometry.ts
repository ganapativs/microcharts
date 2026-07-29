// BalanceBeam: Which
// side outweighs, and roughly by how much. Tilt direction is instant; tilt angle
// SATURATES at maxTilt (read direction + rough magnitude, not an exact ratio).
// Weights are area-true (half = k·√value). Endpoints are pre-rotated HERE (no SVG
// transform in the static entry → containment is provable from coords). 2-dp.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export type BeamShape = "square" | "round";
export type BeamMode = "ratio" | "difference";

/** Degrees at full saturation. The `maxTilt` prop default, and the fallback
 *  when a caller computes one that isn't a real number. */
export const DEFAULT_MAX_TILT = 12;

export interface BalanceBeamGeometry {
  /** The tilt actually painted: `maxTilt` after resolution, and after the cap
   *  that keeps the ends inside the box. Never opposite in sign to `heavier`. */
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
  const pivotX = round2(width / 2);
  // pivot sits ~60% down so the weights have room ABOVE the beam
  const pivotY = round2(height * 0.6);
  const bh = round2(width / 2 - pad - 4); // beam half-length

  // A host-computed maxTilt arrives hostile more often than typed: NaN from an
  // empty input (`Number("")`) painted NaN endpoints; a negative one tilted the
  // beam AWAY from the side the summary named heavier; a large one wrapped past
  // 90° and reversed it the same way. Resolve once, here, so every consumer of
  // this geometry reads the same tilt the summary describes.
  const ceilDeg = isFiniteValue(maxTilt) ? clamp(maxTilt, 0, 90) : DEFAULT_MAX_TILT;
  // The beam is rigid, so the swing is capped as an ANGLE, not by moving an
  // endpoint: an end may drop as far as the fulcrum's stance and no further.
  // Without it a wide, short beam (bh far larger than the height) swung both
  // ends clean out of the box at ordinary tilts.
  const maxDeg = (Math.asin(clamp((height * 0.4 - pad) / (bh || 1), 0, 1)) * 180) / Math.PI;
  const tiltDeg = round2(clamp(norm * ceilDeg, -maxDeg, maxDeg));
  const theta = (tiltDeg * Math.PI) / 180;

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
  // The RAISED end has less headroom than the level beam did, and sizing k from
  // the box alone let a near-equal pair on a saturated tilt paint its square off
  // the top edge — reachable with default props in `difference` mode, where a
  // small domain saturates the tilt while both weights stay large. Both weights
  // still share one k, so the area ratio between them is untouched.
  const sa = Math.sqrt(av / maxV);
  const sb = Math.sqrt(bv / maxV);
  // 0.52, not 0.5: the extra 0.02 absorbs the three round2 steps between here
  // and the emitted `y`, which otherwise round the square 0.01 above the edge.
  const headA = sa > 0 ? (leftY - 0.52) / (2 * sa) : Infinity;
  const headB = sb > 0 ? (rightY - 0.52) / (2 * sb) : Infinity;
  const maxHalf = round2(
    Math.max(1, Math.min((pivotY - 1) / 2, pivotX - bh, bh * 0.4, headA, headB)),
  );
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
