// StreakSpark geometry — pure, React-free. Collapse a pass/fail/gap
// sequence into RUNS of equal outcome; each run is a bar whose width ∝ its length
// on one shared scale (the runs tile the strip, so a wide bar is a genuinely long
// run). Height + opacity encode run TYPE — streak (ok), break (fail), or the
// current run — never magnitude. The record streak carries a triangle tick. A
// null (or NaN) is a gap: it breaks the current run and starts a fresh one. 2-dp.
import { clamp } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

/** One trial: a boolean/number outcome, or `null` (a gap that breaks runs). */
export type StreakDatum = number | boolean | null | undefined;

/** Runs beyond this collapse the oldest into a single ellipsis slot (dev-warn). */
export const MAX_RUNS = 40;

/** One placed run. `on` = a streak-outcome (ok) run; `!on` = a break (fail) run. */
interface StreakRun {
  x: number;
  y: number;
  width: number;
  height: number;
  /** true = streak outcome (ok) run; false = break (fail) run. */
  on: boolean;
  /** number of trials collapsed into this run. */
  len: number;
  /** first data index in the run (annotations, focus mapping). */
  start: number;
  /** run position after capping (0-based). */
  index: number;
  /** the most recent run. */
  current: boolean;
  /** the longest streak-outcome run among those shown. */
  record: boolean;
}

/** Faint placeholder for runs merged off the left when the cap is exceeded. */
interface StreakEllipsis {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StreakSparkGeometry {
  runs: StreakRun[];
  ellipsis: StreakEllipsis | null;
  /** length of the last (current) run; 0 when there are none. */
  currentLen: number;
  /** whether the current run is a streak-outcome (ok) run. */
  currentOn: boolean;
  /** longest streak-outcome run shown; 0 = no completed streak. */
  recordLen: number;
  /** number of break (fail) runs shown. */
  breaks: number;
  /** the cap was exceeded and the oldest runs were merged. */
  truncated: boolean;
}

export interface StreakSparkGeometryOptions {
  width: number;
  height: number;
  /** With numeric data, `v >= threshold` passes; without it, `v > 0` passes. */
  threshold?: number | undefined;
  /** Which outcome is the streak: `"up"` (pass) or `"down"` (fail) is "ok". */
  positive?: "up" | "down" | undefined;
}

/** Resolve a datum to pass / fail / gap. NaN, ±Infinity and null are gaps. */
function resolvePass(v: StreakDatum, threshold: number | undefined): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return threshold !== undefined ? v >= threshold : v > 0;
}

export function streakSparkGeometry(
  data: readonly StreakDatum[],
  opts: StreakSparkGeometryOptions,
): StreakSparkGeometry {
  const { width, height, threshold, positive = "up" } = opts;
  const pad = 1;
  const mid = round2(height / 2);

  // 1 — collapse to runs of equal outcome; a gap flushes the current run.
  type Raw = { on: boolean; len: number; start: number };
  const raw: Raw[] = [];
  let cur: Raw | null = null;
  for (let i = 0; i < data.length; i++) {
    const pass = resolvePass(data[i], threshold);
    if (pass === null) {
      if (cur) {
        raw.push(cur);
        cur = null;
      }
      continue;
    }
    const on = positive === "down" ? !pass : pass;
    if (cur && cur.on === on) cur.len++;
    else {
      if (cur) raw.push(cur);
      cur = { on, len: 1, start: i };
    }
  }
  if (cur) raw.push(cur);
  if (raw.length === 0)
    return {
      runs: [],
      ellipsis: null,
      currentLen: 0,
      currentOn: false,
      recordLen: 0,
      breaks: 0,
      truncated: false,
    };

  // 2 — cap: keep the most recent MAX_RUNS, merge the rest into an ellipsis slot.
  const truncated = raw.length > MAX_RUNS;
  const kept = truncated ? raw.slice(raw.length - MAX_RUNS) : raw;
  const n = kept.length;

  // 3 — stats over the shown window.
  let recordLen = 0;
  let recordIdx = -1;
  let breaks = 0;
  kept.forEach((r, idx) => {
    if (r.on) {
      if (r.len > recordLen) {
        recordLen = r.len;
        recordIdx = idx;
      }
    } else {
      breaks++;
    }
  });
  const currentLen = kept[n - 1]!.len;
  const currentOn = kept[n - 1]!.on;

  // 4 — heights encode run TYPE (not magnitude); centered on the mid-line.
  const hCurrent = round2(Math.max(1, Math.min(height * 0.5, height - pad * 2)));
  const hOk = round2(Math.max(1, height * 0.4));
  const hFail = round2(Math.max(1, height * 0.3));

  // 5 — horizontal: runs tile the plot, width ∝ length on one shared scale.
  const ellipsisW = truncated ? round2(Math.min(4, (width - pad * 2) * 0.06)) : 0;
  const x0 = round2(pad + (ellipsisW ? ellipsisW + 1 : 0));
  const availW = Math.max(1, width - pad - x0);
  const tot = kept.reduce((s, r) => s + r.len, 0); // ≥ 1
  let gapPx = n > 1 ? round2(Math.min(1.2, availW * 0.03)) : 0;
  let barSpace = availW - gapPx * (n - 1);
  if (barSpace < n * 0.5) {
    gapPx = 0;
    barSpace = availW;
  }

  let cum = 0;
  const runs: StreakRun[] = kept.map((r, idx) => {
    const left = x0 + (cum / tot) * barSpace + idx * gapPx;
    cum += r.len;
    const right = x0 + (cum / tot) * barSpace + idx * gapPx;
    const w = round2(Math.max(0.5, right - left));
    const isCurrent = idx === n - 1;
    const h = isCurrent ? hCurrent : r.on ? hOk : hFail; // already round2'd
    const x = round2(clamp(left, pad, width - pad - w));
    return {
      x,
      y: round2(mid - h / 2),
      width: w,
      height: h,
      on: r.on,
      len: r.len,
      start: r.start,
      index: idx,
      current: isCurrent,
      record: idx === recordIdx,
    };
  });

  const ellipsis: StreakEllipsis | null = truncated
    ? { x: round2(pad), y: round2(mid - hFail / 2), width: ellipsisW, height: hFail }
    : null;

  return { runs, ellipsis, currentLen, currentOn, recordLen, breaks, truncated };
}
