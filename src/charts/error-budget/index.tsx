// <ErrorBudget> — are we burning the error budget too fast to survive the
// window? Budget remaining vs the steady-burn diagonal (the pace
// that exactly spends the window), with faster burn-rate reference lines (the
// Google-SRE 1×/6×/14.4× CONVENTION — policy, not physics, so configurable and
// rendered as faint region context, never data ink). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_ERROR_BUDGET, type ErrorBudgetStrings } from "../../core/strings-error-budget.js";
import { errorBudgetGeometry, type ErrorBudgetGeometry } from "./geometry.js";

/** Factual error-budget summary. Shared with the interactive entry. */
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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: ErrorBudgetStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PCT: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 0 };
/** Burn multiple → 1-dp string (shared with the interactive entry). */
export const RATE_FMT = (n: number): string => `${Math.round(n * 10) / 10}`;

export function ErrorBudget(props: ErrorBudgetProps): ReactNode {
  const {
    data,
    window,
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

  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.55)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-error-budget ${className}` : "mc-error-budget";

  const probe = errorBudgetGeometry({ width, height, data, window, rates });
  const showLabel = label === "remaining" && probe != null;
  const labelText = showLabel ? fmt(probe!.remaining.value) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = errorBudgetGeometry({ width, height, data, window, rates, gutterCh, fontSize: FONT });

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
      {/* faster burn-rate reference lines — faint policy context (region ink) */}
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
      {/* steady-burn diagonal — the pace that exactly spends the window */}
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
      {/* actual remaining line */}
      <path
        d={geo.line.d}
        data-mc-ink="data"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={{ stroke: lineColor }}
      />
      {/* exhaustion ✕ at the zero-crossing */}
      {geo.exhausted ? (
        <>
          <line
            x1={geo.exhausted.x - 1.6}
            y1={height - 2 - 1.6}
            x2={geo.exhausted.x + 1.6}
            y2={height - 2 + 1.6}
            data-mc-ink="flag"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--mc-negative)" }}
          />
          <line
            x1={geo.exhausted.x - 1.6}
            y1={height - 2 + 1.6}
            x2={geo.exhausted.x + 1.6}
            y2={height - 2 - 1.6}
            data-mc-ink="flag"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--mc-negative)" }}
          />
        </>
      ) : (
        <circle cx={geo.remaining.x} cy={geo.remaining.y} r={1.8} style={{ fill: endColor }} />
      )}
      {showLabel ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          style={{
            fontVariantNumeric: "tabular-nums",
            fill: danger ? "var(--mc-negative)" : "var(--mc-neutral)",
          }}
        >
          {labelText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
