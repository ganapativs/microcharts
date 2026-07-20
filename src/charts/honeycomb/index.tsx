// <Honeycomb> — how many of the available slots are taken.
// Occupancy of capacity in an area-filling hex grid: units are countable (total
// ≤ 60). Two merged <path> nodes (filled + empty) keep the node count O(1). Fill
// order is row-major from the top-left (occupancy reads as a sweep). Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_HONEYCOMB, type HoneycombStrings } from "../../core/strings-honeycomb.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import type { EmptyCellStyle } from "../../core/types.js";
import { honeycombGeometry } from "./geometry.js";

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
  const { total = 10, unit = "", strings = EN_HONEYCOMB, format, locale } = opts;
  if (total <= 0) return strings.noData;
  const fmt = makeFormatter(format, locale);
  return strings.honeycomb(fmt(Math.max(0, Math.round(value))), fmt(Math.floor(total)), unit);
}

export function Honeycomb(props: HoneycombProps): ReactNode {
  const {
    value,
    total = 10,
    rows = "auto",
    empty = "outline",
    unit = "",
    cell = 4,
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

  if (total > 60) devWarn("<Honeycomb> over 60 cells stops being countable — use Progress.");

  const geo = honeycombGeometry({ total, value, rows, cellR: cell, pad: PAD });
  const accName =
    summary === false
      ? false
      : (summary ?? honeycombSummary(value, { total, unit, strings, format, locale }));
  const fill = color ?? "var(--mc-accent)";

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
      style={style}
    >
      {/* empty cells — "blank" draws nothing (GardenGrid's pattern); "outline"
          is a quiet hairline ring, fill:none already comes from the role */}
      {geo.emptyPath && empty !== "blank" ? (
        <path d={geo.emptyPath} data-mc-ink="muted" strokeOpacity={0.75} />
      ) : null}
      {/* filled cells */}
      {geo.filledPath ? <path d={geo.filledPath} style={{ fill }} /> : null}
      {children}
    </Chart>
  );
}
