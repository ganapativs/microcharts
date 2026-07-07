"use client";
// Interactive <ActivityGrid> (plan/04 §4, plan/08 T2). The GitHub interaction:
// hover a cell for its value, or roving-focus the grid and walk it in 2-D with
// the arrow keys. Follows the CANONICAL INTERACTIVE PATTERN (CLAUDE.md):
// composes the static component (summary={false}, focus ring as its child),
// one pointer listener on the wrapper, announcements via SummaryStrings.
import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN, type SummaryStrings } from "../../core/summary.js";
import { activityGridGeometry } from "./geometry.js";
import {
  ActivityGrid as StaticActivityGrid,
  activitySummary,
  LEVELS,
  type ActivityGridProps,
} from "./index.js";

export interface InteractiveActivityGridProps extends ActivityGridProps {
  /** Swappable announcement strings (defaults to EN). */
  strings?: SummaryStrings;
}

export function ActivityGrid(props: InteractiveActivityGridProps): React.ReactNode {
  const {
    data,
    layout = "grid",
    cell = 10,
    gap = 2,
    domain,
    format,
    locale,
    title,
    summary,
    strings = EN,
    className,
    style,
    ...rest
  } = props;

  const rows = layout === "strip" ? 1 : 7;
  const geo = useMemo(
    () => activityGridGeometry(data, { rows, cell, gap, levels: LEVELS, domain }),
    [data, rows, cell, gap, domain],
  );
  const step = cell + gap;
  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);

  const [active, setActive] = useState<number | null>(null);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : activitySummary(data, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const clampIndex = useCallback((i: number) => (i >= 0 && i < geo.cells.length ? i : null), [geo]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.cells.length === 0) return;
      const cur = active ?? 0;
      const col = Math.floor(cur / rows);
      const row = cur % rows;
      let next: number | null = cur;
      switch (e.key) {
        case "ArrowDown":
          next = row < rows - 1 ? clampIndex(cur + 1) : cur;
          break;
        case "ArrowUp":
          next = row > 0 ? cur - 1 : cur;
          break;
        case "ArrowRight":
          next = clampIndex((col + 1) * rows + row) ?? cur;
          break;
        case "ArrowLeft":
          next = col > 0 ? col * rows + row - rows : cur;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = geo.cells.length - 1;
          break;
        case "Escape":
          setActive(null);
          return;
        default:
          return;
      }
      e.preventDefault();
      setActive(next);
    },
    [active, rows, geo, clampIndex],
  );

  // ONE listener on the wrapper; cell lookup is pure grid math.
  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const x = ((e.clientX - r.left) / r.width) * w;
      const y = ((e.clientY - r.top) / r.height) * h;
      const col = Math.floor(x / step);
      const row = Math.floor(y / step);
      const i = col * rows + row;
      setActive(row >= 0 && row < rows && i >= 0 && i < geo.cells.length ? i : null);
    },
    [w, h, step, rows, geo],
  );

  const activeCell = active !== null ? geo.cells[active] : undefined;
  const announced =
    activeCell === undefined
      ? ""
      : strings.point(
          activeCell.index + 1,
          geo.cells.length,
          activeCell.value === null ? strings.noData : fmt(activeCell.value),
        );

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      className={className ? `mc-activity-interactive ${className}` : "mc-activity-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onBlur={() => setActive(null)}
    >
      <StaticActivityGrid
        {...rest}
        data={data}
        layout={layout}
        cell={cell}
        gap={gap}
        domain={domain}
        format={format}
        locale={locale}
        summary={false}
      >
        {activeCell ? (
          <rect
            x={activeCell.x - 0.5}
            y={activeCell.y - 0.5}
            width={activeCell.size + 1}
            height={activeCell.size + 1}
            rx={1.5}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticActivityGrid>
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announced}
      </span>
      {activeCell ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${((activeCell.x + activeCell.size / 2) / w) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {activeCell.value === null ? "—" : fmt(activeCell.value)}
        </span>
      ) : null}
    </span>
  );
}
