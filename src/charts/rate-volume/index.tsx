// <RateVolume> — a rate moved, but on what volume? A precise rate
// line over deliberately low-precision ghost volume bars (the denominator). There is no prop to remove the bars: a rate without its
// denominator is the lie this type prevents. The summary never states a rate
// without its volume.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_RATE_VOLUME, type RateVolumeStrings } from "../../core/strings-rate-volume.js";
import { resolveSummary } from "../../core/summary.js";
import {
  rateVolumeGeometry,
  type RateCurve,
  type RateVolumeGeometry,
  type RateVolumePoint,
} from "./geometry.js";

export function rateVolumeSummary(
  geo: RateVolumeGeometry,
  fmtRate: (n: number) => string,
  fmtVol: (n: number) => string,
  unit: string,
  strings: RateVolumeStrings,
): string {
  if (geo.last === null) return strings.noData;
  const rateLast = fmtRate(geo.last.rate);
  const volLast = fmtVol(geo.last.volume);
  // a single real period (or no earlier rate to trend from) → the short form
  if (geo.firstRate === null || geo.firstRate === geo.last.rate) {
    return strings.rateVolumeShort(rateLast, volLast, unit, geo.last.low);
  }
  const direction = geo.last.rate > geo.firstRate ? "up" : "down";
  return strings.rateVolume(
    rateLast,
    volLast,
    unit,
    geo.last.low,
    direction,
    fmtRate(geo.firstRate),
    geo.n,
  );
}

export interface RateVolumeProps {
  /** One point per period: a rate and the volume it was measured on. */
  data: readonly RateVolumePoint[];
  /** Below this volume the rate mark renders hollow — "insufficient denominator". */
  minVolume?: number | undefined;
  /** Volume has different units than rate; cached separately. */
  volumeFormat?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  /** Noun for the volume unit in the summary (default "events"). */
  unit?: string | undefined;
  curve?: RateCurve | undefined;
  /** Endpoint rate dot: `"auto"` (default) or `"none"` for dense tables. */
  dots?: "auto" | "none" | undefined;
  /** `"last"` (default) states the endpoint rate in a right gutter. */
  label?: "last" | "none" | undefined;
  /** Rate domain (y). */
  domain?: readonly [number, number] | undefined;
  /** Volume domain — defaults to `[0, max]`, zero-anchored. */
  volumeDomain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: RateVolumeStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function RateVolume(props: RateVolumeProps): ReactNode {
  const {
    data,
    minVolume,
    volumeFormat,
    unit = "events",
    curve = "linear",
    dots = "auto",
    label = "last",
    domain,
    volumeDomain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_RATE_VOLUME,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // label size in viewBox units (~0.62·height, clamped 7–11) — see graded-band
  const FONT = labelFont(height, 0.62);
  const fmt = makeFormatter(format, locale);
  const fmtVol = makeFormatter(volumeFormat, locale);
  const cls = className ? `mc-rate-volume ${className}` : "mc-rate-volume";

  // probe once to size the gutter to the endpoint rate label
  const probe = rateVolumeGeometry({ width, height, data, minVolume, curve, domain, volumeDomain });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel = label === "last" && probe?.last != null && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? fmt(probe!.last!.rate) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = rateVolumeGeometry({
    width,
    height,
    data,
    minVolume,
    curve,
    domain,
    volumeDomain,
    gutterCh,
    fontSize: FONT,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => rateVolumeSummary(geo, fmt, fmtVol, unit, strings));
  const lineColor = color ?? "var(--mc-accent)";
  // endpoint dot only when it isn't already a hollow low ring
  const showEndDot = dots !== "none" && geo.last != null && !geo.last.low;
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The ghost volume bars are zero-anchored, so the plot floor is the mark's
      // real bottom and belongs on the text baseline; the rate line rides above
      // it. Seat the padded plot rather than the box, or the bars hang two units
      // below the line they should be standing on.
      seat={{ mode: "floor", bottom: geo.plotB }}
      className={cls}
      style={rootStyle}
    >
      {/* Volume bars (ghost ink → forced-colors). */}
      {geo.bars.map((b, i) =>
        b.height > 0 ? (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            data-mc-ink="ghost"
            shapeRendering="crispEdges"
          />
        ) : null,
      )}
      {geo.line.d ? (
        <path
          d={geo.line.d}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: lineColor }}
        />
      ) : null}
      {/* Low-n: hollow rings (shape, not color alone). */}
      {geo.points.map((p, i) =>
        p.low ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.8}
            fill="var(--mc-surface)"
            stroke={lineColor}
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null,
      )}
      {showEndDot ? (
        <circle
          cx={geo.last!.x}
          cy={geo.last!.y}
          r={1.8}
          data-mc-ink="accent"
          style={{ fill: lineColor }}
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
