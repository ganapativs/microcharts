// <ForecastCone> — will we land where we need to? History as a
// solid line, then a fan of prediction bands (p80 outer, p50 inner) widening
// over the horizon with a DASHED median — an estimate never renders as fact.
// The fan's entire honesty is visible confidence
// decay: at most 2 bands, the mid is always dashed, and a cone that fails to
// widen is flagged (never auto-inflated).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_FORECAST, type ForecastStrings } from "../../core/strings-forecast.js";
import { forecastConeGeometry, type ForecastConeGeometry, type ForecastInput } from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear, clamp } from "../../core/scale.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { round2 } from "../../core/types.js";
import { resolveSummary } from "../../core/summary.js";

export function forecastSummary(
  geo: ForecastConeGeometry,
  fmt: (n: number) => string,
  opts: { unit: string; at: number; target?: number | undefined },
  strings: ForecastStrings,
): string {
  const base = strings.forecast(
    fmt(geo.horizon.mid),
    opts.at,
    opts.unit,
    fmt(geo.horizon.lo),
    fmt(geo.horizon.hi),
    geo.now === null ? null : fmt(geo.now),
  );
  if (opts.target === undefined || !Number.isFinite(opts.target)) return base;
  const status =
    geo.horizon.lo >= opts.target
      ? "clears"
      : geo.horizon.hi <= opts.target
        ? "misses"
        : "straddles";
  return base + strings.forecastClearance(status, fmt(opts.target));
}

export interface ForecastConeProps {
  /** Historical actuals. */
  data: readonly number[];
  /** The forecast: median + p80 (required) and optional p50 band, `[lo,hi]` pairs. */
  forecast: ForecastInput;
  /** The landing reference the cone must clear. */
  target?: number | undefined;
  /** Period noun for the summary (default "week"). */
  unit?: string | undefined;
  /** `"landing"` states the median endpoint in a right gutter. */
  label?: "landing" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ForecastStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const BAND_OPACITY = { 80: 0.13, 50: 0.24 } as const;

export function ForecastCone(props: ForecastConeProps): ReactNode {
  const {
    data,
    forecast,
    target,
    unit = "week",
    label = "landing",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_FORECAST,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-forecast-cone ${className}` : "mc-forecast-cone";
  const at = data.length + forecast.mid.length;

  // Paths ignore the label gutter — one geometry pass, then widen the box.
  const geo = forecastConeGeometry({ width, height, data, forecast, target, domain });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Empty stands on the same padded floor a drawn cone would.
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const FONT = label === "landing" ? labelFont(height) : 0;
  const showLabel = FONT > 0 && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? fmt(geo.landing.value) : "";
  const totalWidth = showLabel ? width + Math.ceil(labelText.length * FONT * 0.72) + 4 : width;
  const labelX = width + 3;
  const labelY = showLabel
    ? round2(clamp(geo.landing.y, FONT * 0.5, height - FONT * 0.5))
    : geo.labelY;

  if (!geo.widening) {
    devWarn(
      "<ForecastCone> forecast bands don't widen over the horizon — rendered as given, never auto-inflated (an estimate's uncertainty should grow with distance).",
    );
  }

  const accName =
    summary === false
      ? false
      : (summary ?? forecastSummary(geo, fmt, { unit, at, target }, strings));
  const accent = color ?? "var(--mc-accent)";
  const rootStyle = showLabel
    ? ({ ...style, "--mc-label-size": `${FONT}px` } as CSSProperties)
    : style;

  // annotations host contract: Marker x = period INDEX across history+forecast
  // (geo.points span the whole axis), Threshold/TargetZone y = data values on
  // the shared value scale. The frame width is the `width` prop (the plot basis
  // the points use), not the gutter-extended totalWidth.
  const ann = children
    ? resolveAnnotations(children, {
        x: (i) => geo.points[Math.round(i)]?.x ?? NaN,
        y: scaleLinear(geo.domain, [height - 2, 2]),
        width,
        height,
        fontSize: annotationFontSize(height),
      })
    : { under: null, over: null, rest: null };

  return (
    <Chart
      width={totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // History plus a fan, both over one fitted value domain — a trace, so it
      // stands on the plot's padded floor like a sparkline (the same 2-unit
      // inset the annotation frame above uses). The cone's own edges are data
      // and the landing gutter only widens the viewBox; neither moves the seat.
      seat={{ mode: "floor", bottom: height - 2 }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {/* Fan bands (faintest first). Accent fill — not ink="band" (that token
          is muted background + skips the text-on-mark craft check). */}
      {geo.bands.map((b) => (
        <path
          key={b.p}
          d={b.d}
          data-mc-cone={b.p}
          style={
            {
              "--mc-cone-color": accent,
              "--mc-cone-opacity": BAND_OPACITY[b.p],
            } as CSSProperties
          }
        />
      ))}
      {geo.history.d ? (
        <path
          d={geo.history.d}
          data-mc-ink="data"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={color ? { stroke: color } : undefined}
        />
      ) : null}
      <line
        x1={geo.boundary.x}
        y1={1}
        x2={geo.boundary.x}
        y2={height - 1}
        data-mc-ink="muted"
        data-mc-w="hair"
        strokeOpacity={0.4}
        vectorEffect="non-scaling-stroke"
      />
      {geo.now !== null ? (
        <circle cx={geo.boundary.x} cy={geo.boundary.y} r={1.6} data-mc-ink="point" />
      ) : null}
      {/* Median dashed — estimate, not fact. */}
      <path
        d={geo.mid.d}
        fill="none"
        strokeDasharray="2.5 2.5"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: accent, strokeWidth: "var(--mc-sw)" }}
      />
      {geo.target ? (
        <line
          x1={0}
          y1={geo.target.y}
          x2={width}
          y2={geo.target.y}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeOpacity={0.6}
          strokeDasharray="1 1.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {showLabel ? (
        <text
          x={labelX}
          y={labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
