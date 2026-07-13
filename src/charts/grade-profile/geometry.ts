// GradeProfile geometry — pure, React-free. How hard is the route,
// where: one baseline-anchored quad per segment filled by a QUANTIZED grade bin
// (never a continuous ramp), with the elevation ridge on top. Grade = rise ÷ run
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

export function gradeProfileGeometry(opts: {
  data: readonly GradePoint[];
  width: number;
  height: number;
  bins: readonly [number, number, number];
  topPad: number;
}): GradeProfileGeometry {
  const { data, width, height, bins, topPad } = opts;
  const pad = 1;
  const collapsed = width < 72;
  const yBase = round2(height - pad);
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

  const xOf = (d: number): number => round2(pad + ((d - dMin) / dSpan) * plotW);
  const yOf = (e: number): number => round2(yBase - ((e - eMin) / eSpan) * plotH);

  const binOf = (grade: number): 0 | 1 | 2 | 3 => {
    // quantized — a discrete difficulty bucket, never a continuous ramp
    if (collapsed) return grade >= bins[0] ? 2 : 0;
    if (grade < bins[0]) return 0; // flats and every descent live here
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
    if (rise > 0) {
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
    if (grade > maxGrade) {
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
): { fontSize: number; topPad: number } {
  const fontSize = labelFont(height, 0.4); // dense strip weight (core/labels.ts)
  return { fontSize, topPad: label === "none" ? 1 : round2(fontSize + 1.5) };
}
