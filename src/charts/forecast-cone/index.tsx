// <ForecastCone> — will we land where we need to? History as a
// solid line, then a fan of prediction bands (p80 outer, p50 inner) widening
// over the horizon with a DASHED median — an estimate never renders as fact.
// Static, hook-free, RSC-safe. The fan's entire honesty is visible confidence
// decay: at most 2 bands, the mid is always dashed, and a cone that fails to
// widen is flagged (never auto-inflated).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_FORECAST, type ForecastStrings } from "../../core/strings-forecast.js";
import { forecastConeGeometry, type ForecastConeGeometry, type ForecastInput } from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { resolveSummary } from "../../core/summary.js";

/** Factual forecast summary. Shared with the interactive entry. */
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

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-forecast-cone ${className}` : "mc-forecast-cone";
  const at = data.length + forecast.mid.length;

  const probe = forecastConeGeometry({ width, height, data, forecast, target, domain });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel = label === "landing" && probe != null && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? fmt(probe!.landing.value) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = forecastConeGeometry({
    width,
    height,
    data,
    forecast,
    target,
    domain,
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
        // Empty stands on the same padded floor a drawn cone would.
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

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
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  // annotations host contract: Marker x = period INDEX across history+forecast
  // (geo.points span the whole axis), Threshold/TargetZone y = data values on
  // the shared value scale. The frame width is the `width` prop (the plot basis
  // the points use), not the gutter-extended totalWidth.
  const ann = resolveAnnotations(children, {
    x: (i) => geo.points[Math.round(i)]?.x ?? NaN,
    y: scaleLinear(geo.domain, [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={geo.totalWidth}
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
      {/* fan bands — faintest (80) first. This is the uncertainty ENCODING, not
          a neutral reference zone, so it takes an accent tint via inline style
          rather than `data-mc-ink="band"` (that role means the muted
          `--mc-band` background token, and — as a side effect — exempts the
          mark from the craft gate's text-on-mark check; misapplying it here
          would be borrowing that exemption for a mark it doesn't describe). */}
      {geo.bands.map((b) => (
        <path
          key={b.p}
          d={b.d}
          className="mc-cone-band"
          style={{ fill: accent, fillOpacity: BAND_OPACITY[b.p] }}
        />
      ))}
      {/* history — solid, the record */}
      {geo.history.d ? (
        <path
          d={geo.history.d}
          data-mc-ink="data"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={color ? { stroke: color } : undefined}
        />
      ) : null}
      {/* today boundary — a quiet tick + dot at the last actual */}
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
      {/* median — always DASHED; an estimate never renders as fact */}
      <path
        d={geo.mid.d}
        fill="none"
        strokeDasharray="2.5 2.5"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: accent, strokeWidth: "var(--mc-stroke-width)" }}
      />
      {/* target reference the cone must clear */}
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
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
