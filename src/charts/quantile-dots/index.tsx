// <QuantileDots> — what are the odds, in COUNTABLE form? A
// quantile dotplot: `count` dots at equal-probability quantiles, stacked into
// columns. Each dot ≈ a 1-in-count chance — NOT a raw observation. Past a
// threshold, dots are re-inked accent AND ringed (never color-alone), and the
// summary uses frequency framing ("4 in 20"), never a bare percentage. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_QUANTILE_DOTS, type QuantileDotsStrings } from "../../core/strings-quantile-dots.js";
import { quantileDotsGeometry, type QuantileDotsGeometry, type ThresholdSide } from "./geometry.js";
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
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_QUANTILE_DOTS,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
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
  const labelText = showLabel ? `${probe!.past} in ${probe!.count}` : "";
  const gutterCh = showLabel ? labelText.length : 0;

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
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName =
    summary === false
      ? false
      : (summary ?? quantileDotsSummary(geo, fmt, { threshold, side }, strings));
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

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
      seat={{ mode: "floor", bottom: height - geo.pad }}
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
          vectorEffect="non-scaling-stroke"
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
            vectorEffect="non-scaling-stroke"
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
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
