// <CohortTriangle> — which vintage retains worst, compared at equal maturity
// Rows are cohorts (input order top→bottom). columns are age; each
// cell is shaded by a discrete retention level. The ragged trailing edge is the
// classic retention triangle: newer cohorts have simply been observed for fewer
// ages. Color is approximate by design, so the
// per-cell number lives in the accessible summary + interactive readout, never
// on the static cell (unmeasurable + too dense).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { valueStepOpacity } from "../../shared/cell.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { resolveSummary } from "../../core/summary.js";
import {
  EN_COHORT_TRIANGLE,
  type CohortTriangleStrings,
} from "../../core/strings-cohort-triangle.js";
import {
  cohortTriangleGeometry,
  LEVELS,
  MAX_AGES,
  MAX_COHORTS,
  PCT_FORMAT,
  type CohortRow,
  type CohortTriangleGeometry,
} from "./geometry.js";

export type { CohortRow } from "./geometry.js";

/** Opacity ramp per discrete retention level — the shared value-cell ramp
 *  (0.25 → 1), so a real bottom-of-scale reading never vanishes into the
 *  empty-track look reserved for gaps. */
export const levelOpacity = (level: number): number => valueStepOpacity(level, LEVELS);

/** Cohort count, worst vintage at equal maturity, newest first reading. */
export function cohortTriangleSummary(
  geo: CohortTriangleGeometry,
  strings: CohortTriangleStrings,
  fmt: (n: number) => string,
  unit: string,
): string {
  if (geo.rows === 0 || geo.newestFirst === null) return strings.noData;
  if (geo.rows >= 2 && geo.worst) {
    return strings.cohortTriangle(
      geo.rows,
      unit,
      geo.worst.label,
      geo.worst.age,
      fmt(geo.worst.value),
      geo.newestFirst.label,
      fmt(geo.newestFirst.value),
    );
  }
  return strings.cohortTriangleShort(geo.rows, geo.newestFirst.label, fmt(geo.newestFirst.value));
}

export interface CohortTriangleProps {
  /** One row per cohort, `values[i]` = retention at age i (0–1 or 0–100). */
  data: readonly CohortRow[];
  /** Cell edge length in viewBox units. */
  cell?: number | undefined;
  gap?: number | undefined;
  /** Place cohort labels in a left gutter (default true; seat-gated by cell). */
  labels?: boolean | undefined;
  /** Cohort label to ring — the equal-maturity comparison focus. */
  highlight?: string | undefined;
  /** Age-column noun for the summary (default "period"). */
  unit?: string | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: CohortTriangleStrings | undefined;
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function CohortTriangle(props: CohortTriangleProps): ReactNode {
  const {
    data,
    cell = 9,
    gap = 2,
    labels = true,
    highlight,
    unit = "period",
    color,
    format = PCT_FORMAT,
    locale,
    strings = EN_COHORT_TRIANGLE,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > MAX_COHORTS || data.some((r) => r.values.length > MAX_AGES)) {
    devWarn(`<CohortTriangle>: caps ${MAX_COHORTS}×${MAX_AGES}, extra dropped.`);
  }

  const geo = cohortTriangleGeometry(data, { cell, gap, labels, highlight, labelSize });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => cohortTriangleSummary(geo, strings, fmt, unit));

  const w = Math.max(geo.width, 1);
  const h = Math.max(geo.height, 1);
  const rootStyle = { ...style, "--mc-label-px": `${geo.fontSize}px` } as CSSProperties;
  const cellFill = color ? ({ fill: color } as CSSProperties) : undefined;

  return (
    <Chart
      width={w}
      height={h}
      title={title}
      summary={accName}
      id={id}
      // Rows are cohorts, so the bottom edge is the newest vintage rather than a
      // zero line — centre the block. `labels` only opens a LEFT gutter, which
      // never moves the vertical box, so one seat covers both label modes.
      seat={{ mode: "center", top: 0, bottom: h }}
      className={className ? `mc-cohort ${className}` : "mc-cohort"}
      style={rootStyle}
    >
      {geo.cells.map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          // the RESOLVED cell edge, never the raw prop: a `cell` the geometry
          // repaired but the mark did not painted rects the grid never spaced.
          width={geo.cell}
          height={geo.cell}
          rx={1}
          shapeRendering="crispEdges"
          data-mc-ink={c.gap ? "gap" : "cell"}
          fillOpacity={c.gap ? undefined : levelOpacity(c.level)}
          style={!c.gap ? cellFill : undefined}
        />
      ))}
      {geo.labels.map((l) => (
        <text
          key={l.row}
          x={l.x}
          y={l.y}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={geo.fontSize}
          data-mc-ink="label"
        >
          {l.label}
        </text>
      ))}
      {geo.ring ? (
        <rect
          x={geo.ring.x}
          y={geo.ring.y}
          width={geo.ring.width}
          height={geo.ring.height}
          rx={1.5}
          fill="none"
          stroke="var(--mc-accent)"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {children}
    </Chart>
  );
}
