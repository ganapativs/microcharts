// <BurnChart> — will we finish on time? A dashed plan line, the
// solid actual line to today, and a dotted projection whose slope is a linear
// fit over the last k actual points — provisional by construction, never a
// smoothed or optimistic curve. Y zero-anchored.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_BURN, type BurnStrings } from "../../core/strings-burn.js";
import { BURN_PAD, burnGeometry, type BurnGeometry, type BurnMode } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export function burnSummary(
  geo: BurnGeometry,
  fmt: (n: number) => string,
  opts: { unit: string; work: string; mode: BurnMode; elapsed: number; total: number },
  strings: BurnStrings,
): string {
  // No actual points at all (empty, or every entry non-finite): there is no
  // measured remainder to report. Splicing `nowActual` here announced
  // "0 points remain" — "done" — for work nobody has recorded yet.
  if (opts.elapsed === 0) return strings.noData;
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
  /** Minimum in-chart label size, in viewBox units. Geometry sizes labels from
   *  the mark and floors them at 7; this raises that floor and moves the
   *  reserved gutter with it. A label the box cannot seat at the raised floor
   *  drops rather than shrinking back under it. */
  labelSize?: number | undefined;
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
    labelSize,
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

  const FONT = labelFont(height, 0.55, labelSize);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-burn-chart ${className}` : "mc-burn-chart";
  const { plan, actual } = data;

  const probe = burnGeometry({ width, height, plan, actual, mode, projection, domain });
  // `[...unit][0]`, not `charAt(0)`: charAt splits a surrogate pair, so a unit
  // noun starting outside the BMP put half a code point in the gutter.
  const unitInitial = [...unit][0] ?? "";
  const gapText = (delta: number) => `${delta > 0 ? "+" : ""}${delta} ${unitInitial}`;
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
        seat={{ mode: "floor", bottom: height - BURN_PAD }}
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
          // Counts come from the geometry, not the props: the geometry drops
          // non-finite entries before scaling, so the raw lengths describe a
          // longer series than the one on screen.
          { unit, work: workWord, mode, elapsed: geo.elapsed, total: geo.total },
          strings,
        ));
  const lineColor = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;
  // gap valence: late (positive delta) is bad, early is good — double-encoded
  // with the sign in the text, so the color never carries direction alone.
  // An ink ROLE, not an inline fill: `.mc-root` sets forced-color-adjust: none,
  // so an inline `var(--mc-negative)` survived verbatim into High Contrast Mode
  // (#BD4B2D reads 4.2:1 on a black Canvas, under the 4.5:1 text floor) and a
  // consumer could not restyle the numeral either. The role paints the same
  // tokens in the default themes and earns the forced-colors mapping.
  const gapInk =
    geo.landing && geo.landing.delta > 0
      ? "negative"
      : geo.landing && geo.landing.delta < 0
        ? "positive"
        : "label";

  // annotations host contract: Marker x = period index, Threshold/TargetZone y =
  // data values on the zero-anchored burn scale. Frame width is the plot `width`
  // (NOT geo.totalWidth) so overlays clamp to the plot, above the label gutter.
  const ann = resolveAnnotations(children, {
    x: scaleLinear([0, geo.spanEnd], [geo.pad, width - geo.pad]),
    y: scaleLinear(geo.domain, [geo.y1, geo.y0]),
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
      // plot box comes from the geometry so the seat can't drift from the scales.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
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
      {/* `muted` resolves to exactly the stroke this line already carried, so
          the role repaints nothing, and it earns the forced-colors mapping a
          literal `var(--mc-neutral)` cannot: `.mc-root` sets
          `forced-color-adjust: none`, which preserved the fixed gray verbatim
          in High Contrast Mode. The role maps it to GrayText. */}
      <line
        x1={geo.today.x}
        y1={1}
        x2={geo.today.x}
        y2={height - 1}
        data-mc-ink="muted"
        strokeOpacity={0.4}
        data-mc-w="hair"
        vectorEffect="non-scaling-stroke"
      />
      {geo.projection ? (
        <path
          d={geo.projection.d}
          fill="none"
          strokeDasharray="1 2"
          strokeOpacity={0.65}
          vectorEffect="non-scaling-stroke"
          style={{ stroke: lineColor, strokeWidth: "var(--mc-sw)" }}
        />
      ) : null}
      {geo.actual.d ? (
        <path
          d={geo.actual.d}
          data-mc-ink="data"
          fill="none"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: lineColor }}
        />
      ) : null}
      {/* geo.elapsed, not actual.length: with every entry non-finite the
          geometry plots nothing, and the raw length still painted a today-dot
          sitting on the zero floor — a mark reading "burned down to nothing"
          for work that was never recorded. */}
      {geo.elapsed > 0 ? (
        <circle
          cx={geo.today.x}
          cy={geo.today.y}
          r={1.8}
          data-mc-ink="accent"
          style={{ fill: lineColor }}
        />
      ) : null}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          data-mc-ink={gapInk}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
