// <PercentileTrace> — one entity's standing drifting inside a population
// Because the series IS percentile rank, the y-axis is LOCKED to
// [0,100] and the population bands (p25–75, p5–95) are fixed rects, not
// estimates — the trace is the only line. The
// endpoint dot carries valence (`positive`); direction is also in the line, so
// the color is a redundant cue, never the sole signal.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { clamp, scaleLinear } from "../../core/scale.js";
import {
  EN_PERCENTILE_TRACE,
  type PercentileTraceStrings,
} from "../../core/strings-percentile-trace.js";
import { round2, type Polarity, type Value } from "../../core/types.js";
import { percentileGeometry, type PercentileGeometry } from "./geometry.js";

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
  showBands?: boolean | undefined;
  /** Which direction is good — colors the endpoint dot (default "up"). */
  positive?: Polarity | undefined;
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

/**
 * Right gutter reserved for the `label="last"` readout, in viewBox units — it
 * WIDENS the viewBox (`width + gutter`), so it is also the interactive entry's
 * pointer basis. Exported because the client must scale pointer x by the same
 * total the static drew with; scaling by bare `width` walks the crosshair
 * progressively rightward and puts the last readings out of reach.
 */
export const percentileGutter = (labelText: string, height: number): number =>
  labelText && percentileLabelFits(height)
    ? Math.ceil(labelText.length * labelFont(height) * 0.72) + 4
    : 0;

/**
 * Does the box have vertical room for the readout at all? `labelFont` floors at
 * 7 viewBox units, so under a 7-unit-tall box a line of text cannot be seated
 * inside the plot — it DROPS rather than spilling past the viewBox, and the
 * gutter above drops with it so the trace keeps its own width instead of
 * reserving space for text nobody draws. Exported for the same reason the
 * gutter is: both entries must reach the same answer. Pure arithmetic — the
 * static path may never measure text.
 */
export const percentileLabelFits = (height: number): boolean =>
  labelFitsY(height / 2, labelFont(height), height);

export function PercentileTrace(props: PercentileTraceProps): ReactNode {
  const {
    data,
    showBands = true,
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
        seat={{ mode: "floor", bottom: height - 2 }}
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

  const showLabel = label === "last" && percentileLabelFits(height);
  const labelText = showLabel ? pStr(geo.last.value) : "";
  const gutter = percentileGutter(labelText, height);

  const lineColor = color ?? "var(--mc-accent)";
  // endpoint valence: rising standing is good by default; the line already
  // carries direction, so this color is a redundant cue
  const good = positive === "down" ? geo.delta < 0 : geo.delta > 0;
  const dotFill = geo.delta === 0 ? lineColor : good ? "var(--mc-positive)" : "var(--mc-negative)";
  // `dominant-baseline: central` straddles y by half a font EACH way, so the
  // clamp is symmetric — an asymmetric margin let the bottom of the glyph box
  // hang out of a short viewBox. Below `height < FONT` no clamp exists at all,
  // and `showLabel` above has already dropped the readout.
  const labelY = round2(clamp(geo.last.y, FONT * 0.5, height - FONT * 0.5));

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
      // The axis is locked to [0,100], so the frame's bottom is a real p0 floor
      // the trace is measured against — it seats on the text baseline. The
      // population bands ride inside that frame and never move it.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={{ ...style, "--mc-label-size": `${FONT}px` } as CSSProperties}
    >
      {ann.under}
      {/* outer p5–95 field (faintest, half the band token) then the inner
          p25–75 middle half painted full-strength on top */}
      {showBands
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
