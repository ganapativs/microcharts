// GradeProfile: How hard is the route,
// where: one baseline-anchored quad per segment filled by a QUANTIZED grade bin
// (never a continuous ramp). with the elevation ridge on top. Grade = rise ÷ run
// × 100, so `d` and `elev` must share units. Descents are always the gentlest bin
// — climb difficulty is the story. Non-finite / non-monotone segments drop out as
// gaps. 2-dp coords.
import { labelFont } from "../../core/labels.js";
import { linePath } from "../../core/path.js";
import { round2 } from "../../core/types.js";

export interface GradePoint {
  /** Distance along the route (monotonic; any unit, shared with `elev`). */
  d: number;
  /** Elevation (same unit as `d` so grade is a true percent). */
  elev: number;
}

interface GradeSegment {
  /** Baseline-anchored quad (flat-to-baseline trapezoid). */
  path: string;
  /** 0 = flat/descent … 3 = brutal. Quantized by `bins`. */
  bin: 0 | 1 | 2 | 3;
  /** Signed grade %, 2-dp. */
  grade: number;
  /** Pixel x span (hit-test + focus). */
  x0: number;
  x1: number;
  /** Pixel ridge y at the two ends (focus segment). */
  y0: number;
  y1: number;
  /** Raw distance at the segment end (readout). */
  dEnd: number;
  /** Cumulative climb (summed positive rise) through this segment, raw units. */
  cumGain: number;
}

export interface GradeProfileGeometry {
  segments: GradeSegment[];
  /** Ridge polyline path (gaps break it). */
  ridge: string;
  /** Baseline y (bottom of the strip). */
  yBase: number;
  /** Steepest climb grade (signed %, 0 when nothing climbs). */
  maxGrade: number;
  /** Raw distance at the steepest climb (segment midpoint). */
  maxGradeAt: number;
  /** Summit tick anchor (top of the ridge at the steepest segment). */
  summitX: number;
  summitY: number;
  totalDistance: number;
  totalGain: number;
  /** Below 72 units wide the bins collapse to flat vs climb (documented). */
  collapsed: boolean;
  /** Input point count. */
  n: number;
}

/** Documented default grade-% thresholds (ascending) for the four bins. */
export const DEFAULT_BINS = [3, 6, 10] as const;

/**
 * Hosts compute thresholds more often than they type them — a slider, a
 * `Number("")` off an empty field, a sort that ran descending. Left alone,
 * `grade < NaN` is false at every step, so `binOf` fell through to the top bin
 * and the whole route painted in the brutal-climb ink while the summary still
 * reported an ordinary 16% max. Thresholds that cannot bucket anything fall
 * back to the documented defaults rather than repaint the terrain as a wall.
 */
function resolveBins(bins: readonly [number, number, number]): readonly [number, number, number] {
  const [a, b, c] = bins;
  const usable = Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && a <= b && b <= c;
  return usable ? bins : DEFAULT_BINS;
}

/**
 * A coordinate, or the plot edge when it is unrepresentable. Both spans
 * overflow from perfectly finite endpoints more than 1.8e308 apart, and then
 * `(v - min) / span` is `Infinity / Infinity` → NaN. SVG drops a `d` holding
 * NaN wholesale, so the mark vanished while the accessible name still
 * described it; degrading to the edge renders the same flat strip a zero span
 * already does.
 */
function at(v: number, edge: number): number {
  return Number.isFinite(v) ? round2(v) : edge;
}

