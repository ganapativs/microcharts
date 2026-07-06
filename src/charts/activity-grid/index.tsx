// <ActivityGrid> — intensity calendar (plan/05 §3, S1 binned). GitHub's
// contribution graph, the proof that color-encodes-a-variable. Static, hook-free,
// RSC-safe. Discrete levels (not a continuous ramp). The per-cell reading is the
// accessible summary + (opt-in) interactive tooltip; the static grid never shows
// per-cell numbers (unmeasurable + too dense) — a documented limitation (plan/18).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { seriesStats } from "../../core/stats.js";
import { type Value } from "../../core/types.js";
import { activityGridGeometry } from "./geometry.js";

const LEVELS = 5;

/** Factual S1-binned summary — total, span, and the busiest bin. */
function activitySummary(data: readonly Value[], fmt: (n: number) => string): string {
  const s = seriesStats(data);
  if (!s) return "No activity.";
  return `Total ${fmt(s.sum)} over ${s.count} ${s.count === 1 ? "period" : "periods"}. Busiest ${fmt(s.max)}.`;
}

export interface ActivityGridProps {
  data: readonly Value[];
  /** `"grid"` (7 rows, default) or `"strip"` (1 row). */
  layout?: "grid" | "strip";
  /** Cell edge length in viewBox units. */
  cell?: number;
  gap?: number;
  /** Explicit `[min, max]` for level bucketing; auto-fit when omitted. */
  domain?: readonly [number, number];
  color?: string;
  format?: Intl.NumberFormatOptions | ((n: number) => string);
  locale?: string | string[];
  title?: string;
  summary?: string | false;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function ActivityGrid(props: ActivityGridProps): ReactNode {
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
    id,
    className,
    style,
    children,
  } = props;

  const geo = activityGridGeometry(data, {
    rows: layout === "strip" ? 1 : 7,
    cell,
    gap,
    levels: LEVELS,
    domain,
  });
  const fmt =
    typeof format === "function"
      ? format
      : (n: number) => new Intl.NumberFormat(locale, format).format(n);
  const accName = summary === false ? false : (summary ?? activitySummary(data, fmt));

  // Opacity ramp per discrete level (level 0 = faint empty track).
  const opacity = (level: number): number =>
    level === 0 ? 0.06 : 0.25 + (level / (LEVELS - 1)) * 0.75;

  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);

  return (
    <Chart
      width={w}
      height={h}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-activity ${className}` : "mc-activity"}
      style={style}
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
      {children}
    </Chart>
  );
}
