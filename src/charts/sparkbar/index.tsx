// <SparkBar> — discrete periods as bars (plan/05 §2, S1). Static, hook-free,
// RSC-safe. Zero-anchored bars; `mode="winloss"` collapses to a binary
// up/down streak. Negative bars take the negative token so direction is encoded
// by position AND color (plan/08 1.4.1). Endpoint bar gets accent emphasis.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { describeSeries, type DescribeOptions } from "../../core/summary.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { sparkBarGeometry, type Bar, type SparkBarMode } from "./geometry.js";

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
  /** `"bar"` (magnitude, default) or `"winloss"` (binary up/down streak). */
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

  const geo = sparkBarGeometry(data, { width, height, mode, domain, gap });
  const accName = summary === false ? false : (summary ?? describeSeries(data, { format, locale }));
  const fmt = makeFormatter(format, locale);
  const last = geo.bars.at(-1);

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
      {label === "last" && mode === "bar" && last && isFiniteValue(last.value) ? (
        <text
          x={Math.min(last.x + last.width + 3, width)}
          y={last.y}
          dominantBaseline="hanging"
          textAnchor="end"
          data-mc-ink="accent"
        >
          {fmt(last.value)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
