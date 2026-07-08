// <BenchmarkStrip> — is this value normal for its peer group? (plan/23 #2). A
// focal dot on a common scale against the peers' own empirical quantile bands.
// Static, hook-free, RSC-safe. No axis: the band is the reference frame. Bands
// are quantiles of the SUPPLIED peers, never a fitted curve; the stated
// percentile uses the documented mid-rank rule.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2, type Polarity, type Value } from "../../core/types.js";
import { benchmarkStripGeometry, type BenchmarkStripGeometry } from "./geometry.js";

/** Factual benchmark summary. Shared with the interactive entry. */
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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: QuantileStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const FONT = 6;

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
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const showLabel = label !== "none";
  const geo = benchmarkStripGeometry({
    width,
    height,
    data,
    value,
    range,
    domain,
    gutterCh: showLabel ? 4 : 0,
    fontSize: FONT,
  });

  const cls = className ? `mc-benchmark-strip ${className}` : "mc-benchmark-strip";

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

  const accName = summary === false ? false : (summary ?? benchmarkSummary(geo, fmt, strings));

  // dot color: default accent; with polarity, the "good" side reads pos, else neg
  const good =
    positive === undefined
      ? undefined
      : positive === "up"
        ? geo.dot.value >= geo.median.value
        : geo.dot.value <= geo.median.value;
  const dotFill =
    color ?? (good === undefined ? undefined : good ? "var(--mc-pos)" : "var(--mc-neg)");

  const labelText =
    label === "value" ? fmt(geo.dot.value) : label === "percentile" ? `p${geo.percentile}` : "";

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={style}
    >
      <rect
        x={geo.outer.x}
        y={geo.bandY}
        width={geo.outer.width}
        height={geo.bandH}
        rx={1}
        data-mc-ink="band"
        style={{ fillOpacity: 0.14 }}
      />
      <rect
        x={geo.inner.x}
        y={geo.bandY}
        width={geo.inner.width}
        height={geo.bandH}
        rx={1}
        data-mc-ink="band"
        style={{ fillOpacity: 0.3 }}
      />
      {median ? (
        <line
          x1={geo.median.x}
          y1={geo.bandY - 0.5}
          x2={geo.median.x}
          y2={geo.bandY + geo.bandH + 0.5}
          data-mc-ink="data"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 1 }}
        />
      ) : null}
      <circle
        cx={geo.dot.x}
        cy={round2(height / 2)}
        r={2}
        data-mc-ink="data"
        style={dotFill ? { fill: dotFill } : undefined}
      />
      {geo.dot.clamped !== 0 ? (
        <path
          d={
            geo.dot.clamped < 0
              ? `M${geo.dot.x - 3} ${height / 2} l2 -1.6 v3.2 Z`
              : `M${geo.dot.x + 3} ${height / 2} l-2 -1.6 v3.2 Z`
          }
          data-mc-ink="data"
          style={dotFill ? { fill: dotFill } : undefined}
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="end"
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
