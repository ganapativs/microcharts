"use client";
// Interactive <CalendarStrip>. Hover a day or walk the grid in
// 2-D (←/→ day, ↑/↓ week — ActivityGrid parity). Announces the real calendar
// day: "Tuesday, June 24: 12." Composes the static component (canon).
import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter, makeDateFormatter, type DateFormat } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { FILL } from "../../shared/interactive.js";
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

export interface InteractiveCalendarStripProps extends CalendarStripProps {
  strings?: CalendarStrings;
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
  const [active, setActive] = useState<number | null>(null);
  if (!geo) return null;

  const step = cell + gap;
  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : calendarStripSummary(geo.activeDays, geo.totalDays, weeks, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // past-or-present cells only (future is blank — not focusable)
  const lastIndex = geo.totalDays - 1;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (lastIndex < 0) return;
    const cur = active ?? 0;
    let next = cur;
    switch (e.key) {
      case "ArrowRight":
        next = Math.min(lastIndex, cur + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, cur - 1);
        break;
      case "ArrowDown":
        next = Math.min(lastIndex, cur + 7);
        break;
      case "ArrowUp":
        next = Math.max(0, cur - 7);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = lastIndex;
        break;
      case "Escape":
        setActive(null);
        return;
      default:
        return;
    }
    e.preventDefault();
    setActive(next);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const x = ((e.clientX - r.left) / r.width) * geo.width;
    const y = ((e.clientY - r.top) / r.height) * geo.height;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    const i = row * 7 + col;
    setActive(col >= 0 && col < 7 && i >= 0 && i <= lastIndex ? i : null);
  };

  const activeCell = active !== null ? geo.cells[active] : undefined;
  const dayLabel = activeCell ? dateFmt(new Date(`${activeCell.date}T00:00:00Z`)) : "";
  const announced =
    activeCell === undefined
      ? ""
      : activeCell.value === null
        ? strings.dayEmpty(dayLabel)
        : strings.dayAt(dayLabel, fmt(activeCell.value));

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-calendar-live ${className}` : "mc-calendar-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
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
        {activeCell
          ? (() => {
              const m = cellMetrics(cell, shape);
              return (
                <rect
                  x={activeCell.x + m.inset - 0.5}
                  y={activeCell.y + m.inset - 0.5}
                  width={activeCell.size - m.inset * 2 + 1}
                  height={activeCell.size - m.inset * 2 + 1}
                  rx={m.rx + 0.5}
                  fill="none"
                  stroke="var(--mc-accent)"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })()
          : null}
        {rest.children}
      </StaticCalendarStrip>
      <LiveRegion>{announced}</LiveRegion>
      {activeCell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((activeCell.x + activeCell.size / 2) / geo.width) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {activeCell.value === null ? "—" : fmt(activeCell.value)}
        </span>
      ) : null}
    </span>
  );
}
