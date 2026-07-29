// <Sparkline> — the load-bearing default.
// Line / smooth / step, optional area fill, normal-range band,
// endpoint / min-max dots, direct endpoint label, and an annotation-child
// layer. Interactivity lives in the separate `./interactive` entry.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { linePath, smoothPath, stepPath, areaPath, type Curve } from "../../core/path.js";
import {
  describeSeries,
  type DescribeOptions,
  type SeriesStrings,
  resolveSummary,
} from "../../core/summary.js";
import { lastFinite } from "../../core/stats.js";
import { labelFitsY } from "../../core/labels.js";
import { chartSide, type Value } from "../../core/types.js";
import { labelMetrics, sparkGeometry } from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter } from "../../core/format.js";

const CURVE: Record<Curve, (p: readonly (readonly [number, number] | null)[]) => string> = {
  linear: linePath,
  smooth: smoothPath,
  step: stepPath,
};

export interface SparklineProps {
  /** The series. `null`/`NaN`/`±Infinity` are gaps. `data` alone renders. */
  data: readonly Value[];
  /** Fixed y-domain `[min, max]`; auto-fit to the data when omitted. */
  domain?: readonly [number, number] | undefined;
  /** viewBox width/height in integer units. */
  width?: number | undefined;
  height?: number | undefined;
  /** Line shape. */
  curve?: Curve | undefined;
  /** Fill the area under the line; switches to a zero-anchored domain. */
  fill?: boolean | undefined;
  /** Constant normal-range `[lo, hi]` in data units, drawn lowest z. */
  band?: readonly [number, number] | undefined;
  /** Endpoint dot (`"auto"`, default), `+` min/max dots (`"minmax"`), or `"none"`. */
  dots?: "auto" | "minmax" | "none" | undefined;
  /** Direct value labels (no measurement): the endpoint (`"last"`) or the extremes (`"minmax"`). */
  label?: "none" | "last" | "minmax" | undefined;
  /** Series color override (any CSS color); `prop > CSS var > preset`. */
  color?: string | undefined;
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  /** Swappable summary strings (defaults to EN) — the accessible name is
   *  generated, so this is how a non-English host localizes it. */
  strings?: SeriesStrings | undefined;
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
  /** Annotation layer: `<Threshold>`, `<Marker>`, `<TargetZone>` …. */
  children?: ReactNode;
}

export function Sparkline(props: SparklineProps): ReactNode {
  const {
    data,
    domain,
    curve = "linear",
    fill = false,
    band,
    dots = "auto",
    label = "none",
    color,
    title,
    summary,
    strings,
    format,
    locale,
    maxPoints,
    id,
    className,
    style,
    children,
  } = props;

  // `Chart` clamps the FRAME, but every coordinate below is laid out against
  // these, so the raw props have to be clamped too or the marks land outside a
  // perfectly valid viewBox — `width={NaN}` drew `M2 18 L-2.5 10 L-7 2` inside
  // `viewBox="0 0 1 20"`. One helper, so the frame and the marks agree.
  const width = chartSide(props.width ?? 80, 80);
  const height = chartSide(props.height ?? 20, 20);

  const fmt = makeFormatter(format, locale);

  // The endpoint label reserves a deterministic right gutter BEFORE geometry,
  // so the text always lands inside the viewBox — nothing may paint outside
  // the chart's box (containment rule). No DOM measurement.
  const last = lastFinite(data);
  const labelText = label === "last" && last !== undefined ? fmt(last) : undefined;
  const fitted = labelText !== undefined ? labelMetrics(labelText, width, height) : undefined;
  // `labelMetrics` shrinks the figure to fit the gutter's WIDTH budget, down to
  // a 5-unit floor; nothing there answers whether the box is tall enough to seat
  // a line of it. Below that the readout DROPS — never painted half outside the
  // viewBox — and because the gutter below is `metrics?.gutter`, the reserved
  // space goes with it and the line reclaims the full width. Pure arithmetic:
  // the static path may never measure text.
  const metrics = fitted && labelFitsY(height / 2, fitted.fontSize, height) ? fitted : undefined;

  // "minmax" labels reserve top/bottom gutters BEFORE geometry and
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

  // annotations host contract: Marker x = data INDEX, Threshold/
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
    fontSize: annotationFontSize(height),
  });

  const accName = resolveSummary(summary, () => describeSeries(data, { format, locale, strings }));

  const strokeStyle = color ? { stroke: color } : undefined;
  const fillStyle = color ? { fill: color } : undefined;

  const showMinMax = dots === "minmax";
  const showEndpoint = dots !== "none";

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  // …and `minmax` paints text too: pinning only the `last` size left the two
  // extremum labels laid out at `mmFont` (5–9) but PAINTED at the inherited
  // `0.75em` (~12 units against 16px prose), which is how they escaped the top
  // of the viewBox. One pin, whichever mode is painting — the two are mutually
  // exclusive (`label` is a single enum).
  const pinFont = metrics?.fontSize ?? (mmFont || undefined);
  const rootStyle = pinFont
    ? { ...style, "--mc-label-size": `${pinFont}px` }
    : (style as CSSProperties);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A trace over a value range reads as standing on its own floor, so the
      // plot's bottom edge lands on the text baseline. `geo.plot.y1` — not the
      // viewBox — because a `label="minmax"` gutter lifts that floor, and the
      // seat has to follow the frame the line is actually drawn in.
      seat={{ mode: "floor", bottom: geo.plot.y1 }}
      className={className ? `mc-spark ${className}` : "mc-spark"}
      style={rootStyle}
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
            const text = fmt(m.value);
            const half = (text.length * mmFont * 0.62) / 2;
            // central + clamp = containment; if clamp lands on the mark, sit beside
            const hl = mmFont / 2 + 0.5,
              c = hl + 2;
            let y = Math.min(Math.max(m.y + (i ? c : -c), hl), height - hl);
            let x = Math.min(Math.max(m.x, half + 1), width - half - 1);
            if (Math.abs(y - m.y) < c) {
              const side = half + c;
              x = Math.min(
                Math.max(m.x + (m.x + side <= width - 1 ? side : -side), half + 1),
                width - half - 1,
              );
              y = Math.min(Math.max(m.y, hl), height - hl);
            }
            return (
              <text
                key={i ? "min" : "max"}
                x={x}
                y={y}
                fontSize={mmFont}
                textAnchor="middle"
                dominantBaseline="central"
                data-mc-ink="label"
              >
                {text}
              </text>
            );
          })
        : null}
      {labelText !== undefined && metrics && geo.last ? (
        <text
          x={geo.last.x + 6}
          /* `dominant-baseline: central` straddles y by HALF a font each way, so
             the clamp is symmetric — 0.55 reserved more than the box had and,
             with `min` applied last, pushed the figure off the TOP of a short
             viewBox. `metrics` above guarantees a valid range here. */
          y={Math.min(
            Math.max(geo.last.y, metrics.fontSize * 0.5),
            height - metrics.fontSize * 0.5,
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
