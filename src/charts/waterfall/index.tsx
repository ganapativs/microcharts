// <Waterfall> — how the deltas compose into the total (plan/22 #20). P&L in a
// cell. Sign is encoded by vertical direction from the running level AND by
// valence token — never color-alone. The zero-anchored total bar stays on by
// default: a waterfall without a grounded total is unverifiable. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue } from "../../core/types.js";
import { waterfallGeometry } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";

export type WaterfallDatum = MiniBarDatum;

/** Factual waterfall summary — endpoints + split gains/losses. Shared. */
export function waterfallSummary(
  data: readonly WaterfallDatum[],
  start: number,
  fmt: (n: number) => string,
  strings: FlowStrings,
): string {
  const deltas = data.map((d) => (isFiniteValue(d.value) ? d.value : 0));
  if (deltas.length === 0) return strings.noData;
  const end = deltas.reduce((s, d) => s + d, start);
  const gains = deltas.filter((d) => d > 0).reduce((s, d) => s + d, 0);
  const losses = deltas.filter((d) => d < 0).reduce((s, d) => s + d, 0);
  return strings.waterfall(
    fmt(start),
    fmt(end),
    deltas.length,
    `+${fmt(gains)}`,
    `−${fmt(Math.abs(losses))}`,
  );
}

export interface WaterfallProps {
  /** Signed deltas in order. */
  data: readonly WaterfallDatum[];
  /** Opening level (prior-period close). */
  start?: number | undefined;
  /** Zero-anchored closing total bar — the key back to reality. */
  total?: boolean | undefined;
  /** `"delta"` = signed value labels (deterministic drop-out). */
  label?: "none" | "delta" | undefined;
  /** `"down"` = decreases are good (cost breakdowns). */
  positive?: "up" | "down" | undefined;
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: FlowStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Waterfall(props: WaterfallProps): ReactNode {
  const {
    data,
    start = 0,
    total = true,
    positive = "up",
    domain,
    width = 70,
    height = 18,
    format,
    locale,
    strings = EN_FLOW,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = waterfallGeometry({
    width,
    height,
    deltas: data.map((d) => d.value),
    start,
    total,
    domain,
  });
  const fmt = makeFormatter(format, locale);
  const accName =
    summary === false ? false : (summary ?? waterfallSummary(data, start, fmt, strings));
  const goodSign = positive === "down" ? -1 : 1;

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-waterfall ${className}` : "mc-waterfall"}
      style={style}
    >
      {geo.connectors.map((c, i) => (
        <line
          key={`c${i}`}
          x1={c.x0}
          y1={c.y}
          x2={c.x1}
          y2={c.y}
          data-mc-ink="muted"
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: 0.75 }}
        />
      ))}
      {geo.bars.map((b) => (
        <rect
          key={b.index}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          shapeRendering="crispEdges"
          data-mc-ink={b.sign === 0 ? "neutral" : b.sign === goodSign ? "positive" : "negative"}
        />
      ))}
      {geo.totalBar ? (
        <rect
          x={geo.totalBar.x}
          y={geo.totalBar.y}
          width={geo.totalBar.w}
          height={geo.totalBar.h}
          shapeRendering="crispEdges"
          data-mc-ink="bar"
        />
      ) : null}
      {children}
    </Chart>
  );
}
