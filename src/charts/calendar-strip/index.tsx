// <CalendarStrip> — what did the last few weeks look like, day by day
// (plan/22 #26). Real calendar position (weekday rhythm) is the point — for
// longer ordinal histories use ActivityGrid. Honesty: a day with no record
// renders visibly different from a day with value 0, and future days are
// blank, never extrapolated. All date math UTC (core/calendar). Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { parseUTCDay } from "../../core/calendar.js";
import { isoDate } from "../../core/calendar-grid.js";
import { EN_CALENDAR, type CalendarStrings } from "../../core/strings-calendar.js";
import { cellMetrics, stepOpacity, type CellShape } from "../../shared/cell.js";
import { calendarStripGeometry } from "./geometry.js";

export interface CalendarStripDatum {
  /** ISO `yyyy-mm-dd` (any time suffix dropped) or Date (its UTC day). */
  date: string | Date;
  value: number;
}

/** Sums duplicate dates into an ISO-keyed map (dev-warns on duplicates). */
export function calendarEntries(data: readonly CalendarStripDatum[]): Map<string, number> {
  const entries = new Map<string, number>();
  for (const d of data) {
    const t = parseUTCDay(d.date);
    if (t === null) {
      devWarn(`<CalendarStrip> bad date: ${String(d.date)}`);
      continue;
    }
    const key = isoDate(t);
    if (entries.has(key)) {
      devWarn(`<CalendarStrip> duplicate date summed: ${key}`);
      entries.set(key, (entries.get(key) ?? 0) + d.value);
    } else {
      entries.set(key, d.value);
    }
  }
  return entries;
}

/** Factual calendar summary — active days over the window. Shared. */
export function calendarStripSummary(
  activeDays: number,
  totalDays: number,
  weeks: number,
  strings: CalendarStrings,
): string {
  if (totalDays === 0) return strings.noData;
  return strings.calendar(activeDays, totalDays, weeks);
}

export interface CalendarStripProps {
  data: readonly CalendarStripDatum[];
  /** Window length in whole weeks ending at `end`. Documented cap: 8. */
  weeks?: number | undefined;
  /** Last day of the window. Defaults to today (UTC) — pin it in anything
   *  that must be deterministic (tests, docs, SSR snapshots). */
  end?: string | Date | undefined;
  /** Locale start-of-week (0 = Sunday, 1 = Monday). */
  weekStart?: 0 | 1 | undefined;
  /** Intensity steps including the zero track. */
  steps?: number | undefined;
  /** Cell mark: crisp square (default), soft `"round"`, or padded `"dot"`. */
  shape?: CellShape | undefined;
  /** Explicit `[min, max]` for step bucketing; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: CalendarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export const CALENDAR_CELL = 7;
export const CALENDAR_GAP = 1;

export function CalendarStrip(props: CalendarStripProps): ReactNode {
  const {
    data,
    weeks = 4,
    end,
    weekStart = 1,
    steps = 5,
    shape = "square",
    domain,
    color,
    strings = EN_CALENDAR,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (weeks > 8) devWarn("<CalendarStrip> weeks > 8 — use ActivityGrid.");

  const geo = calendarStripGeometry({
    weeks,
    end: end ?? new Date(),
    weekStart,
    entries: calendarEntries(data),
    domain,
    steps,
    cell: CALENDAR_CELL,
    gap: CALENDAR_GAP,
  });
  if (!geo) {
    devWarn("<CalendarStrip> unparseable `end` date.");
    return null;
  }
  const mark = cellMetrics(CALENDAR_CELL, shape);
  const accName =
    summary === false
      ? false
      : (summary ?? calendarStripSummary(geo.activeDays, geo.totalDays, weeks, strings));

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-calendar ${className}` : "mc-calendar"}
      style={style}
    >
      {geo.cells.map((c) =>
        c.state === "future" ? null : (
          <rect
            key={c.date}
            x={c.x + mark.inset}
            y={c.y + mark.inset}
            width={c.size - mark.inset * 2}
            height={c.size - mark.inset * 2}
            rx={mark.rx}
            shapeRendering={mark.crisp ? "crispEdges" : undefined}
            data-mc-ink={c.state === "empty" ? "band" : "cell"}
            style={
              c.state === "empty"
                ? // no-data: a visible hollow outline — never the invisible 8% band
                  {
                    fill: "none",
                    stroke: "var(--mc-neutral)",
                    strokeOpacity: 0.45,
                    strokeWidth: 0.6,
                  }
                : {
                    // a real zero must read as present-but-lowest, not vanish into
                    // the 0.06 empty-track look (keeps "empty ≠ zero" legible)
                    fillOpacity: c.state === "zero" ? 0.14 : stepOpacity(c.step ?? 0, steps),
                    ...(color && c.state === "value" ? { fill: color } : null),
                  }
            }
          />
        ),
      )}
      {children}
    </Chart>
  );
}
