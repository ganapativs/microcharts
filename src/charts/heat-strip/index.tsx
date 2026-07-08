// <HeatStrip> — how did intensity evolve, glanceably (plan/22 #9, S1). The 1×N
// sibling of ActivityGrid: discrete color steps per time cell, shared step
// scale + cell vocabulary. Static, hook-free, RSC-safe. Empty ≠ zero: a slot
// with no record renders a hairline outline, visibly different from value 0.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { describeSeries } from "../../core/summary.js";
import type { SeriesStrings } from "../../core/summary.js";
import { makeFormatter } from "../../core/format.js";
import type { Value } from "../../core/types.js";
import { valueStepOpacity, type CellShape } from "../../shared/cell.js";
import { heatStripGeometry } from "./geometry.js";

export interface HeatStripProps {
  data: readonly Value[];
  /** Shared step-scale granularity (default 5). */
  steps?: number | undefined;
  /** Shared cell vocabulary. */
  shape?: CellShape | undefined;
  /** Cross-row calibration (same warning as HeatCell — share one domain). */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: SeriesStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function HeatStrip(props: HeatStripProps): ReactNode {
  const {
    data,
    steps = 5,
    shape = "square",
    domain,
    width = 60,
    height = 10,
    color,
    format,
    locale,
    strings,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = heatStripGeometry({ width, height, values: data, domain, steps, shape });
  const fmt = makeFormatter(format, locale);
  // S1 summary — reuses describeSeries verbatim (docs-as-tests)
  const accName =
    summary === false ? false : (summary ?? describeSeries(data, { format: fmt, strings }));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-heat-strip ${className}` : "mc-heat-strip"}
      style={style}
    >
      {geo.cells.map((c) =>
        c.step === null ? (
          <rect
            key={c.index}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx={c.rx}
            fill="none"
            stroke="var(--mc-band)"
            strokeWidth={0.5}
          />
        ) : (
          <rect
            key={c.index}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx={c.rx}
            shapeRendering={geo.crisp ? "crispEdges" : undefined}
            data-mc-ink="cell"
            style={{
              fillOpacity: valueStepOpacity(c.step, steps),
              ...(color ? { fill: color } : null),
            }}
          />
        ),
      )}
      {children}
    </Chart>
  );
}
