// <Ohlc> — each period's range and settlement.
// Candles: hollow up-bodies / filled down-bodies — direction is shape-coded
// and survives grayscale print where green/red candles fail; valence tokens
// reinforce. Market up/down semantics are fixed: `positive` is ignored
// (documented). Static, hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { labelFont } from "../../core/labels.js";
import { EN_OHLC, type OhlcStrings } from "../../core/strings-ohlc.js";
import { round2 } from "../../core/types.js";
import { ohlcGeometry, type OhlcInput } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { maxOf, minOf } from "../../core/scale.js";

export type OhlcDatum = OhlcInput;

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
  const lo = minOf(valid.map((p) => p.low));
  const hi = maxOf(valid.map((p) => p.high));
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
   * */
  mode?: "candle" | "bars" | undefined;
  /** Renders the most recent N with a dev warning past it (never averaged). */
  maxPeriods?: number | undefined;
  /** `"last"` = last close in a right gutter. */
  label?: "last" | "none" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
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
    mode = "candle",
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
  const fontSize = labelFont(height, 0.4);
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

  const accName = resolveSummary(summary, () => ohlcSummary(data, fmt, pctFmt, strings));
  const lastMark = geo.marks.at(-1);

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // The box floor is the range low, not a zero — but that is exactly
      // Sparkline's fitted-domain case, and candles read as columns standing in a
      // frame far more than as a symmetric glyph. Centring a 16-unit run of
      // candles would drop half the wicks below the baseline.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={className ? `mc-ohlc ${className}` : "mc-ohlc"}
      style={rootStyle}
    >
      {/* flat siblings, no per-mark <g> wrapper: up to maxPeriods (20) marks is
          this chart's SSR hot path. */}
      {geo.marks.flatMap((m) => {
        const ink = m.doji ? "neutral" : m.up ? "positive" : "negative";
        const stroke = m.doji
          ? "var(--mc-neutral)"
          : m.up
            ? "var(--mc-positive)"
            : "var(--mc-negative)";
        const bodyTop = Math.min(m.yO, m.yC);
        const bodyH = Math.max(Math.abs(m.yO - m.yC), 1);
        const wick = (
          <line
            key={`w${m.index}`}
            x1={m.x}
            y1={m.yH}
            x2={m.x}
            y2={m.yL}
            stroke={stroke}
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        );
        if (mode === "candle") {
          return [
            wick,
            /* hollow up / filled down — the shape code */
            <rect
              key={`b${m.index}`}
              x={round2(m.x - m.bodyW / 2)}
              y={bodyTop}
              width={m.bodyW}
              height={round2(bodyH)}
              shapeRendering="crispEdges"
              fill={m.up ? "var(--mc-surface, Canvas)" : stroke}
              stroke={stroke}
              data-mc-w={m.up ? "support" : undefined}
              strokeWidth={m.up ? undefined : 0}
              data-mc-ohlc={ink}
            />,
          ];
        }
        return [
          wick,
          <line
            key={`o${m.index}`}
            x1={round2(m.x - m.bodyW / 2)}
            y1={m.yO}
            x2={m.x}
            y2={m.yO}
            stroke={stroke}
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />,
          <line
            key={`c${m.index}`}
            x1={m.x}
            y1={m.yC}
            x2={round2(m.x + m.bodyW / 2)}
            y2={m.yC}
            stroke={stroke}
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />,
        ];
      })}
      {label === "last" && lastMark && Number.isFinite(lastClose) ? (
        <text
          x={width - 1}
          y={Math.min(Math.max(lastMark.yC, fontSize * 0.55), height - fontSize * 0.55)}
          fontSize={fontSize}
          dominantBaseline="central"
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
