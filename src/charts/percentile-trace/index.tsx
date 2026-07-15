// <PercentileTrace> — one entity's standing drifting inside a population
// Because the series IS percentile rank, the y-axis is LOCKED to
// [0,100] and the population bands (p25–75, p5–95) are fixed rects, not
// estimates — the trace is the only line. Static, hook-free, RSC-safe. The
// endpoint dot carries valence (`positive`); direction is also in the line, so
// the color is a redundant cue, never the sole signal.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import {
  EN_PERCENTILE_TRACE,
  type PercentileTraceStrings,
} from "../../core/strings-percentile-trace.js";
import { round2, type Polarity, type Value } from "../../core/types.js";
import { percentileGeometry, type PercentileGeometry } from "./geometry.js";

/** Factual percentile-drift summary. Shared with the interactive entry. */
export function percentileSummary(
  geo: PercentileGeometry,
  pStr: (n: number) => string,
  fmt: (n: number) => string,
  strings: PercentileTraceStrings,
): string {
  const current = pStr(geo.last.value);
  const deltaClause =
    geo.delta === 0
      ? strings.percentileFlat
      : strings.percentileDelta(geo.delta > 0 ? "up" : "down", fmt(Math.abs(geo.delta)));
  return strings.percentileTrace(current, deltaClause, strings.percentileBand(geo.movement));
}

export interface PercentileTraceProps {
  /** Percentile ranks per reading, 0–100 (out-of-range values are clamped). */
  data: readonly Value[];
  /** Draw the fixed p25–75 + p5–95 population bands (default true). */
  bands?: boolean | undefined;
  /** Which direction is good — colors the endpoint dot (default "up"). */
  positive?: Polarity | undefined;
  /** Reading noun for the interactive announcement (default "step"). */
  unit?: string | undefined;
  /** `"last"` states the final percentile in a right gutter. */
  label?: "last" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: PercentileTraceStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Integer formatting shared with the interactive entry. */
export const INT: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };

export function PercentileTrace(props: PercentileTraceProps): ReactNode {
  const {
    data,
    bands = true,
    positive = "up",
    label = "last",
    width = 80,
    height = 20,
    color,
    format = INT,
    locale,
    strings = EN_PERCENTILE_TRACE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const pStr = (n: number) => strings.percentileValue(fmt(n));
  const cls = className ? `mc-percentile-trace ${className}` : "mc-percentile-trace";

  const geo = percentileGeometry({ width, height, data });
  const accName =
    summary === false
      ? false
      : (summary ?? (geo ? percentileSummary(geo, pStr, fmt, strings) : strings.noData));

  // no finite readings → the empty Chart still carries the accessible name
  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={accName}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  if (geo.clamped) {
    devWarn("<PercentileTrace>: ranks are 0–100; out-of-range clamped.");
  }

  const showLabel = label === "last";
  const labelText = showLabel ? pStr(geo.last.value) : "";
  const gutter = labelText ? Math.ceil(labelText.length * FONT * 0.72) + 4 : 0;

  const lineColor = color ?? "var(--mc-accent)";
  // endpoint valence: rising standing is good by default; the line already
  // carries direction, so this color is a redundant cue
  const good = positive === "down" ? geo.delta < 0 : geo.delta > 0;
  const dotFill = geo.delta === 0 ? lineColor : good ? "var(--mc-positive)" : "var(--mc-negative)";
  // label y clamped by font ascent so the number never spills the viewBox
  const labelY = round2(clamp(geo.last.y, FONT * 0.7, height - FONT * 0.3));

  // annotations host contract: Marker x = reading index on the locked scale,
  // Threshold/TargetZone y = percentile ranks on the fixed [0,100] axis.
  const ann = resolveAnnotations(children, {
    x: scaleLinear([0, Math.max(1, data.length - 1)], [2, width - 2]),
    y: scaleLinear([0, 100], [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={width + gutter}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={{ ...style, "--mc-label-size": `${FONT}px` } as CSSProperties}
    >
      {ann.under}
      {/* outer p5–95 field (faintest, half the band token) then the inner
          p25–75 middle half painted full-strength on top */}
      {bands
        ? [geo.bands.outer, geo.bands.inner].map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              data-mc-ink="band"
              fillOpacity={i === 0 ? 0.5 : undefined}
            />
          ))
        : null}
      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: lineColor }}
      />
      <circle cx={geo.last.x} cy={geo.last.y} r={1.8} style={{ fill: dotFill }} />
      {showLabel ? (
        <text
          x={width + 3}
          y={labelY}
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
