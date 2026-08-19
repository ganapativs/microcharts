// <QuantileDots> — what are the odds, in COUNTABLE form? A
// quantile dotplot: `count` dots at equal-probability quantiles, stacked into
// columns. Each dot ≈ a 1-in-count chance — NOT a raw observation. Past a
// threshold, dots are re-inked accent AND ringed (never color-alone). and the
// summary uses frequency framing ("4 in 20"). never a bare percentage.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_QUANTILE_DOTS, type QuantileDotsStrings } from "../../core/strings-quantile-dots.js";
import { chartSide } from "../../core/types.js";
import {
  QUANTILE_PAD,
  quantileDotsGeometry,
  type QuantileDotsGeometry,
  type ThresholdSide,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function quantileDotsSummary(
  geo: QuantileDotsGeometry,
  fmt: (n: number) => string,
  opts: { threshold?: number | undefined; side: ThresholdSide },
  strings: QuantileDotsStrings,
): string {
  if (opts.threshold !== undefined && Number.isFinite(opts.threshold)) {
    return strings.quantileDots(geo.past, geo.count, opts.side, fmt(opts.threshold));
  }
  return strings.quantileDotsRange(fmt(geo.mode.lo), fmt(geo.mode.hi), fmt(geo.min), fmt(geo.max));
}

export interface QuantileDotsProps {
  /** Raw sample or posterior draws. */
  data: readonly number[];
  /** Number of quantile dots (default 20; docs recommend 15–20; capped at 25). */
  count?: number | undefined;
  /** The decision line — turns the plot from shape into odds. */
  threshold?: number | undefined;
  /** Which side of the threshold is the event being counted (default "above"). */
  side?: ThresholdSide | undefined;
  /** `"count"` states "N in count" in a gutter (default when `threshold` set). */
  label?: "count" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: QuantileDotsStrings | undefined;
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

export function QuantileDots(props: QuantileDotsProps): ReactNode {
  const {
    data,
    count,
    threshold,
    side = "above",
    label = "count",
    domain,
    width: widthProp = 80,
    height: heightProp = 20,
    color,
    format,
    locale,
    strings = EN_QUANTILE_DOTS,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // The box drives the label font, the seat and the geometry, none of which
  // `Chart`'s own clamp reaches — a NaN height shipped `--mc-label-px: NaNpx`
  // and NaN dot centers inside a perfectly valid viewBox (see `chartSide`).
  const width = chartSide(widthProp);
  const height = chartSide(heightProp);

  const FONT = labelFont(height, 0.55, labelSize);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-quantile-dots ${className}` : "mc-quantile-dots";
  const hasThreshold = threshold !== undefined && Number.isFinite(threshold);

  const probe = quantileDotsGeometry({ width, height, data, count, threshold, side, domain });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel =
    label === "count" && hasThreshold && probe != null && labelFitsY(height / 2, FONT, height);
  // The frequency framing comes from the strings bundle — the interactive entry
  // already renders this exact label through `quantileDotsOdds`, while the
  // static spelled "N in count" out in English, so a translated `strings` moved
  // the announcement and left the painted label behind. Gutter off the produced
  // string, so a longer translation reserves the room it needs.
  const labelText = showLabel ? strings.quantileDotsOdds(probe!.past, probe!.count) : "";
  // Reserve the WIDEST odds string this dotplot can print (`count in count`),
  // never the current one. The interactive entry drives `threshold` from the
  // pointer, so a gutter sized to today's digits would grow and shrink the
  // viewBox under the cursor — and the same props would paint a different box
  // static vs interactive.
  const gutterCh = showLabel ? strings.quantileDotsOdds(probe!.count, probe!.count).length : 0;

  const geo = quantileDotsGeometry({
    width,
    height,
    data,
    count,
    threshold,
    side,
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
        seat={{ mode: "floor", bottom: height - QUANTILE_PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () =>
    quantileDotsSummary(geo, fmt, { threshold, side }, strings),
  );
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The one floor in this set: dots stack UP from a shared baseline, so the
      // bottom row's rim is a real encoding floor and stands on the text
      // baseline like a bar. It's the padded frame, not the tallest column —
      // stack height is data, and seating it would bob the chart as odds shift.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={rootStyle}
    >
      {geo.dots.map((d, i) =>
        d.past ? null : <circle key={i} cx={d.x} cy={d.y} r={d.r} data-mc-ink="neutral" />,
      )}
      {geo.threshold ? (
        <line
          x1={geo.threshold.x}
          y1={1}
          x2={geo.threshold.x}
          y2={height - 1}
          data-mc-ink="muted"
          data-mc-w="tick"
          strokeOpacity={0.6}
        />
      ) : null}
      {/* Past threshold: accent + ring (not color alone). */}
      {geo.dots.map((d, i) =>
        d.past ? (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={d.r}
            data-mc-ink="flag"
            stroke="var(--mc-stroke)"
            data-mc-w="hair"
            style={color ? { fill: color } : undefined}
          />
        ) : null,
      )}
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
