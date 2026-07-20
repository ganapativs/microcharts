"use client";
// Interactive <ActivityGrid>. The GitHub interaction: hover/tap a cell for its
// value, or roving-focus the grid and walk it in 2-D with the arrow keys; click
// / Enter / Space selects a cell (onSelect). useActivePicker owns interaction
// (one wrapper listener + pure grid math), composing the static component
// (summary={false}, focus + pin rings as its children) — the SVG never drifts.
import { useCallback, useMemo, useRef } from "react";
import { makeFormatter } from "../../core/format.js";
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
   * Opt-in entrance motion (default `false`): cells fade in on first
   * client-side mount. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function ActivityGrid(props: InteractiveActivityGridProps): React.ReactNode {
  const {
    data,
    layout = "grid",
    shape = "square",
    anchor,
    weekStart = 1,
    cell = 10,
    gap = 2,
    domain,
    format,
    locale,
    title,
    summary,
    strings = EN_ACTIVITY,
    animate = false,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const announce = { ...EN_SERIES, ...EN_SLOTS, ...strings };

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "reveal", animate);

  const rows = layout === "strip" ? 1 : 7;
  const offset = layout === "grid" ? calendarOffset(anchor, weekStart) : 0;
  const geo = useMemo(
    () => activityGridGeometry(data, { rows, cell, gap, levels: LEVELS, domain, offset }),
    [data, rows, cell, gap, domain, offset],
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

  const datum = useCallback(
    (i: number) => ({ index: i, value: geo.cells[i]?.value ?? null }),
    [geo],
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
  const announced =
    shownCell === undefined
      ? ""
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
        domain={domain}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {/* Pinned selection persists through pointer-leave; focus ring is transient. */}
        {selected !== null && selected !== active ? ring(selected, true) : null}
        {active !== null ? ring(active, false) : null}
        {rest.children}
      </StaticActivityGrid>
      <LiveRegion>{announced}</LiveRegion>
      {shownCell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((shownCell.x + shownCell.size / 2) / w) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {shownCell.value === null ? "—" : fmt(shownCell.value)}
        </span>
      ) : null}
    </span>
  );
}
