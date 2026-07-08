// <SparkBar> — discrete periods as bars (plan/05 §2, S1). Static, hook-free,
// RSC-safe. Zero-anchored bars; `mode="winloss"` collapses magnitude to a
// three-state streak: win above the mid-line, loss below, tie (0) a thin
// neutral dash on it. Negative bars take the negative token so direction is encoded
// by position AND color (plan/08 1.4.1). Endpoint bar gets accent emphasis.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { describeSeries, type DescribeOptions } from "../../core/summary.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";
import { labelMetrics, sparkBarGeometry, type Bar, type SparkBarMode } from "./geometry.js";
import { resolveAnnotations } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";

/** Ink role for a bar: valence color in win-loss / negatives, else neutral or
 *  accent for the endpoint. Position already encodes sign, so color is redundant
 *  reinforcement, never the sole channel. */
function barInk(bar: Bar, mode: SparkBarMode): string {
  if (bar.sign < 0) return "negative";
  if (mode === "winloss") return bar.sign > 0 ? "positive" : "bar"; // zero = neutral, not a win
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

  const accName = summary === false ? false : (summary ?? describeSeries(data, { format, locale }));
  const fmt = makeFormatter(format, locale);

  // The endpoint label reserves a deterministic right gutter BEFORE geometry, so
  // bars never sit under it (plan/18; mirrors the Sparkline).
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
  const last = geo.bars.at(-1);

  // annotations host contract (plan/22 #28): Marker x = data INDEX (bar slot
  // center), Threshold/TargetZone y = data values (sign space in win-loss).
  const ann = resolveAnnotations(children, {
    x: (i) => geo.x0 + i * geo.slot + geo.slot / 2,
    y: scaleLinear(geo.domain, [height - 1, 1]),
    width,
    height,
    fontSize: Math.max(5, Math.min(Math.round(height * 0.22), 9)),
  });

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-sparkbar ${className}` : "mc-sparkbar"}
      style={style}
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
          data-mc-ink={barInk(bar, mode)}
          style={color && barInk(bar, mode) === "bar" ? { fill: color } : undefined}
        />
      ))}
      {labelText !== undefined && metrics && last ? (
        <text
          x={round2(last.x + last.width + 4)}
          y={round2(
            Math.min(Math.max(last.y, metrics.fontSize * 0.6), height - metrics.fontSize * 0.6),
          )}
          fontSize={metrics.fontSize}
          dominantBaseline="middle"
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
