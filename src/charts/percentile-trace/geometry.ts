// PercentileTrace: One entity's
// STANDING drifting inside a population. The series IS percentile rank, so the
// y-axis is LOCKED to [0,100] — the honest frame — and the population bands
// (p25–75, p5–95) are constant by definition, not estimated. That constancy is
// the key simplification: the bands are fixed rects, the trace is the only line.
// Non-monotone drift renders as-is, never sorted or smoothed. Coords 2-dp.
import { linePath } from "../../core/path.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import { chartSide, isFiniteValue, round2, type Value, type XY } from "../../core/types.js";

/** Documented box, shared by the geometry and both entries. */
/** Default plot inset. Exported so the no-data branch — which renders before
 *  there is any geometry to read a box from — seats on the same number the
 *  plotted chart does, instead of a literal that silently desyncs. */
export const PERCENTILE_PAD = 2;

export const DEFAULT_WIDTH = 80;
export const DEFAULT_HEIGHT = 20;

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
  /** Left edge of the plot box — reading 0 sits here. */
  x0: number;
  /** Right edge of the plot box — the last reading. Excludes the label gutter. */
  x1: number;
  /** Top edge of the plot box — the p100 end of the locked axis. */
  y0: number;
  /** Bottom edge of the plot box — the p0 end. Also the inline seat's floor. */
  y1: number;
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
  const { data } = opts;
  // The box is a caller prop like any other — a CSS var read back, a collapsed
  // flex measurement. `Chart` clamps only what it puts in the viewBox, so a raw
  // `height={NaN}` left NaN band/trace coords inside a valid 80×1 frame, and
  // `width={-40}` painted x=-42 — and `.mc-root` is overflow: visible, so that
  // spills into the page. Resolve to the documented box instead.
  const width = chartSide(opts.width, DEFAULT_WIDTH);
  const height = chartSide(opts.height, DEFAULT_HEIGHT);

  const pad = opts.pad ?? PERCENTILE_PAD;
  // Below `2 * pad` the padded plot inverts and `clamp(v, 2, -1)` returns the
  // upper bound — the trace sat below a 1-unit-tall box. Half the box is the
  // pad's floor.
  const padX = Math.min(pad, width / 2);
  const padY = Math.min(pad, height / 2);
  const n = data.length;

  const xScale = scaleLinear([0, Math.max(1, n - 1)], [padX, width - padX]);
  const yScale = scaleLinear([0, 100], [height - padY, padY]);
  const x = (i: number) => round2(xScale(i));
  const y = (v: number) => round2(clamp(yScale(v), padY, height - padY));

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
    x0: round2(padX),
    x1: round2(width - padX),
    y0: round2(padY),
    y1: round2(height - padY),
    clamped,
  };
}
