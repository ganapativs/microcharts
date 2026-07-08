// <PercentileLadder> — what does the tail look like, not just the median?
// (plan/23 #3, S1). Ticks at chosen percentiles on a zero-anchored track;
// graduated height + accent make the tail read strongest. Static, hook-free,
// RSC-safe. The origin is never cropped (tick distances are the story); a log
// transform is never silent — an in-chart `log` tag renders when it applies.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_QUANTILE, type QuantileStrings } from "../../core/strings-quantile.js";
import { round2, type Value } from "../../core/types.js";
import { percentileLadderGeometry, type PercentileLadderGeometry } from "./geometry.js";

/** Factual ladder summary. Shared with the interactive entry. */
export function ladderSummary(
  geo: PercentileLadderGeometry,
  fmt: (n: number) => string,
  ratioFmt: (n: number) => string,
  strings: QuantileStrings,
): string {
  if (geo.collapsed) return strings.ladderFlat(fmt(geo.ticks[0]!.value));
  const list = geo.ticks.map((t) => strings.ladderTick(String(t.p), fmt(t.value))).join(", ");
  const lastP = geo.ticks[geo.ticks.length - 1]!.p;
  const tailShare = `${round2(100 - lastP)}%`;
  const ratio = `${ratioFmt(geo.ratio)}×`;
  return strings.ladder(list, tailShare, ratio);
}

export interface PercentileLadderProps {
  /** Raw sample; the component derives the quantiles. */
  data: readonly Value[];
  /** Percentiles to mark (default `[50, 90, 99]`, 2–4 entries). */
  ps?: readonly number[] | undefined;
  /** `"linear"` (default) | `"log"` for long tails (falls back on any value ≤ 0). */
  scale?: "linear" | "log" | undefined;
  /** What the tick labels state (default `"ps"`). */
  label?: "values" | "ps" | "both" | "none" | undefined;
  /** Dot marks instead of ticks (over text). */
  dots?: boolean | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: QuantileStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const LABEL_MIN_WIDTH = 56;
// label size in viewBox units — a touch smaller than the strips (three labels
// must share the track), ~0.5·height clamped 6–9 (plan/12)
const labelFont = (height: number): number => Math.min(9, Math.max(6, Math.round(height * 0.5)));

/** Places tick labels at their tick x (clamped inside the box), ENDPOINT-FIRST:
 *  p50 and the tail always win; an interior label is dropped (→ null) when it
 *  would collide — so clustered percentiles never merge into unreadable text
 *  (plan/18 degradation — never measure, never overlap). */
export function ladderLabelLayout(
  geo: PercentileLadderGeometry,
  texts: readonly string[],
  width: number,
  font: number,
): (number | null)[] {
  const n = geo.ticks.length;
  const half = texts.map((t) => (t.length * font * 0.62) / 2);
  const clampX = (i: number) =>
    Math.min(width - 3 - half[i]!, Math.max(geo.track.x0 - 3 + half[i]!, geo.ticks[i]!.x));
  const out: (number | null)[] = Array.from({ length: n }, () => null);
  const boxes: { lo: number; hi: number }[] = [];
  const place = (i: number) => {
    const cx = clampX(i);
    const lo = cx - half[i]! - 1;
    const hi = cx + half[i]! + 1;
    if (boxes.some((b) => lo < b.hi && hi > b.lo)) return;
    out[i] = round2(cx);
    boxes.push({ lo, hi });
  };
  // endpoints first (p50 anchors the read, the tail is the point), then interiors
  if (n >= 1) place(n - 1);
  if (n >= 2) place(0);
  for (let i = 1; i < n - 1; i++) place(i);
  return out;
}

export function PercentileLadder(props: PercentileLadderProps): ReactNode {
  const {
    data,
    ps,
    scale = "linear",
    label = "ps",
    dots = false,
    domain,
    width = 80,
    height = 12,
    color,
    format,
    locale,
    strings = EN_QUANTILE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
  // scale="log" silently falls back to linear on any value ≤ 0 (docs note it);
  // the in-chart `log` tag renders only when the transform IS applied
  const geo = percentileLadderGeometry({ width, height, data, ps, scale, domain, font: FONT });

  const fmt = makeFormatter(format, locale);
  const ratioFmt = makeFormatter({ maximumFractionDigits: 1 }, locale);
  const cls = className ? `mc-percentile-ladder ${className}` : "mc-percentile-ladder";

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
    summary === false ? false : (summary ?? ladderSummary(geo, fmt, ratioFmt, strings));

  const k = geo.ticks.length;
  const rendered = geo.collapsed ? geo.ticks.slice(0, 1) : geo.ticks;

  const labelText = (p: number, value: number): string =>
    label === "values" ? fmt(value) : label === "both" ? `p${p} ${fmt(value)}` : String(p);

  const showLabels = label !== "none" && width >= LABEL_MIN_WIDTH;
  const texts = rendered.map((t) => labelText(t.p, t.value));
  const labelX = showLabels ? ladderLabelLayout(geo, texts, width, FONT) : null;
  // keep the alphabetic descender (≈0.22·fs) inside the viewBox
  const labelY = round2(height - FONT * 0.22 - 0.2);
  // pin the label size to viewBox units (see coverage-strip / plan/12)
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={rootStyle}
    >
      <line
        x1={geo.track.x0}
        y1={geo.track.y}
        x2={geo.track.x1}
        y2={geo.track.y}
        data-mc-ink="muted"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: 1 }}
      />
      {rendered.map((t) => {
        const tail = t.emphasis === k - 1;
        const opacity = k <= 1 ? 1 : 0.45 + 0.55 * (t.emphasis / (k - 1));
        const stroke = color ?? (tail ? "var(--mc-accent)" : undefined);
        return dots ? (
          <circle
            key={t.p}
            cx={t.x}
            cy={geo.track.y}
            r={tail ? 2 : 1.5}
            data-mc-ink={tail ? "flag" : "data"}
            style={{ fillOpacity: opacity, ...(stroke ? { fill: stroke } : null) }}
          />
        ) : (
          <line
            key={t.p}
            x1={t.x}
            y1={round2(geo.track.y - t.half)}
            x2={t.x}
            y2={round2(geo.track.y + t.half)}
            data-mc-ink={tail ? "flag" : "data"}
            vectorEffect="non-scaling-stroke"
            style={{
              // hardcoded (not the token) ONLY because this subpath is pinned at the 3 kB
              // hard cap and the token-var string costs ~20 B; base 1.5 == the default
              // --mc-stroke-width, so it matches peers at the default theme (plan/12).
              strokeWidth: tail ? 2 : 1.5,
              opacity,
              ...(stroke ? { stroke } : null),
            }}
          />
        );
      })}
      {labelX
        ? rendered.map((t, i) =>
            labelX[i] === null ? null : (
              <text
                key={t.p}
                x={labelX[i]!}
                y={labelY}
                textAnchor="middle"
                data-mc-ink="label"
                fontSize={FONT}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {texts[i]}
              </text>
            ),
          )
        : null}
      {geo.logTag ? (
        <text
          x={geo.logTag.x}
          y={geo.logTag.y}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fillOpacity: 0.7 }}
        >
          log
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
