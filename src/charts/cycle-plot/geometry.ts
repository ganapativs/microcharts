// CyclePlot geometry — pure, React-free (plan/23 #18). What repeats beneath the
// trend, and is any slot itself drifting? The series is reshaped row-major into
// `period` slots (slot = i mod period). Per slot: a tiny polyline of that slot's
// raw values in TIME order (never smoothed, never connected across a slot
// boundary) + a mean/median tick. Across slots: the spine of slot centers. Two
// reads kept separate by construction. Coords 2-dp, integer viewBox.
import { scaleLinear, extent } from "../../core/scale.js";
import { round2, isFiniteValue, type Value } from "../../core/types.js";

interface Slot {
  x0: number;
  x1: number;
  n: number;
  center: { x: number; y: number; value: number };
  line: { d: string } | null;
  /** last − first within the slot (raw), 2-dp; 0 when n ≤ 1. */
  drift: number;
}

export interface CycleGeometry {
  slots: Slot[];
  spine: { d: string };
  /** Slot index of the highest / lowest center. */
  peakSlot: number;
  dipSlot: number;
  /** Cycles = the longest slot's point count (ragged final cycle allowed). */
  cycles: number;
  /** Per-slot cycle counts (short slots announce "across 5 weeks"). */
  slotCounts: number[];
  /** Per-slot centers (raw values) — for interactive announcements. */
  centers: number[];
  /** Per-slot raw values in time order — for cycle stepping. */
  values: number[][];
  degenerate: boolean;
}

// Saturate the slot count. `period` is a caller prop; a non-physical value
// (e.g. 1e15) would otherwise allocate that many slot arrays (OOM) and drive
// colW → 0. The largest sane cycle is day-of-year, so bound there; the summary
// still reports the requested period. Beyond this, buckets simply wrap.
export const CYCLE_MAX_PERIOD = 366;

const meanOf = (a: readonly number[]): number => a.reduce((s, v) => s + v, 0) / a.length;

function medianOf(a: readonly number[]): number {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function cycleGeometry(opts: {
  width: number;
  height: number;
  data: readonly Value[];
  period: number;
  center?: "mean" | "median" | undefined;
  domain?: readonly [number, number] | undefined;
  pad?: number | undefined;
}): CycleGeometry | null {
  const period = Math.min(Math.max(1, Math.round(opts.period)), CYCLE_MAX_PERIOD);
  const { width, height } = opts;
  const pad = opts.pad ?? 2;

  // bucket each finite value into its slot, preserving cycle (time) order
  const values: number[][] = Array.from({ length: period }, () => []);
  for (let i = 0; i < opts.data.length; i++) {
    const v = opts.data[i];
    if (isFiniteValue(v)) values[i % period]!.push(v);
  }
  const allFinite = values.flat();
  if (allFinite.length === 0) return null;

  const dom = opts.domain ?? extent(allFinite) ?? [allFinite[0]!, allFinite[0]!];
  const degenerate = dom[0] === dom[1];
  const sy = scaleLinear(dom, [height - pad, pad]); // y up
  const plotW = width - 2 * pad;
  const colW = plotW / period;
  const inset = Math.min(colW * 0.22, 2);
  const centerFn = opts.center === "median" ? medianOf : meanOf;

  const slots: Slot[] = [];
  const centers: number[] = [];
  const slotCounts: number[] = [];
  let cycles = 0;

  for (let s = 0; s < period; s++) {
    const vs = values[s]!;
    const x0 = round2(pad + s * colW);
    const x1 = round2(pad + (s + 1) * colW);
    const cx = round2((x0 + x1) / 2);
    cycles = Math.max(cycles, vs.length);
    slotCounts.push(vs.length);

    if (vs.length === 0) {
      // empty slot — no center, no line (spine skips it)
      slots.push({
        x0,
        x1,
        n: 0,
        center: { x: cx, y: round2(height / 2), value: NaN },
        line: null,
        drift: 0,
      });
      centers.push(NaN);
      continue;
    }

    const cVal = centerFn(vs);
    centers.push(cVal);

    // within-slot polyline: raw values spread across the column, time order
    let line: { d: string } | null = null;
    if (vs.length > 1) {
      const innerL = x0 + inset;
      const innerR = x1 - inset;
      const pts = vs.map((v, j) => {
        const x = round2(innerL + ((innerR - innerL) * j) / (vs.length - 1));
        return `${x} ${round2(sy(v))}`;
      });
      line = { d: "M" + pts.join(" L") };
    }

    slots.push({
      x0,
      x1,
      n: vs.length,
      center: { x: cx, y: round2(sy(cVal)), value: cVal },
      line,
      drift: vs.length > 1 ? round2(vs[vs.length - 1]! - vs[0]!) : 0,
    });
  }

  // spine — connect the centers of non-empty slots only (never across a gap)
  const spinePts = slots.filter((sl) => sl.n > 0).map((sl) => `${sl.center.x} ${sl.center.y}`);
  const spine = { d: spinePts.length > 1 ? "M" + spinePts.join(" L") : "" };

  // peak / dip by center value (finite slots only)
  let peakSlot = -1;
  let dipSlot = -1;
  for (let s = 0; s < period; s++) {
    if (!Number.isFinite(centers[s]!)) continue;
    if (peakSlot < 0 || centers[s]! > centers[peakSlot]!) peakSlot = s;
    if (dipSlot < 0 || centers[s]! < centers[dipSlot]!) dipSlot = s;
  }

  return {
    slots,
    spine,
    peakSlot,
    dipSlot,
    cycles,
    slotCounts,
    centers,
    values,
    degenerate,
  };
}
