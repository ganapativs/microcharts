// <VolumeProfile> — at which LEVEL did activity concentrate (not when).
// Histogram perpendicular to the trend axis: y = level, bars extend by mass.
// Modal bin (POC) accented; value area shaded (stated 70% convention, not a CI).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter, makePercentFormatter } from "../../core/format.js";
import { EN_VOLUME_PROFILE, type VolumeProfileStrings } from "../../core/strings-volume-profile.js";
import { chartSide, round2 } from "../../core/types.js";
import {
  DEFAULT_BINS,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  profileLayout,
  resolveValueArea,
  volumeProfileGeometry,
  type LevelRow,
} from "./geometry.js";

export type VolumeProfileDatum = LevelRow | number;

export interface VolumeProfileProps {
  data: readonly VolumeProfileDatum[];
  /** Mass fraction defining the shaded value-area span. */
  valueArea?: number | undefined;
  /** Which way bars grow — pairs with a trend chart on the opposite side. */
  align?: "left" | "right" | undefined;
  /** The POC level, anchored beside the accent bar. */
  label?: "poc" | "none" | undefined;
  bins?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: VolumeProfileStrings | undefined;
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

/** Shared summary — where activity concentrates + the value-area span. */
export function volumeProfileSummary(
  geo: ReturnType<typeof volumeProfileGeometry>,
  valueArea: number,
  strings: VolumeProfileStrings,
  fmt: (n: number) => string,
  /** Percent formatter (FRACTION in) for the value-area convention. A stated
   *  share, not a level — `locale` reaches it, the value `format` must not. */
  pct: (fraction: number) => string = makePercentFormatter(undefined),
): string {
  if (!geo.poc) return strings.noData;
  if (geo.even) return strings.volumeEven;
  return strings.volumeProfile(fmt(geo.poc.level), pct(valueArea), fmt(geo.vaLo), fmt(geo.vaHi));
}

export function VolumeProfile(props: VolumeProfileProps): ReactNode {
  const {
    data,
    valueArea: valueAreaProp,
    align = "left",
    label = "poc",
    bins = DEFAULT_BINS,
    width: widthProp = DEFAULT_WIDTH,
    height: heightProp = DEFAULT_HEIGHT,
    format,
    locale,
    strings = EN_VOLUME_PROFILE,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // Resolved ONCE, before anything reads them: the summary states the value-area
  // convention the band was walked with, and `labelFont` turns a NaN height into
  // a NaN font size on text the box then cannot check.
  const valueArea = resolveValueArea(valueAreaProp);
  const width = chartSide(widthProp, DEFAULT_WIDTH);
  const height = chartSide(heightProp, DEFAULT_HEIGHT);

  const fmt = makeFormatter(format, locale);
  const pctFmt = makePercentFormatter(locale);
  const fontSize = labelFont(height, 0.11, labelSize);
  // bins once (the O(data.length) pass); only the O(bins) layout repeats for the
  // gutter — re-running the bin + value-area walk was the bench-floor regression
  const { pocText, ...geo } = profileLayout({
    data,
    bins,
    valueArea,
    align,
    width,
    height,
    label,
    fontSize,
    fmt,
  });
  const accName =
    summary === false
      ? false
      : (summary ?? volumeProfileSummary(geo, valueArea, strings, fmt, pctFmt));

  const normal = geo.bars.filter((b) => !b.poc);
  const pocBar = geo.bars.find((b) => b.poc);
  const anchorLeft = align === "left";

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // y encodes LEVEL, not magnitude: the bottom row is the lowest price bin,
      // not a zero floor, so nothing here belongs on the baseline. The rows
      // partition a box padded equally top and bottom, so that plot box centres
      // exactly where the viewBox does — the frame stands in for it.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-volprofile ${className}` : "mc-volprofile"}
      style={{ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties}
    >
      {/* value area band — a true background band (real data extent, kept for
          the craft/overlap + forced-colors exemption); fill via inline STYLE,
          not the token, so the accent tint stays distinct from a plain neutral
          band (benchmark-strip precedent). */}
      {geo.valueAreaRect ? (
        <rect
          x={geo.valueAreaRect.x}
          y={geo.valueAreaRect.y}
          width={geo.valueAreaRect.width}
          height={geo.valueAreaRect.height}
          data-mc-ink="band"
          style={{ fill: "var(--mc-accent)", fillOpacity: 0.1 }}
        />
      ) : null}
      {/* No `shapeRendering="crispEdges"` here, unlike the POC rect below. The
          hint snaps every edge to the device grid, and BOTH of a row's extents
          go sub-unit at word size: `width` is the mass (a thin row is a real
          reading, not a rounding artefact) and `height` floors at 0.6 units
          once the levels outnumber the box (geometry.ts:188). Snapped, a thin
          row painted nothing and a 0.6-unit row painted or vanished depending
          on where it fell against the grid — so a dense profile lost alternate
          levels and read as half its resolution. The stylesheet relaxes the
          hint per-rect for exactly this (`rect[width^="0."]`), but these rows
          are ONE path — a batch the selector cannot reach a sub-shape inside,
          and a hint that applies to the whole path or none of it. */}
      {normal.length > 0 ? (
        <path
          d={normal.map((b) => `M${b.x} ${b.y}h${b.width}v${b.height}h${-b.width}z`).join("")}
          data-mc-ink="bar"
        />
      ) : null}
      {pocBar ? (
        <rect
          x={pocBar.x}
          y={pocBar.y}
          width={pocBar.width}
          height={pocBar.height}
          data-mc-ink="accent"
          shapeRendering="crispEdges"
        />
      ) : null}
      {pocText && pocBar ? (
        <text
          x={
            anchorLeft
              ? Math.min(width - 0.5, pocBar.x + pocBar.width + 1)
              : Math.max(0.5, pocBar.x - 1)
          }
          y={round2(pocBar.y + pocBar.height / 2)}
          dominantBaseline="central"
          textAnchor={anchorLeft ? "start" : "end"}
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {pocText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
