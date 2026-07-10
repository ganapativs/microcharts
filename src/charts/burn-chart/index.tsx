// <BurnChart> — will we finish on time? (plan/23 #8). A dashed plan line, the
// solid actual line to today, and a dotted projection whose slope is a linear
// fit over the last k actual points — provisional by construction, never a
// smoothed or optimistic curve. Static, hook-free, RSC-safe. Y zero-anchored.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_BURN, type BurnStrings } from "../../core/strings-burn.js";
import { burnGeometry, type BurnGeometry, type BurnMode } from "./geometry.js";

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
  /** Work-unit noun for the summary (default "points"). */
  work?: string | undefined;
  /** Period noun for the summary + gap label (default "day"). */
  unit?: string | undefined;
  /** `"gap"` states the signed schedule landing vs the deadline in a gutter. */
  label?: "gap" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
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
    work = "points",
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

  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.55)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-burn-chart ${className}` : "mc-burn-chart";
  const { plan, actual } = data;

  const probe = burnGeometry({ width, height, plan, actual, mode, projection, domain });
  const gapText = (delta: number) => `${delta > 0 ? "+" : ""}${delta} ${unit.charAt(0)}`;
  const showLabel = label === "gap" && probe?.landing != null;
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
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
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
          { unit, work, mode, elapsed: actual.length, total: plan.length },
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

  return (
    <Chart
      width={geo.totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={rootStyle}
    >
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
      {children}
    </Chart>
  );
}
