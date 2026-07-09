// <CoverageStrip> — can I trust this data, where was nothing measured? (plan/23
// #1, S1-with-gaps). Measured cells are filled, gaps are hollow with a hairline
// stroke: the distinction between `null` (no measurement) and `0` (a measured
// zero) is the whole chart, and it is carried by SHAPE so it survives
// forced-colors and print. Static, hook-free, RSC-safe. Never interpolates
// across a gap; absence never renders as a zero-value cell.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_COVERAGE, type CoverageStrings } from "../../core/strings-coverage.js";
import { valueStepOpacity, type CellShape } from "../../shared/cell.js";
import type { Value } from "../../core/types.js";
import { coverageGeometry, type CoverageStripGeometry } from "./geometry.js";

/** Factual coverage summary. Shared with the interactive entry. */
export function coverageSummary(
  geo: CoverageStripGeometry,
  pctFmt: (n: number) => string,
  strings: CoverageStrings,
): string {
  if (geo.expected === 0) return strings.noData;
  return strings.coverage(geo.measured, geo.expected, pctFmt(geo.coverage), geo.longestGap);
}

export interface CoverageStripProps {
  /** Time-ordered slots; `null` = no measurement, `0` = a measured zero. */
  data: readonly Value[];
  /** Total slots the window should contain (default `data.length`). */
  expected?: number | undefined;
  /** `"binary"` presence (default) | `"intensity"` shades measured cells by value. */
  mode?: "binary" | "intensity" | undefined;
  /** Intensity granularity (default 5). */
  steps?: number | undefined;
  /** Intensity calibration — share one domain across rows. */
  domain?: readonly [number, number] | undefined;
  /** Shared cell vocabulary. */
  shape?: CellShape | undefined;
  /** `"percent"` states the coverage number in a right gutter. */
  label?: "percent" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  /** Formats measured values in the interactive announce. */
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: CoverageStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function CoverageStrip(props: CoverageStripProps): ReactNode {
  const {
    data,
    expected,
    mode = "binary",
    steps = 5,
    domain,
    shape = "square",
    label = "none",
    width = 80,
    height = 10,
    color,
    locale,
    strings = EN_COVERAGE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (expected !== undefined && data.length > expected) {
    devWarn("<CoverageStrip> data longer than `expected` — expected clamped up to data length.");
  }

  // label size in viewBox units — ~0.62·height, clamped 7–11 to match the rest
  // of the catalog at any chart size (plan/12: labels are chart-proportional)
  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.62)));

  const pctFmt = makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale);
  const showLabel = label === "percent";
  const geo = coverageGeometry({
    width,
    height,
    data,
    expected,
    mode,
    steps,
    domain,
    shape,
    gutterCh: showLabel ? 4 : 0,
    fontSize: FONT,
  });

  const accName = summary === false ? false : (summary ?? coverageSummary(geo, pctFmt, strings));
  // pin the label size to viewBox units (the shared 0.75em default is ambient —
  // it would render labels ~2× and break the reserved gutter). plan/12.
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-coverage-strip ${className}` : "mc-coverage-strip"}
      style={rootStyle}
    >
      {geo.cells.map((c) =>
        c.present ? (
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
              fillOpacity:
                mode === "intensity" && c.step !== null ? valueStepOpacity(c.step, steps) : 1,
              ...(color ? { fill: color } : null),
            }}
          />
        ) : (
          // an EMPTY slot, not a void: a faint track fill + a hairline outline
          // so it reads as "measured nothing here". Coloring lives in the "gap"
          // ink-role rule (styles.css) so forced-colors can remap it.
          <rect
            key={c.index}
            x={c.x}
            y={c.y}
            width={c.w}
            height={c.h}
            rx={c.rx}
            data-mc-ink="gap"
          />
        ),
      )}
      {showLabel && geo.expected > 0 ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="end"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pctFmt(geo.coverage)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
