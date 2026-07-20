// <BurnChart> — will we finish on time? A dashed plan line, the
// solid actual line to today, and a dotted projection whose slope is a linear
// fit over the last k actual points — provisional by construction, never a
// smoothed or optimistic curve. Static, hook-free, RSC-safe. Y zero-anchored.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_BURN, type BurnStrings } from "../../core/strings-burn.js";
import { burnGeometry, type BurnGeometry, type BurnMode } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

/** Factual burn summary. Shared with the interactive entry. */
export function burnSummary(
  geo: BurnGeometry,
  fmt: (n: number) => string,
  opts: { unit: string; work: string; mode: BurnMode; elapsed: number; total: number },
  strings: BurnStrings,
): string {
  const verb = opts.mode === "down" ? strings.burnRemain : strings.burnDone;
  const nowActual = fmt(geo.nowActual);
  if (geo.nowPlan === null)
    return strings.burnNoPlan(opts.elapsed, opts.unit, nowActual, opts.work, verb);
  const landing = geo.landing
    ? strings.burnLanding(geo.landing.delta, opts.unit)
    : strings.burnFlatlined;
  return strings.burn(
    opts.elapsed,
    opts.total,
    opts.unit,
    nowActual,
    opts.work,
    verb,
    fmt(geo.nowPlan),
    landing,
  );
}

export interface BurnChartProps {
  /** Remaining work per period (`mode="down"`) or completed (`"up"`). */
  data: { plan: readonly number[]; actual: readonly number[] };
  /** Burn-down (remaining → 0, default) or burn-up (done → scope). */
  mode?: BurnMode | undefined;
  /** The dotted projection to the deadline. Default true. */
  projection?: boolean | undefined;
  /** Work-unit noun for the summary and readout. Defaults to `strings.burnWork`
   *  ("points" in EN) so a localized bundle can replace it. */
  work?: string | undefined;
  /** Period noun for the summary + gap label (default "day"). */
  unit?: string | undefined;
  /** `"gap"` states the signed schedule landing vs the deadline in a gutter. */
  label?: "gap" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: BurnStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function BurnChart(props: BurnChartProps): ReactNode {
  const {
    data,
    mode = "down",
    projection = true,
    work,
    unit = "day",
    label = "gap",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_BURN,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // The work noun defaults from `strings`, not from a literal: it is rendered
  // display text, so an English default here would survive a localized bundle.
  const workWord = work ?? strings.burnWork;

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-burn-chart ${className}` : "mc-burn-chart";
  const { plan, actual } = data;

  const probe = burnGeometry({ width, height, plan, actual, mode, projection, domain });
  const gapText = (delta: number) => `${delta > 0 ? "+" : ""}${delta} ${unit.charAt(0)}`;
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel =
    label === "gap" && probe?.landing != null && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? gapText(probe!.landing!.delta) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = burnGeometry({
    width,
    height,
    plan,
    actual,
    mode,
    projection,
    domain,
    gutterCh,
    fontSize: FONT,
  });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const accName =
    summary === false
      ? false
      : (summary ??
        burnSummary(
          geo,
          fmt,
          { unit, work: workWord, mode, elapsed: actual.length, total: plan.length },
          strings,
        ));
  const lineColor = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;
  // gap valence: late (positive delta) is bad, early is good — double-encoded
  // with the sign in the text, so the color never carries direction alone
  const gapColor =
    geo.landing && geo.landing.delta > 0
      ? "var(--mc-negative)"
      : geo.landing && geo.landing.delta < 0
        ? "var(--mc-positive)"
        : "var(--mc-neutral)";

  // annotations host contract: Marker x = period index, Threshold/TargetZone y =
  // data values on the zero-anchored burn scale. Frame width is the plot `width`
  // (NOT geo.totalWidth) so overlays clamp to the plot, above the label gutter.
  const ann = resolveAnnotations(children, {
    x: scaleLinear([0, geo.spanEnd], [geo.pad, width - geo.pad]),
    y: scaleLinear(geo.domain, [height - geo.pad, geo.pad]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Zero-anchored: "nothing left to burn" is the bottom of the frame, and
      // that floor is the whole read, so it stands on the text baseline. The
      // pad comes from the geometry so the seat can't drift from the scales.
      seat={{ mode: "floor", bottom: height - geo.pad }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {/* plan line — dashed, muted, full length (the deadline is its end) */}
      {geo.plan.d ? (
        <path
          d={geo.plan.d}
          data-mc-ink="muted"
          data-mc-w="support"
          fill="none"
          strokeDasharray="2.5 2.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* today tick — a quiet vertical hairline */}
      <line
        x1={geo.today.x}
        y1={1}
        x2={geo.today.x}
        y2={height - 1}
        stroke="var(--mc-neutral)"
        strokeOpacity={0.4}
        data-mc-w="hair"
        vectorEffect="non-scaling-stroke"
      />
      {/* projection — dotted + provisional; the fitted slope, never optimistic */}
      {geo.projection ? (
        <path
          d={geo.projection.d}
          fill="none"
          strokeDasharray="1 2"
          strokeOpacity={0.65}
          vectorEffect="non-scaling-stroke"
          style={{ stroke: lineColor, strokeWidth: "var(--mc-stroke-width)" }}
        />
      ) : null}
      {/* actual line — solid accent, to today */}
      {geo.actual.d ? (
        <path
          d={geo.actual.d}
          data-mc-ink="data"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: lineColor }}
        />
      ) : null}
      {actual.length > 0 ? (
        <circle cx={geo.today.x} cy={geo.today.y} r={1.8} style={{ fill: lineColor }} />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums", fill: gapColor }}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
