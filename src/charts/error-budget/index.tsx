// <ErrorBudget> — are we burning the error budget too fast to survive the
// window? Budget remaining vs the steady-burn diagonal (the pace
// that exactly spends the window). with faster burn-rate reference lines (the
// Google-SRE 1×/6×/14.4× CONVENTION — policy, not physics, so configurable and
// rendered as faint region context, never data ink).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_ERROR_BUDGET, type ErrorBudgetStrings } from "../../core/strings-error-budget.js";
import { errorBudgetGeometry, type ErrorBudgetGeometry } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { round2 } from "../../core/types.js";

export function errorBudgetSummary(
  geo: ErrorBudgetGeometry,
  fmt: (n: number) => string,
  rateFmt: (n: number) => string,
  opts: { unit: string; elapsed: number; total: number },
  strings: ErrorBudgetStrings,
): string {
  if (geo.exhausted) {
    return strings.errorBudgetExhausted(opts.unit, geo.exhausted.index + 1, opts.total);
  }
  return strings.errorBudget(
    fmt(geo.remaining.value),
    opts.elapsed,
    opts.total,
    opts.unit,
    rateFmt(geo.currentRate),
  );
}

export interface ErrorBudgetProps {
  /** Budget remaining (0–1) per elapsed step; index 0 = window start at 1.0. */
  data: readonly number[];
  /** Total steps in the SLO window (default = data.length → "now" is window end). */
  window?: number | undefined;
  /** Burn-rate reference multiples (default the SRE 1×/6×/14.4× convention). */
  rates?: readonly number[] | undefined;
  /** Period noun for the summary (default "day"). */
  unit?: string | undefined;
  /** `"remaining"` states the current budget % in a right gutter. */
  label?: "remaining" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: ErrorBudgetStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Percent formatting shared with the interactive entry. */
export const PCT: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 };
/** Burn multiple → 1-dp string (shared with the interactive entry). */
export const RATE_FMT = (n: number): string => `${Math.round(n * 10) / 10}`;

export function ErrorBudget(props: ErrorBudgetProps): ReactNode {
  const {
    data,
    rates,
    unit = "day",
    label = "remaining",
    width = 80,
    height = 20,
    color,
    format = PCT,
    locale,
    strings = EN_ERROR_BUDGET,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-error-budget ${className}` : "mc-error-budget";
  // matches the geometry's default inset; also the annotation scale below
  const pad = 2;
  // Budget remaining is a bounded 1→0 axis and the plot floor IS zero budget —
  // the exhaustion line — so the trace stands on the text baseline. The floor is
  // fixed by the pad, so it holds for the empty chart too and both align.
  const seat = { mode: "floor", bottom: height - pad } as const;

  // `window` is a caller prop and the summary reads it back as the denominator
  // ("at day 3 of 30"). A non-finite one printed "of NaN" into the accessible
  // name while the plot below it drew a perfectly ordinary elapsed axis, because
  // the geometry falls back to `data.length`. One fallback, used by both.
  const window = Number.isFinite(props.window) ? props.window : undefined;

  const probe = errorBudgetGeometry({ width, height, data, window, rates });
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box a line of text cannot be seated inside the plot at all. The readout
  // DROPS rather than spilling past the viewBox, and because the gutter is
  // derived from it the reserved space goes with it — the plot keeps its own
  // width and simply stops paying for text it no longer draws. Pure arithmetic:
  // the static path may never measure text.
  const showLabel = label === "remaining" && probe != null && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? fmt(probe!.remaining.value) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = errorBudgetGeometry({ width, height, data, window, rates, gutterCh, fontSize: FONT });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={seat}
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
        errorBudgetSummary(
          geo,
          fmt,
          RATE_FMT,
          { unit, elapsed: data.length, total: window ?? data.length },
          strings,
        ));
  const lineColor = color ?? "var(--mc-accent)";
  // burning faster than steady = remaining below the diagonal at "now" → danger
  const steadyAtNow = 1 - geo.nowElapsed;
  const danger = geo.remaining.value < steadyAtNow - 0.001 || geo.exhausted !== null;
  const endColor = danger ? "var(--mc-negative)" : lineColor;
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  // annotations host contract: Marker x = step position on the elapsed axis,
  // Threshold/TargetZone y = budget-remaining fractions (1 top → 0 bottom).
  const ann = resolveAnnotations(children, {
    x: (i) => geo.points[Math.round(i)]?.x ?? NaN,
    y: (v) => pad + (1 - v) * (height - 2 * pad),
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
      seat={seat}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {geo.wedges.map((w) => (
        <path
          key={w.rate}
          d={w.d}
          data-mc-ink="muted"
          fill="none"
          strokeOpacity={0.28}
          strokeDasharray="1 2"
          data-mc-w="hair"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <line
        x1={geo.diagonal.x1}
        y1={geo.diagonal.y1}
        x2={geo.diagonal.x2}
        y2={geo.diagonal.y2}
        data-mc-ink="muted"
        strokeOpacity={0.6}
        strokeDasharray="2.5 2.5"
        data-mc-w="support"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: lineColor }}
      />
      {geo.exhausted ? (
        // The exhaustion cross is ONE mark, so it is one path: two <line>s
        // repeated every attribute, and the entrance treated the two strokes as
        // two separate flags that could land on different beats.
        <path
          d={`M${round2(geo.exhausted.x - 1.6)} ${round2(height - 3.6)}l3.2 3.2M${round2(geo.exhausted.x - 1.6)} ${round2(height - 0.4)}l3.2 -3.2`}
          fill="none"
          data-mc-ink="flag"
          data-mc-w="support"
          vectorEffect="non-scaling-stroke"
          style={{ stroke: "var(--mc-negative)" }}
        />
      ) : (
        <circle
          cx={geo.remaining.x}
          cy={geo.remaining.y}
          r={1.8}
          data-mc-ink="accent"
          style={{ fill: endColor }}
        />
      )}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          // The role has to be here whatever the paint: it is what the entrance
          // reads to cast this readout into the closing beat with the other
          // voice marks, and what the forced-colors mapping keys off. Only the
          // danger hue is dynamic, so only that stays inline.
          data-mc-ink="label"
          style={danger ? { fill: "var(--mc-negative)" } : undefined}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
