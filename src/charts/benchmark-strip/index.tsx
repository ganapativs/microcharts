// <BenchmarkStrip> — is this value normal for its peer group? A
// focal dot on a common scale against the peers' own empirical quantile bands.
// No axis: the band is the reference frame. Bands
// are quantiles of the SUPPLIED peers, never a fitted curve; the stated
// percentile uses the documented mid-rank rule.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2, type Polarity, type Value } from "../../core/types.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { benchmarkStripGeometry, type BenchmarkStripGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function benchmarkSummary(
  geo: BenchmarkStripGeometry,
  fmt: (n: number) => string,
  strings: QuantileStrings,
): string {
  if (geo.flat) return strings.benchmarkFlat(fmt(geo.dot.value), geo.n, fmt(geo.median.value));
  return strings.benchmark(fmt(geo.dot.value), geo.percentile, geo.n, fmt(geo.p25), fmt(geo.p75));
}

export interface BenchmarkStripProps {
  /** Peer values. */
  data: readonly Value[];
  /** The focal reading. */
  value: number;
  /** Outer band: `"p5p95"` (default) | `"minmax"` (small-n honesty). */
  range?: "p5p95" | "minmax" | undefined;
  /** Center tick (default true). */
  median?: boolean | undefined;
  /** What the right gutter states (default `"percentile"`). */
  label?: "value" | "percentile" | "none" | undefined;
  /** Colors the focal dot by which side of the band is good. */
  positive?: Polarity | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: QuantileStrings | undefined;
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

/**
 * Characters the right-hand readout reserves. `p100` is the longest percentile,
 * so that branch is a fixed 4 and the box width holds still as the reading
 * moves. A `label="value"` readout is caller-scaled: reserved at 4, a formatted
 * `-1,234,567.89` ran back across the peer bands and painted over the focal
 * dot. Exported so the interactive entry's viewBox can't drift from the
 * static's — both entries must reserve the same gutter or hover lands off-mark.
 */
export function benchmarkGutterCh(
  label: BenchmarkStripProps["label"],
  value: number,
  fmt: (n: number) => string,
): number {
  // `geo.dot.value` is `round2(value)`, so this measures the string painted.
  return label === "value" ? Math.max(4, fmt(round2(value)).length) : 4;
}

export function BenchmarkStrip(props: BenchmarkStripProps): ReactNode {
  const {
    data,
    value,
    range = "p5p95",
    median = true,
    label = "percentile",
    positive,
    domain,
    width = 80,
    height = 12,
    color,
    format,
    locale,
    strings = EN_QUANTILE,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // label size in viewBox units (~0.62·height, clamped 7–11) — see coverage-strip
  const FONT = labelFont(height, 0.62, labelSize);
  const fmt = makeFormatter(format, locale);
  // `labelFont` floors at 7 viewBox units, so below a 7-unit box the readout
  // cannot be painted inside the strip at all. It DROPS rather than spilling
  // above and below the box — the band and focal dot stay readable, and the
  // gutter goes with it so the strip reclaims the full width.
  const showLabel = label !== "none" && labelFitsY(height / 2, FONT, height);
  const geo = benchmarkStripGeometry({
    width,
    height,
    data,
    value,
    range,
    domain,
    gutterCh: showLabel ? benchmarkGutterCh(label, value, fmt) : 0,
    fontSize: FONT,
  });

  const cls = className ? `mc-benchmark-strip ${className}` : "mc-benchmark-strip";

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        // Empty seats like the drawn strip: same midline, no band to measure.
        seat={{ mode: "center", top: 0, bottom: height }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName = resolveSummary(summary, () => benchmarkSummary(geo, fmt, strings));

  // dot color: default accent; with polarity, the "good" side reads positive.
  // The label <text> takes the same color as an ink ROLE (the base `.mc-root
  // text` rule would override a fill attribute); a custom `color` can't come
  // from a static role, so it falls back to an inline fill.
  const good =
    positive === undefined
      ? undefined
      : positive === "up"
        ? geo.dot.value >= geo.median.value
        : geo.dot.value <= geo.median.value;
  const dotInk = color ? undefined : good === undefined ? "accent" : good ? "positive" : "negative";
  const dotFill =
    color ??
    (good === undefined ? "var(--mc-accent)" : good ? "var(--mc-positive)" : "var(--mc-negative)");

  const labelText =
    label === "value" ? fmt(geo.dot.value) : label === "percentile" ? `p${geo.percentile}` : "";
  // the percentile/value reads OUT in a clean right gutter (over the band it was
  // cramped + low-contrast) — colored like the dot so it stays tied to the focal
  const midY = round2(height / 2);
  // pin the label size to viewBox units (see coverage-strip)
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A focal dot riding the peer bands on a midline — the strip runs along
      // the value axis, so neither edge is a floor and it centres on the cap
      // band. `bandH` is a fixed fraction of the height and `bandY` centres it,
      // so the frame is the plot box; the label gutter only widens the viewBox.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={cls}
      style={rootStyle}
    >
      {/* Peer quantile bands as neutral ink (cohort spread, not a wash). */}
      <rect
        x={geo.outer.x}
        y={geo.bandY}
        width={geo.outer.width}
        height={geo.bandH}
        rx={1.5}
        data-mc-ink="neutral"
        fillOpacity={0.16}
      />
      <rect
        x={geo.inner.x}
        y={geo.bandY}
        width={geo.inner.width}
        height={geo.bandH}
        rx={1.5}
        data-mc-ink="neutral"
        fillOpacity={0.34}
      />
      {median ? (
        <line
          x1={geo.median.x}
          y1={geo.bandY - 0.5}
          x2={geo.median.x}
          y2={geo.bandY + geo.bandH + 0.5}
          data-mc-ink="muted"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {geo.dot.clamped !== 0 ? (
        // dynamic valence FILL stays an attribute: accent ink on a <path> would
        // stroke it (element-split rule) and lose the solid arrowhead
        <path
          d={
            geo.dot.clamped < 0
              ? `M${geo.dot.x - 3} ${midY} l2.4 -1.8 v3.6 Z`
              : `M${geo.dot.x + 3} ${midY} l-2.4 -1.8 v3.6 Z`
          }
          fill={dotFill}
        />
      ) : null}
      {/* Focal + surface halo. Both go inline, which covers everything the
          `point` role sets — the role is here only to carry the mark, whose x
          IS the reading, into the data-change transition. The bands behind it
          already travelled, so the focal dot was the one thing on this strip
          that jumped. */}
      <circle
        cx={geo.dot.x}
        cy={midY}
        r={2.4}
        data-mc-ink="point"
        style={{ fill: dotFill, stroke: "var(--mc-surface)" }}
        data-mc-w="support"
      />
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={FONT}
          data-mc-ink={dotInk}
          style={color ? { fill: color } : undefined}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