export function gradeProfileGeometry(opts: {
  data: readonly GradePoint[];
  width: number;
  height: number;
  bins: readonly [number, number, number];
  topPad: number;
}): GradeProfileGeometry {
  const { data, width, height, topPad } = opts;
  const bins = resolveBins(opts.bins);
  const pad = 1;
  const collapsed = width < 72;
  // Baseline seats flush with the box bottom so the profile aligns on the text
  // baseline inline; the base is a flat fill edge, so it bleeds nothing.
  const yBase = round2(height);
  const n = data.length;

  const pts = data.map((p) => ({
    d: p.d,
    elev: p.elev,
    ok: Number.isFinite(p.d) && Number.isFinite(p.elev),
  }));
  const finite = pts.filter((p) => p.ok);

  const empty: GradeProfileGeometry = {
    segments: [],
    ridge: "",
    yBase,
    maxGrade: 0,
    maxGradeAt: 0,
    summitX: 0,
    summitY: 0,
    totalDistance: 0,
    totalGain: 0,
    collapsed,
    n,
  };
  if (finite.length === 0) return empty;

  let dMin = Infinity;
  let dMax = -Infinity;
  let eMin = Infinity;
  let eMax = -Infinity;
  for (const p of finite) {
    if (p.d < dMin) dMin = p.d;
    if (p.d > dMax) dMax = p.d;
    if (p.elev < eMin) eMin = p.elev;
    if (p.elev > eMax) eMax = p.elev;
  }
  const dSpan = dMax - dMin || 1;
  const eSpan = eMax - eMin || 1;
  const plotTop = round2(pad + topPad);
  const plotH = Math.max(1, yBase - plotTop);
  const plotW = width - pad * 2;

  const xOf = (d: number): number => at(pad + ((d - dMin) / dSpan) * plotW, pad);
  const yOf = (e: number): number => at(yBase - ((e - eMin) / eSpan) * plotH, yBase);

  const binOf = (grade: number): 0 | 1 | 2 | 3 => {
    // quantized — a discrete difficulty bucket, never a continuous ramp.
    // Flats and every descent are bin 0 by definition — the bin encodes CLIMB
    // difficulty, and a downhill has none. Gating on zero here rather than on
    // `bins[0]` keeps that true for a caller whose first threshold sits at or
    // below zero, which otherwise painted descents in a climb colour.
    if (grade <= 0) return 0;
    if (collapsed) return grade >= bins[0] ? 2 : 0;
    if (grade < bins[0]) return 0; // gentle climbs live here too
    if (grade < bins[1]) return 1;
    if (grade < bins[2]) return 2;
    return 3;
  };

  const ridgePts = pts.map((p) => (p.ok ? ([xOf(p.d), yOf(p.elev)] as const) : null));

  const segments: GradeSegment[] = [];
  let cumGain = 0;
  let totalGain = 0;
  let maxGrade = 0;
  let maxGradeAt = 0;
  let summitX = 0;
  let summitY = plotTop;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (!a.ok || !b.ok) continue;
    const run = b.d - a.d;
    if (!(run > 0)) continue; // non-monotone / zero run → gap
    const rise = b.elev - a.elev;
    const grade = round2((rise / run) * 100);
    // Two finite elevations still produce an unrepresentable climb: the
    // difference overflows past 1.8e308, or `rise / run` does on a sub-normal
    // run. `Intl` renders that "∞", so the chart announced "∞ gain; steepest
    // ∞%" over an ordinary-looking profile. The quad still paints — the
    // terrain is real — but a number nobody can read is not a measurement.
    if (rise > 0 && Number.isFinite(totalGain + rise)) {
      cumGain += rise;
      totalGain += rise;
    }
    const x0 = xOf(a.d);
    const x1 = xOf(b.d);
    const y0 = yOf(a.elev);
    const y1 = yOf(b.elev);
    segments.push({
      path: `M${x0} ${yBase}L${x0} ${y0}L${x1} ${y1}L${x1} ${yBase}Z`,
      bin: binOf(grade),
      grade,
      x0,
      x1,
      y0,
      y1,
      dEnd: round2(b.d),
      cumGain: round2(cumGain),
    });
    if (grade > maxGrade && Number.isFinite(grade)) {
      maxGrade = grade;
      maxGradeAt = round2((a.d + b.d) / 2);
      summitX = round2((x0 + x1) / 2);
      summitY = Math.min(y0, y1);
    }
  }

  return {
    segments,
    ridge: linePath(ridgePts),
    yBase,
    maxGrade,
    maxGradeAt,
    summitX,
    summitY,
    totalDistance: round2(dMax - dMin),
    totalGain: round2(totalGain),
    collapsed,
    n,
  };
}

/** Shared layout math so the static and interactive entries fold identically. */
export function gradeLayout(
  height: number,
  label: "max" | "none",
  min?: number | undefined,
): { fontSize: number; topPad: number } {
  const fontSize = labelFont(height, 0.4, min); // dense strip weight (core/labels.ts)
  return { fontSize, topPad: label === "none" ? 1 : round2(fontSize + 1.5) };
}
