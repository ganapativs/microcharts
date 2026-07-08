// <Ohlc> — each period's range and settlement (plan/22 #24, structured).
// Candles: hollow up-bodies / filled down-bodies — direction is shape-coded
// and survives grayscale print where green/red candles fail; valence tokens
// reinforce. Market up/down semantics are fixed: `positive` is ignored
// (documented). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter } from "../../core/format.js";
import { EN_OHLC, type OhlcStrings } from "../../core/strings-ohlc.js";
import { round2 } from "../../core/types.js";
import { ohlcGeometry, type OhlcInput } from "./geometry.js";

export type OhlcDatum = OhlcInput;

/** Factual OHLC run summary. Shared with the interactive entry. */
export function ohlcSummary(
  periods: readonly OhlcDatum[],
  fmt: (n: number) => string,
  pctFmt: (n: number) => string,
  strings: OhlcStrings,
): string {
  const valid = periods.filter(
    (p) =>
      [p.open, p.high, p.low, p.close].every(Number.isFinite) &&
      p.high >= p.low &&
      p.open >= p.low &&
      p.open <= p.high &&
      p.close >= p.low &&
      p.close <= p.high,
  );
  if (valid.length === 0) return strings.noData;
  const last = valid.at(-1)!;
  const first = valid[0]!;
  const change = first.open !== 0 ? (last.close - first.open) / Math.abs(first.open) : 0;
  const lo = Math.min(...valid.map((p) => p.low));
  const hi = Math.max(...valid.map((p) => p.high));
  return strings.ohlcRun(
    valid.length,
    fmt(last.close),
    change > 0 ? "up" : change < 0 ? "down" : "flat",
    pctFmt(Math.abs(change)),
    fmt(lo),
    fmt(hi),
  );
}

export interface OhlcProps {
  data: readonly OhlcDatum[];
  /** `"candle"` (default) | `"bars"` (open tick left, close tick right).
   *  (plan/21 §3 names this `style`; React reserves that for CSS — logged.) */
  variant?: "candle" | "bars" | undefined;
  /** Renders the most recent N with a dev warning past it (never averaged). */
  maxPeriods?: number | undefined;
  /** `"last"` = last close in a right gutter. */
  label?: "last" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: OhlcStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Ohlc(props: OhlcProps): ReactNode {
  const {
    data,
    variant = "candle",
    maxPeriods = 20,
    label = "none",
    domain,
    width = 80,
    height = 16,
    format,
    locale,
    strings = EN_OHLC,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const pctFmt = makeFormatter(format, locale, { style: "percent", maximumFractionDigits: 1 });
  const fontSize = Math.max(5, Math.min(Math.round(height * 0.4), 7));
  const lastClose = data.at(-1)?.close;
  const geo = ohlcGeometry({
    width,
    height,
    periods: data,
    maxPeriods,
    domain,
    gutterCh: label === "last" && Number.isFinite(lastClose) ? fmt(lastClose as number).length : 0,
    fontSize,
  });

  if (geo.truncated) {
    devWarn(
      `<Ohlc> ${data.length} periods — rendering the most recent ${maxPeriods}; OHLC cannot be downsampled without lying.`,
    );
  }
  if (geo.invalid.length > 0) {
    devWarn(
      "<Ohlc> corrupt periods (high < low or open/close outside range) skipped — corrupt market data must not render plausibly.",
    );
  }

  const accName = summary === false ? false : (summary ?? ohlcSummary(data, fmt, pctFmt, strings));
  const lastMark = geo.marks.at(-1);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-ohlc ${className}` : "mc-ohlc"}
      style={style}
    >
      {geo.marks.map((m) => {
        const ink = m.doji ? "neutral" : m.up ? "positive" : "negative";
        const stroke = m.doji
          ? "var(--mc-neutral)"
          : m.up
            ? "var(--mc-positive)"
            : "var(--mc-negative)";
        const bodyTop = Math.min(m.yO, m.yC);
        const bodyH = Math.max(Math.abs(m.yO - m.yC), 1);
        return (
          <g key={m.index}>
            <line
              x1={m.x}
              y1={m.yH}
              x2={m.x}
              y2={m.yL}
              stroke={stroke}
              vectorEffect="non-scaling-stroke"
              style={{ strokeWidth: 1 }}
            />
            {variant === "candle" ? (
              /* hollow up / filled down — the shape code */
              <rect
                x={round2(m.x - m.bodyW / 2)}
                y={bodyTop}
                width={m.bodyW}
                height={round2(bodyH)}
                shapeRendering="crispEdges"
                fill={m.up ? "var(--mc-surface, Canvas)" : stroke}
                stroke={stroke}
                strokeWidth={m.up ? 0.75 : 0}
                data-mc-ohlc={ink}
              />
            ) : (
              <>
                <line
                  x1={round2(m.x - m.bodyW / 2)}
                  y1={m.yO}
                  x2={m.x}
                  y2={m.yO}
                  stroke={stroke}
                  vectorEffect="non-scaling-stroke"
                  style={{ strokeWidth: 1 }}
                />
                <line
                  x1={m.x}
                  y1={m.yC}
                  x2={round2(m.x + m.bodyW / 2)}
                  y2={m.yC}
                  stroke={stroke}
                  vectorEffect="non-scaling-stroke"
                  style={{ strokeWidth: 1 }}
                />
              </>
            )}
          </g>
        );
      })}
      {label === "last" && lastMark && Number.isFinite(lastClose) ? (
        <text
          x={width - 1}
          y={Math.min(Math.max(lastMark.yC, fontSize * 0.55), height - fontSize * 0.55)}
          fontSize={fontSize}
          dominantBaseline="middle"
          textAnchor="end"
          data-mc-ink="accent"
        >
          {fmt(lastClose as number)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
