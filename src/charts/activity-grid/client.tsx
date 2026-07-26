"use client";
// Interactive <ActivityGrid>. The GitHub interaction: hover/tap a cell for its
// value, or roving-focus the grid and walk it in 2-D with the arrow keys; click
// / Enter / Space selects a cell (onSelect). useActivePicker owns interaction
// (summary={false}, focus + pin rings as its children) — the SVG never drifts.
import { useCallback, useMemo, useRef } from "react";
import { makeDateFormatter, makeFormatter } from "../../core/format.js";
import { parseUTCDay } from "../../core/calendar.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_SERIES, type SeriesStrings } from "../../core/summary.js";
import { EN_ACTIVITY, type ActivityStrings } from "../../core/strings-activity.js";
import { EN_SLOTS, type SlotStrings } from "../../core/strings-slots.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  crosshairReadoutStyle,
  type PickerProps,
} from "../../shared/interactive.js";
import { activityGridGeometry } from "./geometry.js";
import {
  ActivityGrid as StaticActivityGrid,
  activitySummary,
  calendarOffset,
  cellMetrics,
  LEVELS,
  type ActivityGridProps,
} from "./index.js";

export interface InteractiveActivityGridProps extends ActivityGridProps, PickerProps {
  /** Swappable announcement strings (defaults to EN). Interactive adds series/slot templates. */
  strings?: ActivityStrings & Partial<SeriesStrings & SlotStrings>;
  /**
   * Opt-in entrance motion (default `false`): cells fade in, staggered, on first
   * client-side mount. Past 80 cells the grid reveals with one left-to-right
   * wipe instead — a year of days is 365 cells, so that is what the DEFAULT
   * `weeks` renders, and a short `layout="strip"` is what gets the per-cell
   * cascade. The cap is the engine's, and deliberate: 365 simultaneous animation
   * tracks cost more than the cascade is worth, and at that density a per-cell
   * stagger reads as noise rather than as counting. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

const ANNOUNCE_BASE = { ...EN_SERIES, ...EN_SLOTS };
const DAY_MS = 86_400_000;

export function ActivityGrid(props: InteractiveActivityGridProps): React.ReactNode {
  const {
    data,
    layout = "grid",
    shape = "square",
    anchor,
    weekStart = 1,
    cell = 10,
    gap = 2,
    steps = LEVELS,
    domain,
    format,
    locale,
    title,
    summary,
    strings = EN_ACTIVITY,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  // Base hoisted to module scope and the merge memoised: this allocated a
  // ~60-key object on every render, including every hovered cell of a 365-cell
  // grid. (Siblings that take no override just use a module-level constant.)
  const announce = useMemo(() => ({ ...ANNOUNCE_BASE, ...strings }), [strings]);

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "reveal", animate);

  const rows = layout === "strip" ? 1 : 7;
  const offset = layout === "grid" ? calendarOffset(anchor, weekStart) : 0;
  const geo = useMemo(
    () => activityGridGeometry(data, { rows, cell, gap, levels: steps, domain, offset }),
    [data, rows, cell, gap, steps, domain, offset],
  );
  const stepPx = cell + gap;
  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  // Pointer (viewBox space) → cell index by pure grid math.
  const locate = useCallback(
    (x: number, y: number) => {
      const col = Math.floor(x / stepPx);
      const row = Math.floor(y / stepPx);
      const i = col * rows + row - offset;
      return row >= 0 && row < rows && i >= 0 && i < geo.cells.length ? i : null;
    },
    [stepPx, rows, offset, geo],
  );

  // 2-D roving: walk in SLOT space (data index + calendar offset), so a padded
  // first column still walks like the grid the reader sees. Boundary keys are
  // consumed (return the current index) rather than ignored.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = geo.cells.length;
      if (n === 0) return null;
      if (key === "Home") return 0;
      if (key === "End") return n - 1;
      // Nothing active yet: the first arrow lands on cell 0 (kernel contract).
      const first = cur < 0;
      const c = first ? 0 : cur;
      const slot = c + offset;
      const col = Math.floor(slot / rows);
      const row = slot % rows;
      const clamp = (i: number) => (i >= 0 && i < n ? i : null);
      let next: number;
      switch (key) {
        case "ArrowDown":
          next = row < rows - 1 ? (clamp(c + 1) ?? c) : c;
          break;
        case "ArrowUp":
          next = row > 0 ? (clamp(c - 1) ?? c) : c;
          break;
        case "ArrowRight":
          next = clamp((col + 1) * rows + row - offset) ?? c;
          break;
        case "ArrowLeft":
          next = clamp((col - 1) * rows + row - offset) ?? c;
          break;
        default:
          return null;
      }
      return first ? 0 : next;
    },
    [rows, offset, geo],
  );

  // When `anchor` dates the grid, every cell IS a calendar day and the day is
  // knowable — so the readout says which one, exactly as CalendarStrip does.
  // Undated grids stay positional: there is no date to withhold, and the
  // crosshair already shows the reader which cell they are on.
  const dateFmt = useMemo(
    () => makeDateFormatter(undefined, locale, { month: "short", day: "numeric" }),
    [locale],
  );
  const anchorMs = useMemo(() => (anchor === undefined ? null : parseUTCDay(anchor)), [anchor]);
  const dayLabelAt = useCallback(
    (i: number): string | null =>
      anchorMs === null ? null : dateFmt(new Date(anchorMs + i * DAY_MS)),
    [anchorMs, dateFmt],
  );

  const datum = useCallback(
    (i: number) => {
      const v = geo.cells[i]?.value ?? null;
      const day = dayLabelAt(i);
      const shownValue = v === null ? "—" : fmt(v);
      return {
        index: i,
        value: v,
        ...(day === null ? null : { label: day }),
        formatted: day === null ? shownValue : `${day}: ${shownValue}`,
      };
    },
    [geo, fmt, dayLabelAt],
  );

  const { active, selected, bind } = useActivePicker({
    count: geo.cells.length,
    width: w,
    height: h,
    locate,
    step,
    datum,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : activitySummary(data, fmt, strings);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const ring = (i: number, pinned: boolean) => {
    const c = geo.cells[i];
    if (!c) return null;
    // ring hugs the drawn mark, not the slot — shapes stay aligned
    const m = cellMetrics(cell, shape);
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
  const shownDay = shown !== null ? dayLabelAt(shown) : null;
  const announced =
    shownCell === undefined
      ? ""
      : shownDay !== null
        ? shownCell.value === null
          ? announce.dayEmpty(shownDay)
          : announce.dayAt(shownDay, fmt(shownCell.value))
        : shownCell.value === null
          ? announce.pointEmpty(shownCell.index + 1, geo.cells.length)
          : announce.point(shownCell.index + 1, geo.cells.length, fmt(shownCell.value));

  return (
    <span
      ref={hostRef}
      {...wrap("mc-activity-interactive", className, style)}
      {...named(label)}
      {...bind}
    >
      <StaticActivityGrid
        {...rest}
        style={fillFor(style)}
        data={data}
        layout={layout}
        shape={shape}
        anchor={anchor}
        weekStart={weekStart}
        cell={cell}
        gap={gap}
        steps={steps}
        domain={domain}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticActivityGrid>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shownCell ? (
        <span
          className="mc-spark-readout"
          style={crosshairReadoutStyle(shownCell.x + shownCell.size / 2, w)}
        >
          {`${shownDay === null ? "" : `${shownDay}: `}${shownCell.value === null ? "—" : fmt(shownCell.value)}`}
        </span>
      ) : null}
    </span>
  );
}
