// SpiralYear geometry — pure, React-free. A year (or
// several) wound onto an Archimedean spiral: angle = position in the year (Jan 1
// at 12 o'clock, clockwise), each turn outward = the next year. Marks carry a
// 5-step (or 3-step) opacity — the value's ORDINAL level; the spiral RADIUS
// encodes time only, never value. Marks are grouped by step into ≤ steps paths
// so the node count is O(steps), not O(days). All coords 2-dp.
import { arcPath, polarPoint } from "../../core/arc.js";
import { monthStartDays } from "../../core/calendar-grid.js";
import { round2, type Value } from "../../core/types.js";

const TAU = Math.PI * 2;

export interface SpiralYearGeometry {
  marks: { cx: number; cy: number; r: number; step: number; index: number }[];
  /** One merged path of subpaths per opacity step (index = step). */
  stepPaths: string[];
  /** `dot` (filled circles) or `arc` (short stroked segments). */
  mark: "dot" | "arc";
  /** The 12 month-boundary ticks merged into one path — the at-rest calendar
   *  orientation cue, one node instead of twelve. */
  monthTicksPath: string;
  peakIndex: number;
  minIndex: number;
  turns: number;
  cadence: "day" | "week";
  size: number;
}

function circleSub(cx: number, cy: number, r: number): string {
  // Two-arc circle as a subpath (no <circle>, so many dots merge into one node).
  return `M${round2(cx - r)} ${round2(cy)}a${round2(r)} ${round2(r)} 0 1 0 ${round2(r * 2)} 0a${round2(r)} ${round2(r)} 0 1 0 ${round2(-r * 2)} 0`;
}

export function spiralYearGeometry(opts: {
  values: readonly Value[];
  size: number;
  steps: 3 | 5;
  cadence: "day" | "week";
  startIndex: number;
  pad: number;
  mark?: "dot" | "arc" | undefined;
  markR?: number | undefined;
}): SpiralYearGeometry {
  const { size, steps, cadence, pad } = opts;
  const mark = opts.mark ?? "dot";
  const cx = round2(size / 2);
  const cy = round2(size / 2);
  const rMax = size / 2 - pad;
  const n = opts.values.length;
  const periodsPerTurn = cadence === "week" ? 52 : 365;
  const startIndex = Number.isFinite(opts.startIndex)
    ? Math.max(0, Math.floor(opts.startIndex))
    : 0;

  const empty: SpiralYearGeometry = {
    marks: [],
    stepPaths: [],
    mark,
    monthTicksPath: "",
    peakIndex: -1,
    minIndex: -1,
    turns: 0,
    cadence,
    size: Math.max(1, Math.round(size)),
  };
  if (n === 0) return empty;

  const finite = opts.values
    .map((v, index) => ({ v, index }))
    .filter(
      (e): e is { v: number; index: number } => typeof e.v === "number" && Number.isFinite(e.v),
    );
  if (finite.length === 0) return empty;

  const vals = finite.map((e) => e.v);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min || 1;

  let peakIndex = finite[0]!.index;
  let minIndex = finite[0]!.index;
  let pv = finite[0]!.v;
  let mv = finite[0]!.v;
  for (const e of finite) {
    if (e.v > pv) {
      pv = e.v;
      peakIndex = e.index;
    }
    if (e.v < mv) {
      mv = e.v;
      minIndex = e.index;
    }
  }

  const turns = Math.max(1, Math.ceil((startIndex + n) / periodsPerTurn));
  const r0 = Math.min(rMax * 0.28, rMax - 1);
  const k = (rMax - r0) / turns; // radial growth per full turn

  const markR = opts.markR ?? Math.max(0.5, size * 0.028);
  const marks: SpiralYearGeometry["marks"] = [];
  const buckets: string[] = Array.from({ length: steps }, () => "");
  for (let i = 0; i < n; i++) {
    const raw = opts.values[i];
    if (!(typeof raw === "number" && Number.isFinite(raw))) continue; // null → gap
    const abs = startIndex + i; // absolute calendar position
    const yearPos = abs / periodsPerTurn;
    const angle = ((abs % periodsPerTurn) / periodsPerTurn) * TAU;
    const r = r0 + k * yearPos;
    const [mx, my] = polarPoint(cx, cy, r, angle);
    const step =
      max === min ? steps - 1 : Math.min(steps - 1, Math.floor(((raw - min) / span) * steps));
    marks.push({ cx: round2(mx), cy: round2(my), r: round2(markR), step, index: i });
    if (mark === "arc") {
      // A short arc segment spanning ~0.7 of the slot around this position.
      const half = (TAU / periodsPerTurn) * 0.35;
      buckets[step] += arcPath(cx, cy, r, angle - half, angle + half) + " ";
    } else {
      buckets[step] += circleSub(mx, my, markR);
    }
  }
  const stepPaths = buckets;

  // Month ticks — 12 hairline radial ticks at month boundaries (non-leap ref),
  // spanning just outside the outermost turn, merged into one path (one node).
  const monthAngles =
    cadence === "day"
      ? monthStartDays(2001).map((d) => (d / 365) * TAU)
      : Array.from({ length: 12 }, (_, mo) => (mo / 12) * TAU);
  const monthTicksPath = monthAngles
    .map((a) => {
      const inR = rMax - 1.2;
      const outR = rMax + 0.4;
      const x1 = round2(cx + inR * Math.sin(a));
      const y1 = round2(cy - inR * Math.cos(a));
      const x2 = round2(cx + outR * Math.sin(a));
      const y2 = round2(cy - outR * Math.cos(a));
      return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join("");

  return {
    marks,
    stepPaths,
    mark,
    monthTicksPath,
    peakIndex,
    minIndex,
    turns,
    cadence,
    size: Math.max(1, Math.round(size)),
  };
}
