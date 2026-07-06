"use client";
// Interactive <ActivityGrid> (plan/04 §4, plan/08 T2). The GitHub interaction:
// hover a cell for its value, or roving-focus the grid and walk it in 2-D with
// the arrow keys. The focused cell is ringed and read out through a polite live
// region. Static visual is unchanged; only behavior is layered on.
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { isFiniteValue, type Value } from "../../core/types.js";
import { activityGridGeometry } from "./geometry.js";
import type { ActivityGridProps } from "./index.js";

const LEVELS = 5;
const opacity = (level: number): number =>
  level === 0 ? 0.06 : 0.25 + (level / (LEVELS - 1)) * 0.75;

function summarize(data: readonly Value[], fmt: (n: number) => string): string {
  let sum = 0;
  let count = 0;
  let max = -Infinity;
  for (const v of data) {
    if (!isFiniteValue(v)) continue;
    sum += v;
    count++;
    if (v > max) max = v;
  }
  if (count === 0) return "No activity.";
  return `Total ${fmt(sum)} over ${count} ${count === 1 ? "period" : "periods"}. Busiest ${fmt(max)}.`;
}

export function ActivityGrid(props: ActivityGridProps): React.ReactNode {
  const {
    data,
    layout = "grid",
    cell = 10,
    gap = 2,
    domain,
    color,
    format,
    locale,
    title,
    summary,
    className,
    style,
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
  const fmt = useMemo(
    () =>
      typeof format === "function"
        ? format
        : (n: number) => new Intl.NumberFormat(locale, format).format(n),
    [format, locale],
  );

  const accName =
    summary === false ? undefined : typeof summary === "string" ? summary : summarize(data, fmt);
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

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * w;
      const y = ((e.clientY - r.top) / r.height) * h;
      const col = Math.floor(x / step);
      const row = Math.floor(y / step);
      const i = col * rows + row;
      setActive(i >= 0 && i < geo.cells.length && row < rows ? i : null);
    },
    [w, h, step, rows, geo],
  );

  const activeCell = active !== null ? geo.cells[active] : undefined;
  const readout =
    activeCell === undefined
      ? ""
      : `Period ${activeCell.index + 1}: ${activeCell.value === null ? "no data" : fmt(activeCell.value)}`;

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
      onBlur={() => setActive(null)}
    >
      <svg
        className="mc-root"
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setActive(null)}
      >
        {geo.cells.map((c) => (
          <rect
            key={c.index}
            x={c.x}
            y={c.y}
            width={c.size}
            height={c.size}
            rx={1}
            shapeRendering="crispEdges"
            data-mc-ink="cell"
            style={{ fillOpacity: opacity(c.level), ...(color ? { fill: color } : null) }}
          />
        ))}
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
      </svg>
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
        {readout}
      </span>
      {activeCell ? (
        <span
          className="mc-spark-readout"
          style={{
            position: "absolute",
            left: `${((activeCell.x + activeCell.size / 2) / w) * 100}%`,
            bottom: "100%",
            transform: "translateX(-50%)",
            font: "var(--mc-label-size, 0.75em) var(--mc-font, inherit)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--mc-accent)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {activeCell.value === null ? "—" : fmt(activeCell.value)}
        </span>
      ) : null}
    </span>
  );
}
