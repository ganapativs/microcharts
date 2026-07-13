// CalendarStrip geometry — pure, React-free. Real calendar days
// on a weeks × 7 grid (core/calendar, UTC only): value days step the shared
// intensity ramp, zero days show the track, days absent from the data render
// empty, days after `end` are future — blank, never extrapolated (empty ≠ zero,
// the Grafana bug class applied to calendars). Integer grid; crispEdges.
import { weekGrid } from "../../core/calendar-grid.js";
import { stepIndex } from "../../shared/cell.js";
import type { CellShape } from "../../shared/cell.js";

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
  rows: number;
  width: number;
  height: number;
  activeDays: number;
  /** Days in the window up to and including `end` (future cells excluded). */
  totalDays: number;
}

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
  const grid = weekGrid({ end: opts.end, weeks: opts.weeks, weekStart: opts.weekStart });
  if (!grid) return null;
  const cell = opts.cell ?? 7;
  const gap = opts.gap ?? 1;
  const steps = Math.max(2, opts.steps);

  const values = [...opts.entries.values()].filter((v) => Number.isFinite(v) && v > 0);
  let d0 = 0;
  let d1 = values.length ? Math.max(...values) : 1;
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
  };
}
