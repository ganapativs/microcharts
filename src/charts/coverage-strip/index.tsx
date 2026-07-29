// <CoverageStrip> — can I trust this data, where was nothing measured?
// (S1-with-gaps). Measured cells are filled, gaps are hollow with a hairline
// stroke: the distinction between `null` (no measurement) and `0` (a measured
// zero) is the whole chart, and it is carried by SHAPE so it survives
// forced-colors and print. Never interpolates
// across a gap; absence never renders as a zero-value cell.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_COVERAGE, type CoverageStrings } from "../../core/strings-coverage.js";
import { valueStepOpacity, type CellShape } from "../../shared/cell.js";
import type { Value } from "../../core/types.js";
import { labelFitsBand, labelFont } from "../../core/labels.js";
import { COVERAGE_MAX_SLOTS, coverageGeometry, type CoverageStripGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

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
  format?: Format | undefined;
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
  if (expected !== undefined && !Number.isFinite(expected)) {
    devWarn("<CoverageStrip> `expected` must be a finite slot count — ignored; counting the data.");
  }
  if (data.length > COVERAGE_MAX_SLOTS) {
    // silence here would be a lie by omission: the summary states a slot count,
    // and past the cap that count is the drawn window, not the series.
    devWarn(`<CoverageStrip> ${data.length} slots — capped at ${COVERAGE_MAX_SLOTS}.`);
  }

  // label size in viewBox units — ~0.62·height, clamped 7–11 to match the rest
  // of the catalog at any chart size
  const FONT = labelFont(height, 0.62);

  const pctFmt = makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale);
  // Degrade, don't overlap: the percent is centred on the strip's midline, so a
  // box shorter than one em puts its em-box past the viewBox edge. Drop it below
  // that, and the gutter with it — `coverageGeometry` hangs the gutter off the
  // RIGHT of a cell band that always starts at x=0, so the cells are identical
  // whether or not the number is drawn and the strip never reflows.
  const showLabel = label === "percent" && labelFitsBand(height, FONT);
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

  const accName = resolveSummary(summary, () => coverageSummary(geo, pctFmt, strings));
  // pin the label size to viewBox units (the shared 0.75em default is ambient —
  // it would render labels ~2× and break the reserved gutter).
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;
  // a custom `color` must be inline STYLE: the "cell" role rule would override
  // a fill attribute. ONE shared object — never allocated per cell (SSR path).
  const customFill = color ? { fill: color } : undefined;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A ruler of present/absent slots — presence is fill, never height, so no
      // edge is a floor. The percent gutter only widens the box, and the cell
      // band stays centred in the height, so the box height is the seat.
      seat={{ mode: "center", top: 0, bottom: height }}
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
            // geo.steps, never the raw prop: a non-finite `steps` binned every
            // cell to fill-opacity="NaN" while the geometry had already fallen
            // back to 5. Announced ramp and painted ramp are one ramp.
            fillOpacity={
              mode === "intensity" && c.step !== null ? valueStepOpacity(c.step, geo.steps) : 1
            }
            style={customFill}
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
        >
          {pctFmt(geo.coverage)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
