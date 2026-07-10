// <RateVolume> — a rate moved, but on what volume? (plan/23 #5). A precise rate
// line over deliberately low-precision ghost volume bars (the denominator). Static,
// hook-free, RSC-safe. There is no prop to remove the bars: a rate without its
// denominator is the lie this type prevents. The summary never states a rate
// without its volume.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_RATE_VOLUME, type RateVolumeStrings } from "../../core/strings-rate-volume.js";
import {
  rateVolumeGeometry,
  type RateCurve,
  type RateVolumeGeometry,
  type RateVolumePoint,
} from "./geometry.js";

/** Factual rate-volume summary. Shared with the interactive entry. */
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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
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
  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.62)));
  const fmt = makeFormatter(format, locale);
  const fmtVol = makeFormatter(volumeFormat, locale);
  const cls = className ? `mc-rate-volume ${className}` : "mc-rate-volume";

  // probe once to size the gutter to the endpoint rate label
  const probe = rateVolumeGeometry({ width, height, data, minVolume, curve, domain, volumeDomain });
  const showLabel = label === "last" && probe?.last != null;
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
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName =
    summary === false ? false : (summary ?? rateVolumeSummary(geo, fmt, fmtVol, unit, strings));
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
      className={cls}
      style={rootStyle}
    >
      {/* ghost volume bars — the denominator, zero-anchored, low z. Static neutral
          fill via the ghost ink-role (earns the forced-colors mapping). */}
      {geo.bars.map((b) =>
        b.height > 0 ? (
          <rect
            key={b.x}
            x={b.x}
            y={b.y}
            width={b.width}
            height={b.height}
            data-mc-ink="ghost"
            shapeRendering="crispEdges"
          />
        ) : null,
      )}
      {/* rate line — the precise series. data ink-role supplies the tokenized
          stroke-width/caps; accent stroke set inline so it reads over the bars. */}
      {geo.line.d ? (
        <path
          d={geo.line.d}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: lineColor }}
        />
      ) : null}
      {/* low-denominator marks: hollow rings (shape cue, never color-alone) */}
      {geo.points.map((p) =>
        p.low ? (
          <circle
            key={p.x}
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
        <circle cx={geo.last!.x} cy={geo.last!.y} r={1.8} style={{ fill: lineColor }} />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
