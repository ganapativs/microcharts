// <ActivityGrid> — intensity calendar. GitHub's
// contribution graph, the proof that color-encodes-a-variable. Static, hook-free,
// RSC-safe. Discrete levels (not a continuous ramp). The per-cell reading is the
// accessible summary + (opt-in) interactive tooltip; the static grid never shows
// per-cell numbers (unmeasurable + too dense) — a documented limitation.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { seriesStats } from "../../core/stats.js";
import type { Value } from "../../core/types.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { parseUTCDay } from "../../core/calendar.js";
import { EN_ACTIVITY, type ActivityStrings } from "../../core/strings-activity.js";
import { cellMetrics, stepOpacity, type CellShape } from "../../shared/cell.js";
import { activityGridGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Default intensity steps, including the zero track — GitHub-like. */
export const LEVELS = 5;

/** Opacity ramp per discrete level — the shared stepped-color ramp
 *  (shared/cell.ts), at the DEFAULT step count. A chart instance that sets
 *  `steps` calls `stepOpacity(level, steps)` directly; this stays for the
 *  callers (docs previews, the registry) that paint at the default. */
export const levelOpacity = (level: number): number => stepOpacity(level, LEVELS);

export { cellMetrics, type CellShape } from "../../shared/cell.js";

/** Leading empty slots so slot 0 lands on `anchor`'s real weekday (UTC — via
 *  core/calendar; unparseable dates align to 0, matching the no-anchor layout). */
export function calendarOffset(anchor: string | Date | undefined, weekStart: 0 | 1): number {
  if (anchor === undefined) return 0;
  const t = parseUTCDay(anchor);
  if (t === null) return 0;
  return (new Date(t).getUTCDay() - weekStart + 7) % 7;
}

/** Total, span, and busiest bin. */
export function activitySummary(
  data: readonly Value[],
  fmt: (n: number) => string,
  strings: ActivityStrings = EN_ACTIVITY,
): string {
  const s = seriesStats(data);
  if (!s) return strings.noActivity;
  return strings.activityGrid(fmt(s.sum), s.count, fmt(s.max));
}

export interface ActivityGridProps {
  data: readonly Value[];
  /** `"grid"` (7 rows, default) or `"strip"` (1 row). */
  layout?: "grid" | "strip" | undefined;
  /** Cell mark: crisp square (default), soft `"round"`, or padded `"dot"`. */
  shape?: CellShape | undefined;
  /** First slot's calendar day — pads the first column so weekday rows align
   *  (grid layout only). ISO `yyyy-mm-dd` or Date, UTC. */
  anchor?: string | Date | undefined;
  /** Locale start-of-week for `anchor` alignment (0 = Sunday, 1 = Monday). */
  weekStart?: 0 | 1 | undefined;
  /** Cell edge length in viewBox units. */
  cell?: number | undefined;
  gap?: number | undefined;
  /** Intensity steps including the zero track. */
  steps?: number | undefined;
  /** Explicit `[min, max]` for level bucketing; auto-fit when omitted. */
  domain?: readonly [number, number] | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ActivityStrings | undefined;
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
    anchor,
    weekStart = 1,
    cell = 10,
    gap = 2,
    steps = LEVELS,
    domain,
    color,
    format,
    locale,
    strings = EN_ACTIVITY,
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
    levels: steps,
    domain,
    offset: layout === "grid" ? calendarOffset(anchor, weekStart) : 0,
  });
  const mark = cellMetrics(cell, shape);
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => activitySummary(data, fmt, strings));

  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);
  const cellFill = color ? ({ fill: color } as CSSProperties) : undefined;

  return (
    <Chart
      width={w}
      height={h}
      title={title}
      summary={accName}
      id={id}
      // The bottom row is the last weekday, not a zero line — a cell block has
      // no floor to stand on, so it centres on the cap band. The viewBox is the
      // grid exactly (no label gutters), so the box is the whole frame.
      seat={{ mode: "center", top: 0, bottom: h }}
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
          fillOpacity={stepOpacity(c.level, steps)}
          style={cellFill}
        />
      ))}
      {children}
    </Chart>
  );
}
