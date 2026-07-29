// CalendarStrip: Real calendar days
// on a weeks × 7 grid (core/calendar, UTC only): value days step the shared
// intensity ramp, zero days show the track, days absent from the data render
// empty, days after `end` are future — blank, never extrapolated (empty ≠ zero,
// the Grafana bug class applied to calendars). Integer grid; crispEdges.
import { weekGrid } from "../../core/calendar-grid.js";
import { stepIndex } from "../../shared/cell.js";
import type { CellShape } from "../../shared/cell.js";
import { maxOf } from "../../core/scale.js";

type DayState = "value" | "zero" | "empty" | "future";

interface DayCell {
  x: number;
  y: number;
  size: number;
  /** ISO `yyyy-mm-dd`. */
  date: string;
  /** Intensity step 1..steps for value days; null otherwise. */
  step: number | null;
  state: DayState;
  value: number | null;
}

export interface CalendarStripGeometry {
  cells: DayCell[];
  /** Week rows actually built — the window that was PAINTED, which is what the
   *  summary must announce. `weeks` is caller config and arrives floored,
   *  clamped and capped; announcing the raw prop said "over 4.7 weeks" (or
   *  "over NaN weeks") above a grid that was never that tall. */
  rows: number;
  width: number;
  height: number;
  activeDays: number;
  /** Days in the window up to and including `end` (future cells excluded). */
  totalDays: number;
  /** Resolved layout + ramp config the cells were built from. Every consumer —
   *  the paint ramp, the mark metrics, the pointer pitch — reads these rather
   *  than the raw prop, or the two disagree about the same grid. */
  cell: number;
  gap: number;
  steps: number;
}

/** Week ceiling. Every week is seven more day objects and seven more DOM nodes,
 *  and `weeks` is caller config: `weeks={1e6}` allocated seven million days
 *  before painting anything. A full year still fits; past that the chart is
 *  ActivityGrid, which the `weeks > 8` dev-warning already points at. */
export const CALENDAR_MAX_WEEKS = 53;

const len = (v: number | undefined, fallback: number): number =>
  v !== undefined && Number.isFinite(v) ? Math.max(0, v) : fallback;

export function calendarStripGeometry(opts: {
  weeks: number;
  end: string | Date;
  weekStart: 0 | 1;
  /** ISO date → value (duplicates pre-summed by the component). */
  entries: ReadonlyMap<string, number>;
  domain?: readonly [number, number] | undefined;
  steps: number;
  cell?: number | undefined;
  gap?: number | undefined;
  shape?: CellShape | undefined;
}): CalendarStripGeometry | null {
  const weeks = Number.isFinite(opts.weeks)
    ? Math.min(CALENDAR_MAX_WEEKS, Math.max(1, Math.floor(opts.weeks)))
    : 1;
  const grid = weekGrid({ end: opts.end, weeks, weekStart: opts.weekStart });
  if (!grid) return null;
  // Lengths fall back to the documented defaults instead of poisoning the frame:
  // `cell={NaN}` reached <Chart> as `viewBox="0 0 NaN NaN"`, which paints nothing.
  const cell = len(opts.cell, 7);
  const gap = len(opts.gap, 1);
  // One ramp, resolved once. A non-finite `steps` bucketed every day to NaN and
  // emitted `fill-opacity="NaN"`; browsers drop an invalid presentation value,
  // so the whole intensity ramp silently flattened to full strength.
  const steps = Number.isFinite(opts.steps) ? Math.max(2, Math.floor(opts.steps)) : 5;

  const values = [...opts.entries.values()].filter((v) => Number.isFinite(v) && v > 0);
  let d0 = 0;
  let d1 = values.length ? maxOf(values) : 1;
  if (opts.domain && opts.domain.every((d) => Number.isFinite(d))) {
    d0 = Math.min(opts.domain[0], opts.domain[1]);
    d1 = Math.max(opts.domain[0], opts.domain[1]);
  }

  let activeDays = 0;
  let totalDays = 0;
  const cells: DayCell[] = grid.days.map((day) => {
    const future = day.time > grid.endTime;
    const raw = opts.entries.get(day.date);
    let state: DayState;
    let step: number | null = null;
    let value: number | null = null;
    if (future) {
      state = "future";
    } else {
      totalDays++;
      if (raw === undefined || !Number.isFinite(raw)) {
        state = "empty";
      } else if (raw === 0) {
        state = "zero";
        value = 0;
      } else {
        state = "value";
        value = raw;
        // steps-1 value buckets on top of the zero track: 1..steps-1
        step = Math.max(1, Math.min(steps - 1, 1 + stepIndex(raw, d0, d1, steps - 1)));
        activeDays++;
      }
    }
    return {
      x: day.col * (cell + gap),
      y: day.row * (cell + gap),
      size: cell,
      date: day.date,
      step,
      state,
      value,
    };
  });

  return {
    cells,
    rows: grid.rows,
    width: 7 * cell + 6 * gap,
    height: grid.rows * cell + (grid.rows - 1) * gap,
    activeDays,
    totalDays,
    cell,
    gap,
    steps,
  };
}
