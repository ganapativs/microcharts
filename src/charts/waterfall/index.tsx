// <Waterfall> — how the deltas compose into the total. P&L in a
// cell. Sign is encoded by vertical direction from the running level AND by
// valence token — never color-alone. The zero-anchored total bar stays on by
// default: a waterfall without a grounded total is unverifiable. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { waterfallGeometry, placeWaterfallLabels } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { textGutter } from "../../core/labels.js";
import { resolveSummary } from "../../core/summary.js";

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
  format?: Format | undefined;
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
    label = "none",
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
  const accName = resolveSummary(summary, () => waterfallSummary(data, start, fmt, strings));
  const goodSign = positive === "down" ? -1 : 1;

  // Direct value labels sit in a reserved band BELOW the plot (like the endpoint
  // gutter idiom): the viewBox grows downward, so the plot — and every
  // interactive overlay drawn over it — keeps its y∈[0,height] coordinates.
  const FONT = Math.min(9, Math.max(6, Math.round(height * 0.5)));
  const labelText = (v: number): string => `${v < 0 ? "−" : "+"}${fmt(Math.abs(v))}`;
  const labels =
    label === "delta"
      ? placeWaterfallLabels(
          geo.bars
            .map((b, i) => ({ b, v: data[i]!.value }))
            .filter(({ v }) => isFiniteValue(v) && v !== 0)
            .map(({ b, v }) => ({
              index: b.index,
              cx: b.x + b.w / 2,
              // 0.62·em/char over-estimate + the sign glyph and a little air
              w: textGutter(labelText(v as number).length, FONT, 2),
              priority: Math.abs(v as number),
            })),
          width,
        )
      : [];
  const band = labels.length > 0 ? FONT + 4 : 0;
  const viewH = height + band;
  const labelY = round2(height + FONT);

  // annotations host contract: Marker x = step index (bar center), Threshold/
  // TargetZone y = data values. The frame height is the value-plot `height`
  // (NOT viewH) so overlays stay in y∈[0,height], above the label band.
  const ann = resolveAnnotations(children, {
    x: (i) => {
      const b = geo.bars[Math.round(i)];
      return b ? b.x + b.w / 2 : NaN;
    },
    y: scaleLinear(geo.domain, [height - 0.5, 0.5]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  return (
    <Chart
      width={width}
      height={viewH}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-waterfall ${className}` : "mc-waterfall"}
      style={style}
    >
      {ann.under}
      {geo.connectors.map((c, i) => (
        <line
          key={`c${i}`}
          x1={c.x0}
          y1={c.y}
          x2={c.x1}
          y2={c.y}
          data-mc-ink="muted"
          data-mc-w="support"
          strokeOpacity={0.4}
          vectorEffect="non-scaling-stroke"
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
      {labels.map((l) => (
        <text
          key={`l${l.index}`}
          x={l.x}
          y={labelY}
          textAnchor="middle"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText(data[l.index]!.value as number)}
        </text>
      ))}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
