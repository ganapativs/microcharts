// Week-grid + year math (split from calendar.ts, 2026-07-08): ActivityGrid
// only needs parseUTCDay, and bundlers keep whole chunks — housing weekGrid in
// the same module taxed every parseUTCDay consumer (chunk granularity, see
// core/strings-scalar.ts).
import { parseUTCDay } from "./calendar.js";

/** ISO `yyyy-mm-dd` for a UTC-midnight timestamp. */
export function isoDate(time: number): string {
  const d = new Date(time);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

const DAY = 86_400_000;

/** One grid cell. `date`/`time` identify the UTC day; `row`/`col` place it. */
export interface CalendarDay {
  /** ISO `yyyy-mm-dd`. */
  date: string;
  /** UTC-midnight timestamp — cheap comparisons (`time > endTime` = future). */
  time: number;
  /** Week row, 0 = oldest. */
  row: number;
  /** Day column, 0 = the locale start-of-week. */
  col: number;
  /** UTC month, 0–11 (month boundary detection for labels/ticks). */
  month: number;
  /** UTC day of month, 1–31. */
  day: number;
  /** UTC weekday, 0 = Sunday — independent of `weekStart`. */
  weekday: number;
}

export interface WeekGrid {
  /** `rows × 7` cells, row-major, oldest first. */
  days: CalendarDay[];
  rows: number;
  /** ISO date of cell (0, 0). */
  start: string;
  /** ISO date of the authored `end` day. Cells after it exist to complete the
   *  final week row — the chart renders them as future, never as data. */
  end: string;
  /** UTC-midnight timestamp of `end`. */
  endTime: number;
}

/**
 * A `weeks × 7` grid of real calendar days ending in the week that contains
 * `end`, columns aligned to `weekStart` (0 Sunday, 1 Monday — the locale
 * param every calendar chart forwards here). Pure UTC arithmetic: no DST,
 * no locale, no `Date.now()`. Returns null for an unparseable `end`;
 * `weeks` is floored and clamped to ≥ 1.
 */
export function weekGrid(opts: {
  end: string | Date;
  weeks: number;
  weekStart?: 0 | 1;
}): WeekGrid | null {
  const endTime = parseUTCDay(opts.end);
  if (endTime === null) return null;
  const weekStart = opts.weekStart ?? 1;
  const rows = Math.max(1, Math.floor(opts.weeks));

  const endCol = (new Date(endTime).getUTCDay() - weekStart + 7) % 7;
  const startTime = endTime - endCol * DAY - (rows - 1) * 7 * DAY;

  const days: CalendarDay[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const time = startTime + i * DAY;
    const d = new Date(time);
    days.push({
      date: isoDate(time),
      time,
      row: Math.floor(i / 7),
      col: i % 7,
      month: d.getUTCMonth(),
      day: d.getUTCDate(),
      weekday: d.getUTCDay(),
    });
  }

  return { days, rows, start: days[0]!.date, end: isoDate(endTime), endTime };
}

/** 1-based day of the year (UTC), 1–366. Null for unparseable input. */
export function dayOfYear(input: string | Date): number | null {
  const t = parseUTCDay(input);
  if (t === null) return null;
  const jan1 = Date.UTC(new Date(t).getUTCFullYear(), 0, 1);
  return (t - jan1) / DAY + 1;
}

export function daysInYear(year: number): 365 | 366 {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/** 1-based day-of-year of each month's first day (12 entries) — month
 *  boundaries for spiral ticks and grid labels. */
export function monthStartDays(year: number): number[] {
  const jan1 = Date.UTC(year, 0, 1);
  const out: number[] = [];
  for (let m = 0; m < 12; m++) out.push((Date.UTC(year, m, 1) - jan1) / DAY + 1);
  return out;
}
