// <GardenGrid> — the rhythm of activity over time, legible in grayscale and
// print. ActivityGrid's sibling: dot AREA (single ink)
// carries a 5-step ordinal instead of color. Zero renders a hairline ring
// (present, quiet); null renders nothing (missing ≠ zero).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_GARDEN, type GardenStrings } from "../../core/strings-garden.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { devWarn } from "../../core/dev.js";
import { isFiniteValue, type EmptyCellStyle, type Value } from "../../core/types.js";
import { gardenGridGeometry } from "./geometry.js";
import { maxOf } from "../../core/scale.js";

export interface GardenGridProps {
  data: readonly Value[];
  rows?: number | undefined;
  steps?: 3 | 5 | undefined;
  /** How zero-value cells render (default `"outline"` — a quiet hairline ring;
   * shared `EmptyCellStyle`, same vocabulary as Honeycomb. */
  empty?: EmptyCellStyle | undefined;
  domain?: readonly [number, number] | undefined;
  /** Noun for the summary count (default "periods"). */
  unit?: string | undefined;
  cell?: number | undefined;
  gap?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: GardenStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 1;

export function gardenGridSummary(
  data: readonly Value[],
  opts: {
    unit?: string | undefined;
    strings?: GardenStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { unit = "periods", strings = EN_GARDEN, format, locale } = opts;
  const finite = data.filter(isFiniteValue);
  if (finite.length === 0) return strings.noData;
  const peak = maxOf(finite);
  const active = finite.filter((v) => v > 0).length;
  return strings.gardenGrid(data.length, unit, makeFormatter(format, locale)(peak), active);
}

export function GardenGrid(props: GardenGridProps): ReactNode {
  const {
    data,
    rows = 7,
    steps = 5,
    empty = "outline",
    domain,
    unit = "periods",
    cell = 10,
    gap = 2,
    color,
    format,
    locale,
    strings = EN_GARDEN,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > 400)
    devWarn("<GardenGrid> over 400 cells — downsample upstream for legibility.");

  const geo = gardenGridGeometry({ values: data, rows, cell, gap, steps, domain, pad: PAD });
  const accName =
    summary === false
      ? false
      : (summary ?? gardenGridSummary(data, { unit, strings, format, locale }));
  const paint = color;

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // Dot area carries the value; the bottom row is the last period, not a
      // zero line, so the cell block centres on the cap band. `PAD` is the
      // deterministic inset the grid is laid out inside, top and bottom alike.
      seat={{ mode: "center", top: PAD, bottom: geo.height - PAD }}
      className={className ? `mc-garden ${className}` : "mc-garden"}
      style={style}
    >
      {geo.cells.map((c) => {
        if (c.step < 0) return null; // null — missing, no mark
        if (c.step === 0) {
          return empty === "blank" ? null : (
            <circle
              key={c.index}
              cx={c.cx}
              cy={c.cy}
              r={geo.rMax * 0.6}
              data-mc-ink="muted"
              strokeOpacity={0.55}
            />
          );
        }
        return (
          <circle
            key={c.index}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            data-mc-ink="point"
            style={paint ? { fill: paint } : undefined}
          />
        );
      })}
      {children}
    </Chart>
  );
}
