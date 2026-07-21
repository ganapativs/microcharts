// <SparkBar> — discrete periods as bars. Static, hook-free,
// RSC-safe. Zero-anchored bars; `mode="winloss"` collapses magnitude to a
// three-state streak: win above the mid-line, loss below, tie (0) a thin
// neutral dash on it. Negative bars take the negative token so direction is encoded
// by position AND color. Endpoint bar gets accent emphasis.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { describeSeries, type DescribeOptions, resolveSummary } from "../../core/summary.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { labelMetrics, sparkBarGeometry, type Bar, type SparkBarMode } from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";

/** Ink role for a bar: valence color in win-loss / negatives, else neutral or
 *  accent for the endpoint. Position already encodes sign, so color is redundant
 *  reinforcement, never the sole channel. `positive="down"` flips which sign
 *  reads as the good outcome (StreakSpark semantics). */
function barInk(bar: Bar, mode: SparkBarMode, positive: "up" | "down" = "up"): string {
  const down = positive === "down";
  if (mode === "winloss") {
    if (bar.sign === 0) return "bar"; // zero = neutral, not a win
    return (down ? bar.sign < 0 : bar.sign > 0) ? "positive" : "negative";
  }
  if (bar.sign < 0) return down ? "positive" : "negative";
  return bar.last ? "accent" : "bar";
}

export interface SparkBarProps {
  data: readonly Value[];
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** `"bar"` (magnitude, default) or `"winloss"` (win/loss/tie streak: sign only). */
  mode?: SparkBarMode | undefined;
  /** Empty fraction of each slot between bars (0–0.9). */
  gap?: number | undefined;
  /** Direct endpoint value label (bar mode). */
  label?: "none" | "last" | undefined;
  /** Which sign is the good outcome: `"up"` (default) or `"down"`. */
  positive?: "up" | "down" | undefined;
  color?: string | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  format?: DescribeOptions["format"] | undefined;
  locale?: string | string[] | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function SparkBar(props: SparkBarProps): ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    mode = "bar",
    gap = 0.25,
    label = "none",
    positive = "up",
    color,
    title,
    summary,
    format,
    locale,
    id,
    className,
    style,
    children,
  } = props;

  const accName = resolveSummary(summary, () => describeSeries(data, { format, locale }));
  const fmt = makeFormatter(format, locale);

  // The endpoint label reserves a deterministic right gutter BEFORE geometry, so
  // bars never sit under it.
  let labelText: string | undefined;
  if (label === "last" && mode === "bar") {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i];
      if (isFiniteValue(v)) {
        labelText = fmt(v);
        break;
      }
    }
  }
  const metrics = labelText !== undefined ? labelMetrics(labelText, width, height) : undefined;
  const geo = sparkBarGeometry(data, {
    width,
    height,
    mode,
    domain,
    gap,
    gutterRight: metrics?.gutter ?? 0,
  });
  const last = geo.bars[geo.bars.length - 1];

  // annotations host contract: Marker x = data INDEX (bar slot
  // center), Threshold/TargetZone y = data values (sign space in win-loss).
  const ann = resolveAnnotations(children, {
    x: (i) => geo.x0 + i * geo.slot + geo.slot / 2,
    y: scaleLinear(geo.domain, [height - 1, 1]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = metrics
    ? { ...style, "--mc-label-size": `${metrics.fontSize}px` }
    : (style as CSSProperties);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Two seats from one chart, which is why this can't be a static table:
      // bar mode has a real zero floor already flush at `y1 = height`, so it
      // stands on the baseline like a letter; win-loss is a symmetric mid-line
      // with no floor, so it centres on the cap band instead.
      seat={
        mode === "winloss"
          ? { mode: "center", top: geo.y0, bottom: geo.y1 }
          : { mode: "floor", bottom: geo.y1 }
      }
      className={className ? `mc-sparkbar ${className}` : "mc-sparkbar"}
      style={rootStyle}
    >
      {ann.under}
      {geo.bars.map((bar) => (
        <rect
          key={bar.index}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          shapeRendering="crispEdges"
          data-mc-ink={barInk(bar, mode, positive)}
          style={color && barInk(bar, mode, positive) === "bar" ? { fill: color } : undefined}
        />
      ))}
      {labelText !== undefined && metrics && last ? (
        <text
          x={round2(last.x + last.width + 4)}
          y={round2(
            Math.min(Math.max(last.y, metrics.fontSize * 0.6), height - metrics.fontSize * 0.6),
          )}
          fontSize={metrics.fontSize}
          dominantBaseline="central"
          textAnchor="start"
          data-mc-ink="accent"
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
