// <Sparkline> — the load-bearing default (plan/05 §2, the S1 trend view).
// Static, hook-free, listener-free → RSC-safe, SSR-static, zero client JS
// (plan/03). Line / smooth / step, optional area fill, normal-range band,
// endpoint / min-max dots, direct endpoint label, and an annotation-child
// layer. Interactivity lives in the separate `./interactive` entry (plan/04 §4).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { linePath, smoothPath, stepPath, areaPath, type Curve } from "../../core/path.js";
import { describeSeries, type DescribeOptions } from "../../core/summary.js";
import { isFiniteValue, type Value } from "../../core/types.js";
import { sparkGeometry } from "./geometry.js";

const CURVE: Record<Curve, (p: readonly (readonly [number, number] | null)[]) => string> = {
  linear: linePath,
  smooth: smoothPath,
  step: stepPath,
};

export interface SparklineProps {
  /** The series. `null`/`NaN`/`±Infinity` are gaps (plan/09). `data` alone renders. */
  data: readonly Value[];
  /** Fixed y-domain `[min, max]`; auto-fit to the data when omitted. */
  domain?: readonly [number, number];
  /** viewBox width/height in integer units (plan/03 §3). */
  width?: number;
  height?: number;
  /** Line shape (plan/04). */
  curve?: Curve;
  /** Fill the area under the line; switches to a zero-anchored domain (plan/05). */
  fill?: boolean;
  /** Constant normal-range `[lo, hi]` in data units, drawn lowest z (plan/05). */
  band?: readonly [number, number];
  /** Endpoint dot (`"auto"`, default), `+` min/max dots (`"minmax"`), or `"none"`. */
  dots?: "auto" | "minmax" | "none";
  /** Direct endpoint value label (plan/18 anchored, no measurement). */
  label?: "none" | "last";
  /** Series color override (any CSS color); `prop > CSS var > preset` (plan/04). */
  color?: string;
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  title?: string;
  summary?: string | false;
  /** Number formatting for the label + summary (`Intl` options or a fn). */
  format?: DescribeOptions["format"];
  locale?: string | string[];
  /** Explicit id root (stable ids across hydration). */
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Annotation layer: `<Threshold>`, `<Marker>`, `<TargetZone>` … (plan/04 §8). */
  children?: ReactNode;
}

export function Sparkline(props: SparklineProps): ReactNode {
  const {
    data,
    domain,
    width = 80,
    height = 20,
    curve = "linear",
    fill = false,
    band,
    dots = "auto",
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

  const geo = sparkGeometry(data, { width, height, domain, zero: fill, band });
  const d = CURVE[curve](geo.points);

  const accName = summary === false ? false : (summary ?? describeSeries(data, { format, locale }));

  const strokeStyle = color ? { stroke: color } : undefined;
  const fillStyle = color ? { fill: color } : undefined;
  const fmt =
    typeof format === "function"
      ? format
      : (n: number) => new Intl.NumberFormat(locale, format).format(n);

  const showMinMax = dots === "minmax";
  const showEndpoint = dots !== "none";

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-spark ${className}` : "mc-spark"}
      style={style}
    >
      {geo.band ? (
        <rect
          x={geo.band.x}
          y={geo.band.y}
          width={geo.band.width}
          height={geo.band.height}
          data-mc-ink="band"
        />
      ) : null}
      {fill && d ? (
        <path d={areaPath(geo.points, geo.baselineY, curve)} data-mc-ink="fill" style={fillStyle} />
      ) : null}
      {d ? (
        <path d={d} vectorEffect="non-scaling-stroke" data-mc-ink="data" style={strokeStyle} />
      ) : null}
      {showMinMax && geo.min && geo.max && geo.min.index !== geo.max.index ? (
        <>
          <circle cx={geo.min.x} cy={geo.min.y} r={1.5} data-mc-ink="point" />
          <circle cx={geo.max.x} cy={geo.max.y} r={1.5} data-mc-ink="point" />
        </>
      ) : null}
      {showEndpoint && geo.last ? (
        <circle cx={geo.last.x} cy={geo.last.y} r={2} data-mc-ink="accent" />
      ) : null}
      {label === "last" && geo.last && isFiniteValue(geo.last.value) ? (
        <text
          x={geo.last.x + 3}
          y={geo.last.y}
          dominantBaseline="middle"
          textAnchor="start"
          data-mc-ink="accent"
        >
          {fmt(geo.last.value)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
