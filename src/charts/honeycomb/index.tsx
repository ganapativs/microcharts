// <Honeycomb> — how many of the available slots are taken.
// Occupancy of capacity in an area-filling hex grid: units are countable (total
// ≤ 60). Two merged <path> nodes (filled + empty) keep the node count O(1). Fill
// order is row-major from the top-left (occupancy reads as a sweep).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_HONEYCOMB, type HoneycombStrings } from "../../core/strings-honeycomb.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { devWarn } from "../../core/dev.js";
import type { EmptyCellStyle } from "../../core/types.js";
import { honeycombGeometry, resolveTotal, resolveValue } from "./geometry.js";

export interface HoneycombProps {
  /** Filled count (fractional rounds; the summary keeps the true value). */
  value: number;
  /** Capacity (cell count). Default 10. */
  total?: number | undefined;
  /** Rows: a number, or `auto` (near-square). `1` = a strip. */
  rows?: number | "auto" | undefined;
  /** Empty cells: `"outline"` (default hairline ring) or `"blank"` (nothing
   * drawn — GardenGrid's pattern). Shared `EmptyCellStyle`. */
  empty?: EmptyCellStyle | undefined;
  /** Noun for the summary (e.g. "seats"). */
  unit?: string | undefined;
  /** `"count"` / `"percent"` centers a readout when the comb has room. */
  label?: "none" | "count" | "percent" | undefined;
  /** Hex outer radius (circumradius) in viewBox units. Default 4. */
  cell?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: HoneycombStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function honeycombSummary(
  value: number,
  opts: {
    total?: number | undefined;
    unit?: string | undefined;
    strings?: HoneycombStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { unit = "", strings = EN_HONEYCOMB, format, locale } = opts;
  // Same resolvers the comb is laid out on — the announced capacity and the
  // painted one are the same number, whatever the host passed.
  const total = resolveTotal(opts.total);
  if (total <= 0) return strings.noData;
  const fmt = makeFormatter(format, locale);
  return strings.honeycomb(fmt(resolveValue(value)), fmt(total), unit);
}

export function Honeycomb(props: HoneycombProps): ReactNode {
  const {
    value,
    total = 10,
    rows = "auto",
    empty = "outline",
    unit = "",
    cell = 4,
    label = "none",
    color,
    format,
    locale,
    strings = EN_HONEYCOMB,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // Resolve once, up front: the comb, the centred label, and the accessible name
  // all have to read the same capacity and count.
  const cap = resolveTotal(total);
  const filled = resolveValue(value);

  if (cap > 60) devWarn("<Honeycomb> over 60 cells stops being countable — use Progress.");

  const geo = honeycombGeometry({ total: cap, value: filled, rows, cellR: cell, pad: PAD });
  let labelText: string | undefined;
  let fontSize = 0;
  if (label !== "none") {
    fontSize = labelFont(Math.min(geo.width, geo.height), 0.28);
    const fmt = makeFormatter(format, locale);
    labelText =
      label === "count"
        ? `${fmt(filled)}/${fmt(cap)}`
        : cap > 0
          ? makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 0 })(
              filled / cap,
            )
          : undefined;
  }
  const showLabel = labelText !== undefined && labelFitsY(geo.height / 2, fontSize, geo.height);
  const accName =
    summary === false
      ? false
      : (summary ?? honeycombSummary(filled, { total: cap, unit, strings, format, locale }));
  const fill = color ?? "var(--mc-accent)";
  const rootStyle = showLabel
    ? ({ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties)
    : style;

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // Occupancy fills the comb as a block, so there is no floor to stand on.
      // The hex rows, not the viewBox: `height` is padded and ceiled to a whole
      // unit, which would bias the centre downward by the rounding residue.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={className ? `mc-honeycomb ${className}` : "mc-honeycomb"}
      style={rootStyle}
    >
      {/* empty="outline" hairline; "blank" draws nothing. */}
      {geo.emptyPath && empty !== "blank" ? (
        <path d={geo.emptyPath} data-mc-ink="muted" strokeOpacity={0.75} />
      ) : null}
      {geo.filledPath ? <path d={geo.filledPath} style={{ fill }} /> : null}
      {showLabel ? (
        <text
          x={geo.width / 2}
          y={geo.height / 2}
          fontSize={fontSize}
          dominantBaseline="central"
          textAnchor="middle"
          data-mc-ink="label"
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
