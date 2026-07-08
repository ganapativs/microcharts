// <Sparkline> — the load-bearing default (plan/05 §2, the S1 trend view).
// Static, hook-free, listener-free → RSC-safe, SSR-static, zero client JS
// (plan/03). Line / smooth / step, optional area fill, normal-range band,
// endpoint / min-max dots, direct endpoint label, and an annotation-child
// layer. Interactivity lives in the separate `./interactive` entry (plan/04 §4).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { linePath, smoothPath, stepPath, areaPath, type Curve } from "../../core/path.js";
import { describeSeries, type DescribeOptions } from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { type Value } from "../../core/types.js";
import { labelMetrics, sparkGeometry } from "./geometry.js";
import { resolveAnnotations } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter } from "../../core/format.js";

const CURVE: Record<Curve, (p: readonly (readonly [number, number] | null)[]) => string> = {
  linear: linePath,
  smooth: smoothPath,
  step: stepPath,
};

export interface SparklineProps {
  /** The series. `null`/`NaN`/`±Infinity` are gaps (plan/09). `data` alone renders. */
  data: readonly Value[];
  /** Fixed y-domain `[min, max]`; auto-fit to the data when omitted. */
  domain?: readonly [number, number] | undefined;
  /** viewBox width/height in integer units (plan/03 §3). */
  width?: number | undefined;
  height?: number | undefined;
  /** Line shape (plan/04). */
  curve?: Curve | undefined;
  /** Fill the area under the line; switches to a zero-anchored domain (plan/05). */
  fill?: boolean | undefined;
  /** Constant normal-range `[lo, hi]` in data units, drawn lowest z (plan/05). */
  band?: readonly [number, number] | undefined;
  /** Endpoint dot (`"auto"`, default), `+` min/max dots (`"minmax"`), or `"none"`. */
  dots?: "auto" | "minmax" | "none" | undefined;
  /** Direct value labels (plan/18 anchored, no measurement): the endpoint
   *  (`"last"`) or the extremes (`"minmax"`). */
  label?: "none" | "last" | "minmax" | undefined;
  /** Series color override (any CSS color); `prop > CSS var > preset` (plan/04). */
  color?: string | undefined;
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  title?: string | undefined;
  summary?: string | false | undefined;
  /** Number formatting for the label + summary (`Intl` options or a fn). */
  format?: DescribeOptions["format"] | undefined;
  locale?: string | string[] | undefined;
  /** Line-drawing point cap: series longer than this (default 200) decimate to
   *  an index-preserving min/max envelope — spikes and gaps survive, summaries
   *  and dots still come from the raw data. `Infinity` opts out. */
  maxPoints?: number | undefined;
  /** Explicit id root (stable ids across hydration). */
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
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
    maxPoints,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);

  // The endpoint label reserves a deterministic right gutter BEFORE geometry,
  // so the text always lands inside the viewBox — nothing may paint outside
  // the chart's box (containment rule, CLAUDE.md). No DOM measurement.
  const last = lastFinite(data);
  const labelText = label === "last" && last !== undefined ? fmt(last) : undefined;
  const metrics = labelText !== undefined ? labelMetrics(labelText, width, height) : undefined;

  // "minmax" labels reserve top/bottom gutters BEFORE geometry (plan/18) and
  // sit above the max / below the min — the only spots the data can't occupy.
  // Documented affordance: below ~28px tall the gutters would crush the plot,
  // so the labels are omitted (the summary still reads the range).
  const mmSize = Math.max(5, Math.min(Math.round(height * 0.22), 9));
  const mmFont = label === "minmax" && height >= (mmSize + 1) * 2 + 12 ? mmSize : 0;

  const geo = sparkGeometry(data, {
    width,
    height,
    domain,
    zero: fill,
    band,
    gutterRight: metrics?.gutter ?? 0,
    gutterTop: mmFont && mmFont + 1,
    gutterBottom: mmFont && mmFont + 1,
    maxPoints,
  });
  const d = CURVE[curve](geo.linePoints);

  // annotations host contract (plan/22 #28): Marker x = data INDEX, Threshold/
  // TargetZone y = data values. Non-annotation children pass through untouched
  // — zero render-tree change when no annotation children are present.
  const yScale = scaleLinear(geo.domain, [geo.plot.y1, geo.plot.y0]);
  const n = data.length;
  const ann = resolveAnnotations(children, {
    x: (i) =>
      n > 1
        ? geo.plot.x0 + (i * (geo.plot.x1 - geo.plot.x0)) / (n - 1)
        : (geo.plot.x0 + geo.plot.x1) / 2,
    y: yScale,
    width,
    height,
    fontSize: Math.max(5, Math.min(Math.round(height * 0.22), 9)),
  });

  const accName = summary === false ? false : (summary ?? describeSeries(data, { format, locale }));

  const strokeStyle = color ? { stroke: color } : undefined;
  const fillStyle = color ? { fill: color } : undefined;

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
      {ann.under}
      {fill && d ? (
        <path
          d={areaPath(geo.linePoints, geo.baselineY, curve)}
          data-mc-ink="fill"
          style={fillStyle}
        />
      ) : null}
      {d ? (
        <path d={d} vectorEffect="non-scaling-stroke" data-mc-ink="data" style={strokeStyle} />
      ) : null}
      {showMinMax && geo.min && geo.max && geo.min.index !== geo.max.index ? (
        <>
          {/* Skip an extremum dot that coincides with the endpoint: the accent
              endpoint dot already marks it, and stacking a second circle (plus a
              same-colour label) collapses into an unreadable blob at cell size. */}
          {!(showEndpoint && geo.last && geo.min.index === geo.last.index) ? (
            <circle cx={geo.min.x} cy={geo.min.y} r={1.5} data-mc-ink="point" />
          ) : null}
          {!(showEndpoint && geo.last && geo.max.index === geo.last.index) ? (
            <circle cx={geo.max.x} cy={geo.max.y} r={1.5} data-mc-ink="point" />
          ) : null}
        </>
      ) : null}
      {showEndpoint && geo.last ? (
        <circle cx={geo.last.x} cy={geo.last.y} r={2} data-mc-ink="accent" />
      ) : null}
      {mmFont && geo.min && geo.max
        ? /* a flat series has one extreme — labelling it twice is noise */
          (geo.min.index === geo.max.index ? [geo.max] : [geo.max, geo.min]).map((m, i) => {
            const kind = i ? "min" : "max";
            const text = fmt(m.value);
            const half = (text.length * mmFont * 0.62) / 2;
            return (
              <text
                key={kind}
                /* centered on the mark, clamped inside the viewBox (containment) */
                x={Math.min(Math.max(m.x, half + 1), width - half - 1)}
                y={i ? m.y + 3 : m.y - 3}
                fontSize={mmFont}
                textAnchor="middle"
                dominantBaseline={i ? "hanging" : undefined}
                data-mc-ink="label"
              >
                {text}
              </text>
            );
          })
        : null}
      {labelText !== undefined && metrics && geo.last ? (
        <text
          x={geo.last.x + 4}
          /* y clamped so ascenders/descenders stay inside the viewBox */
          y={Math.min(
            Math.max(geo.last.y, metrics.fontSize * 0.55),
            height - metrics.fontSize * 0.55,
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
