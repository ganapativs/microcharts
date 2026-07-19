"use client";
// Interactive <CalendarStrip>. Hover a day or walk the grid in
// 2-D (←/→ day, ↑/↓ week — ActivityGrid parity); click / Enter / Space selects
// a day (onSelect). Announces the real calendar day: "Tuesday, June 24: 12."
// useActivePicker owns interaction; the SVG is the composed static component.
import { useCallback, useMemo, useRef } from "react";
import {
  makeFormatter,
  makeDateFormatter,
  type DateFormat,
  type Format,
} from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { FILL, useActivePicker, wrap, type PickerProps } from "../../shared/interactive.js";
import { EN_CALENDAR, type CalendarStrings } from "../../core/strings-calendar.js";
import { cellMetrics } from "../../shared/cell.js";
import { calendarStripGeometry } from "./geometry.js";
import {
  CalendarStrip as StaticCalendarStrip,
  calendarEntries,
  calendarStripSummary,
  CALENDAR_CELL,
  CALENDAR_GAP,
  type CalendarStripProps,
} from "./index.js";

export interface InteractiveCalendarStripProps extends CalendarStripProps, PickerProps {
  strings?: CalendarStrings;
  /**
   * Number format for the day's value in the hover/focus readout. Interactive-
   * only: the static summary counts days ("Active 11 of 24 days"), and a count
   * is not a value to format.
   */
  format?: Format;
  /** Announced day label (defaults to weekday + month + day, UTC). */
  dateFormat?: DateFormat;
  /**
   * Opt-in entrance motion (default `false`): cells fade in on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CalendarStrip(props: InteractiveCalendarStripProps): React.ReactNode {
  const {
    data,
    weeks = 4,
    end,
    weekStart = 1,
    steps = 5,
    shape = "square",
    domain,
    cell = CALENDAR_CELL,
    gap = CALENDAR_GAP,
    format,
    locale,
    strings = EN_CALENDAR,
    dateFormat,
    title,
    summary,
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "reveal", animate);

  const endDay = useMemo(() => end ?? new Date(), [end]);
  const geo = useMemo(
    () =>
      calendarStripGeometry({
        weeks,
        end: endDay,
        weekStart,
        entries: calendarEntries(data),
        domain,
        steps,
        cell,
        gap,
      }),
    [weeks, endDay, weekStart, data, domain, steps, cell, gap],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const dateFmt = useMemo(
    () => makeDateFormatter(dateFormat, locale, { weekday: "long", month: "long", day: "numeric" }),
    [dateFormat, locale],
  );

  const pitch = cell + gap;
  // past-or-present cells only (future is blank — not focusable)
  const count = geo ? geo.totalDays : 0;
  const cells = geo?.cells;
  const dayLabelAt = useCallback(
    (i: number): string => {
      const c = cells?.[i];
      return c ? dateFmt(new Date(`${c.date}T00:00:00Z`)) : "";
    },
    [cells, dateFmt],
  );

  // Pointer (viewBox space) → day index by pure grid math; `null` off the
  // 7-column grid or on a future (blank) day.
  const locate = useCallback(
    (x: number, y: number) => {
      const col = Math.floor(x / pitch);
      const row = Math.floor(y / pitch);
      const i = row * 7 + col;
      return col >= 0 && col < 7 && i >= 0 && i < count ? i : null;
    },
    [pitch, count],
  );

  // 2-D roving over the weeks × 7 grid: ←/→ step one DAY (across the week
  // boundary, as a calendar reads), ↑/↓ step one WEEK (±7). A boundary key is
  // consumed (returns the current index) rather than ignored.
  const step = useCallback(
    (cur: number, key: string) => {
      if (count === 0) return null;
      switch (key) {
        case "Home":
          return 0;
        case "End":
          return count - 1;
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowDown":
        case "ArrowUp":
          break;
        default:
          return null;
      }
      if (cur < 0) return 0; // first arrow from nothing lands on the first day
      const d = key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : key === "ArrowDown" ? 7 : -7;
      const next = cur + d;
      return next >= 0 && next < count ? next : cur;
    },
    [count],
  );

  // index = day index in reading order over the weeks × 7 grid (0 = the
  // window's first cell); only past-or-present days are navigable.
  const datum = useCallback(
    (i: number) => ({ index: i, value: cells?.[i]?.value ?? null, label: dayLabelAt(i) }),
    [cells, dayLabelAt],
  );

  const { active, selected, bind } = useActivePicker({
    count,
    width: geo?.width ?? 1,
    height: geo?.height ?? 1,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  if (!geo) return null;

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : calendarStripSummary(geo.activeDays, geo.totalDays, weeks, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const m = cellMetrics(cell, shape);
  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    return (
      <rect
        x={c.x + m.inset - 0.5}
        y={c.y + m.inset - 0.5}
        width={c.size - m.inset * 2 + 1}
        height={c.size - m.inset * 2 + 1}
        rx={m.rx + 0.5}
        fill="none"
        stroke="var(--mc-accent)"
        strokeWidth={1.5}
        data-mc-w={pinned ? "tick" : "support"}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const shown = active ?? selected;
  const shownCell = shown !== null ? geo.cells[shown] : undefined;
  const announced =
    shownCell === undefined || shown === null
      ? ""
      : shownCell.value === null
        ? strings.dayEmpty(dayLabelAt(shown))
        : strings.dayAt(dayLabelAt(shown), fmt(shownCell.value));

  return (
    <span
      ref={hostRef}
      {...wrap("mc-calendar-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      {...bind}
    >
      <StaticCalendarStrip
        {...rest}
        data={data}
        weeks={weeks}
        end={endDay}
        weekStart={weekStart}
        steps={steps}
        shape={shape}
        domain={domain}
        cell={cell}
        gap={gap}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticCalendarStrip>
      <LiveRegion>{announced}</LiveRegion>
      {shownCell && shown !== null ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((shownCell.x + shownCell.size / 2) / geo.width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {shownCell.value === null
            ? `${dayLabelAt(shown)}: —`
            : `${dayLabelAt(shown)}: ${fmt(shownCell.value)}`}
        </span>
      ) : null}
    </span>
  );
}
