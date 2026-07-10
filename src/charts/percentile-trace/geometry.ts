// PercentileTrace geometry — pure, React-free (plan/26 §8). One entity's
// STANDING drifting inside a population. The series IS percentile rank, so the
// y-axis is LOCKED to [0,100] — the honest frame — and the population bands
// (p25–75, p5–95) are constant by definition, not estimated. That constancy is
// the key simplification: the bands are fixed rects, the trace is the only line.
// Non-monotone drift renders as-is, never sorted or smoothed. Coords 2-dp.
import { linePath } from "../../core/path.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value, type XY } from "../../core/types.js";

/** How the entity's standing moved relative to the middle half (p25–75). */
type PercentileMovement =
  | "roseAbove"
  | "fellBelow"
  | "enteredMiddle"
  | "heldAbove"
  | "heldMiddle"
  | "heldBelow";

interface PercentilePoint {
  /** Original series index (0 = first reading). */
  index: number;
  x: number;
  y: number;
  value: number;
}

interface BandRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PercentileGeometry {
  line: { d: string };
  /** Per-reading positions — overlays + nearest-x. */
  points: PercentilePoint[];
  /** Last finite reading — endpoint dot + label anchor. */
  last: PercentilePoint;
  /** First finite reading — frames the drift story. */
  first: PercentilePoint;
  /** last − first, in percentile points (2-dp). */
  delta: number;
  movement: PercentileMovement;
  /** Fixed population bands: inner = p25–75, outer = p5–95. */
  bands: { inner: BandRect; outer: BandRect };
  /** True when any finite input fell outside 0–100 and was clamped. */
  clamped: boolean;
}

// region of the [0,100] axis a rank sits in: 0 = lower (< p25), 1 = middle
// half (p25–75), 2 = upper (> p75). Numeric so movement indexes a phrase table.
const region = (v: number): 0 | 1 | 2 => (v > 75 ? 2 : v < 25 ? 0 : 1);

// [lower, middle, upper] end-region → movement label, held (same region) vs
// crossed (region changed) between first and last reading.
const HELD = ["heldBelow", "heldMiddle", "heldAbove"] as const;
const CROSSED = ["fellBelow", "enteredMiddle", "roseAbove"] as const;

export function percentileGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  pad?: number | undefined;
}): PercentileGeometry | null {
  const { width, height, data } = opts;
  const pad = opts.pad ?? 2;
  const n = data.length;

  const xScale = scaleLinear([0, Math.max(1, n - 1)], [pad, width - pad]);
  const yScale = scaleLinear([0, 100], [height - pad, pad]);
  const x = (i: number) => round2(xScale(i));
  const y = (v: number) => round2(clamp(yScale(v), pad, height - pad));

  // one pass: clamp each finite reading into [0,100], flag any that needed it,
  // build both the gap-preserving line path and the finite-only point list
  let clamped = false;
  const linePts: (XY | null)[] = [];
  const points: PercentilePoint[] = [];
  data.forEach((raw, i) => {
    if (!isFiniteValue(raw)) {
      linePts.push(null);
      return;
    }
    if (raw < 0 || raw > 100) clamped = true;
    const v = clamp(raw, 0, 100);
    const px = x(i);
    const py = y(v);
    linePts.push([px, py]);
    points.push({ index: i, x: px, y: py, value: round2(v) });
  });
  if (points.length === 0) return null;

  // first + last finite readings frame the drift story
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const delta = round2(last.value - first.value);

  const lr = region(last.value);
  const movement: PercentileMovement = (region(first.value) === lr ? HELD : CROSSED)[lr];

  // fixed population bands — full-bleed horizontal fields across the plot
  const band = (lo: number, hi: number): BandRect => {
    const yHi = y(hi);
    return { x: 0, y: yHi, width, height: round2(y(lo) - yHi) };
  };

  return {
    line: { d: linePath(linePts) },
    points,
    last,
    first,
    delta,
    movement,
    bands: { inner: band(25, 75), outer: band(5, 95) },
    clamped,
  };
}
