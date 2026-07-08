// <ActivityGrid> — intensity calendar (plan/05 §3, S1 binned). GitHub's
// contribution graph, the proof that color-encodes-a-variable. Static, hook-free,
// RSC-safe. Discrete levels (not a continuous ramp). The per-cell reading is the
// accessible summary + (opt-in) interactive tooltip; the static grid never shows
// per-cell numbers (unmeasurable + too dense) — a documented limitation (plan/18).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { seriesStats } from "../../core/stats.js";
import { round2, type Value } from "../../core/types.js";
import { makeFormatter } from "../../core/format.js";
import { parseUTCDay } from "../../core/calendar.js";
import { activityGridGeometry } from "./geometry.js";

export const LEVELS = 5;

/** Opacity ramp per discrete level (level 0 = faint empty track). Shared with
 *  the interactive entry so the visuals cannot drift. */
export const levelOpacity = (level: number): number =>
  level === 0 ? 0.06 : 0.25 + (level / (LEVELS - 1)) * 0.75;

export type CellShape = "square" | "round" | "dot";

/** Cell mark metrics per shape — shared with the interactive entry's focus
 *  ring so overlay and mark cannot drift. `crisp` only on rectilinear marks
 *  (canon: crispEdges never on curves). */
export function cellMetrics(
  size: number,
  shape: CellShape,
): { inset: number; rx: number; crisp: boolean } {
  if (shape === "dot") {
    const inset = round2(Math.max(0.5, size * 0.15));
    return { inset, rx: round2((size - inset * 2) / 2), crisp: false };
  }
  if (shape === "round") return { inset: 0, rx: round2(size * 0.3), crisp: false };
  return { inset: 0, rx: 1, crisp: true };
}

/** Leading empty slots so slot 0 lands on `start`'s real weekday (UTC — via
 *  core/calendar; unparseable dates align to 0, matching the no-start layout). */
export function calendarOffset(start: string | Date | undefined, weekStart: 0 | 1): number {
  if (start === undefined) return 0;
  const t = parseUTCDay(start);
  if (t === null) return 0;
  return (new Date(t).getUTCDay() - weekStart + 7) % 7;
}

/** Factual S1-binned summary — total, span, and the busiest bin. Shared with
 *  the interactive entry (one wording, no drift). */
export function activitySummary(data: readonly Value[], fmt: (n: number) => string): string {
  const s = seriesStats(data);
  if (!s) return "No activity.";
  return `Total ${fmt(s.sum)} over ${s.count} ${s.count === 1 ? "period" : "periods"}. Busiest ${fmt(s.max)}.`;
}

export interface ActivityGridProps {
  data: readonly Value[];
  /** `"grid"` (7 rows, default) or `"strip"` (1 row). */
  layout?: "grid" | "strip" | undefined;
  /** Cell mark: crisp square (default), soft `"round"`, or padded `"dot"`. */
  shape?: CellShape | undefined;
  /** First slot's calendar day — pads the first column so weekday rows align
   *  (grid layout only). ISO `yyyy-mm-dd` or Date, UTC. */
  start?: string | Date | undefined;
  /** Locale start-of-week for `start` alignment (0 = Sunday, 1 = Monday). */
  weekStart?: 0 | 1 | undefined;
  /** Cell edge length in viewBox units. */
  cell?: number | undefined;
  gap?: number | undefined;
  /** Explicit `[min, max]` for level bucketing; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function ActivityGrid(props: ActivityGridProps): ReactNode {
  const {
    data,
    layout = "grid",
    shape = "square",
    start,
    weekStart = 1,
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
    offset: layout === "grid" ? calendarOffset(start, weekStart) : 0,
  });
  const mark = cellMetrics(cell, shape);
  const fmt = makeFormatter(format, locale);
  const accName = summary === false ? false : (summary ?? activitySummary(data, fmt));

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
          x={c.x + mark.inset}
          y={c.y + mark.inset}
          width={c.size - mark.inset * 2}
          height={c.size - mark.inset * 2}
          rx={mark.rx}
          shapeRendering={mark.crisp ? "crispEdges" : undefined}
          data-mc-ink="cell"
          style={{ fillOpacity: levelOpacity(c.level), ...(color ? { fill: color } : null) }}
        />
      ))}
      {children}
    </Chart>
  );
}
