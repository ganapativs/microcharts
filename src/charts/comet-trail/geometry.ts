// CometTrail geometry — pure, React-free (plan/24 #21, S1 rolling window). Where
// is the value now, and where has it just been? A head dot at the current value
// plus a fading positional trail of recent points. Opacity encodes AGE only,
// never value — the y position does value. x = age position (newest at right).
// Trail length is context, not data: changing `trail` never changes the head
// read. All coords 2-dp.
import { extent, scaleLinear } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

/** Age-opacity ramp: newest prior point ≈ 0.7 → oldest ≈ 0.1, 5 steps. */
const AGE_OPACITY = [0.7, 0.55, 0.4, 0.25, 0.1] as const;

export interface CometTrailGeometry {
  /** Prior points, newest first; opacity encodes age. */
  trail: { cx: number; cy: number; r: number; opacity: number; index: number }[];
  head: { cx: number; cy: number; r: number; index: number } | null;
  labelX: number;
  /** Value at the head, or NaN. */
  last: number;
  /** sign(last - first over the shown window): -1 / 0 / 1. */
  trend: -1 | 0 | 1;
  /** Number of shown finite points (head + trail). */
  count: number;
  width: number;
  height: number;
}

const TRAIL_CAP = 20;

export function cometTrailGeometry(opts: {
  values: readonly number[];
  width: number;
  height: number;
  domain?: readonly [number, number] | undefined;
  trail: number;
  pad: number;
  headR?: number | undefined;
}): CometTrailGeometry {
  const { width, height, pad } = opts;
  const headR = opts.headR ?? Math.max(1.2, height * 0.14);
  const trailR = Math.max(0.8, headR * 0.7);
  const keep = Math.min(TRAIL_CAP, Math.max(0, Math.floor(opts.trail))) + 1;

  const finite = opts.values.filter((v) => Number.isFinite(v));
  const shown = finite.slice(-keep);
  const count = shown.length;

  const empty: CometTrailGeometry = {
    trail: [],
    head: null,
    labelX: round2(width - pad),
    last: NaN,
    trend: 0,
    count: 0,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
  if (count === 0) return empty;

  let yd =
    opts.domain && opts.domain.every((d) => Number.isFinite(d))
      ? (opts.domain as [number, number])
      : (extent(shown) ?? [0, 1]);
  if (yd[0] === yd[1]) yd = [yd[0] - 1, yd[1] + 1];

  const sx = scaleLinear([0, Math.max(1, count - 1)], [pad + headR, width - pad - headR]);
  const sy = scaleLinear(yd, [height - pad - headR, pad + headR]);

  // Index 0 = oldest shown, count-1 = head (newest, right).
  const headOrigIndex = finite.length - 1;
  const baseOrig = finite.length - count;

  const head = {
    cx: round2(sx(count - 1)),
    cy: round2(sy(shown[count - 1]!)),
    r: round2(headR),
    index: headOrigIndex,
  };

  const trail: CometTrailGeometry["trail"] = [];
  for (let i = count - 2; i >= 0; i--) {
    const age = count - 1 - i; // 1 = most recent prior
    const frac = count <= 2 ? 0 : (age - 1) / (count - 2);
    const step = Math.min(4, Math.round(frac * 4));
    trail.push({
      cx: round2(sx(i)),
      cy: round2(sy(shown[i]!)),
      r: trailR,
      opacity: AGE_OPACITY[step]!,
      index: baseOrig + i,
    });
  }

  const first = shown[0]!;
  const last = shown[count - 1]!;
  const trend: -1 | 0 | 1 = last > first ? 1 : last < first ? -1 : 0;

  return {
    trail,
    head,
    labelX: round2(head.cx + headR + 1),
    last,
    trend,
    count,
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}
