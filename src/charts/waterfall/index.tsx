// <Waterfall> — how the deltas compose into the total. P&L in a
// cell. Sign is encoded by vertical direction from the running level AND by
// valence token — never color-alone. The zero-anchored total bar stays on by
// default: a waterfall without a grounded total is unverifiable.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import { makeFormatter, unsigned, withPlus, type Format } from "../../core/format.js";
import { EN_FLOW, type FlowStrings } from "../../core/strings-flow.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { waterfallGeometry, placeWaterfallLabels } from "./geometry.js";
import type { MiniBarDatum } from "../mini-bar/index.js";
import { labelFont, textGutter } from "../../core/labels.js";
import { resolveSummary } from "../../core/summary.js";

export type WaterfallDatum = MiniBarDatum;

/** Endpoints + split gains/losses. */
export function waterfallSummary(
  data: readonly WaterfallDatum[],
  open: number,
  fmt: (n: number) => string,
  strings: FlowStrings,
): string {
  const deltas = data.map((d) => (isFiniteValue(d.value) ? d.value : 0));
  if (deltas.length === 0) return strings.noData;
  const end = deltas.reduce((s, d) => s + d, open);
  const gains = deltas.filter((d) => d > 0).reduce((s, d) => s + d, 0);
  const losses = deltas.filter((d) => d < 0).reduce((s, d) => s + d, 0);
  return strings.waterfall(
    fmt(open),
    fmt(end),
    deltas.length,
    withPlus(gains, fmt),
    `−${unsigned(fmt(Math.abs(losses)))}`,
  );
}

export interface WaterfallProps {
  /** Signed deltas in order. */
  data: readonly WaterfallDatum[];
  /** Opening level (prior-period close). */
  open?: number | undefined;
  /** Zero-anchored closing total bar — the key back to reality. */
  totalBar?: boolean | undefined;
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

export function Waterfall(props: WaterfallProps): ReactNode {
  const {
    data,
    totalBar = true,
    label = "delta",
    positive = "up",
    domain,
    width = 70,
    height = 18,
    format,
    locale,
    strings = EN_FLOW,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // The opening level is a caller prop and it seeds every running total. A
  // non-finite one made `lo`/`hi` NaN, which `clamp` quietly absorbed — so the
  // bars drew at plausible positions while the accessible name announced "From
  // NaN to NaN". The plot's own fallback is zero; the name has to use it too.
  const open = isFiniteValue(props.open) ? props.open : 0;

  const geo = waterfallGeometry({
    width,
    height,
    deltas: data.map((d) => d.value),
    open,
    total: totalBar,
    domain,
  });
  const fmt = makeFormatter(format, locale);
  const accName = resolveSummary(summary, () => waterfallSummary(data, open, fmt, strings));
  const goodSign = positive === "down" ? -1 : 1;

  // Direct value labels sit in a reserved band BELOW the plot (like the endpoint
  // gutter idiom): the viewBox grows downward, so the plot — and every
  // interactive overlay drawn over it — keeps its y∈[0,height] coordinates.
  const FONT = labelFont(height, 0.5, labelSize);
  const labelText = (v: number): string => `${v < 0 ? "−" : "+"}${unsigned(fmt(Math.abs(v)))}`;
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

  // Pin the label size in viewBox units. `styles.css` sets `font-size` on
  // `.mc-root text`, and a CSS declaration outranks the SVG presentation
  // attribute, so `fontSize={...}` alone is inert and the reserved gutters would
  // be sized for a font the browser never paints (see label-containment tests).
  const rootStyle = { ...style, "--mc-label-px": `${FONT}px` } as CSSProperties;

  return (
    <Chart
      width={width}
      height={viewH}
      title={title}
      summary={accName}
      id={id}
      // The domain always contains zero and the total bar is anchored to it, so
      // the floating steps read as standing on a ground plane — a floor, not a
      // midline. Two things the seat must dodge: the delta labels below the plot
      // (`viewH` > `height`) and the half-unit stroke reserve, so the anchor is
      // the plot floor `y1`, not the viewBox edge.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={className ? `mc-waterfall ${className}` : "mc-waterfall"}
      style={rootStyle}
    >
      {ann.under}
      {/* One path, not N−1 <line>s. The connectors carry identical paint, sit
          below every other mark and are excluded from the entrance (which
          selects `rect[data-mc-ink]`), so nothing needs them addressable —
          and a 100-step waterfall shipped 99 elements' worth of repeated
          attributes into the RSC HTML to draw what is one polyline. Same
          idiom as the Thermometer's tick rules. */}
      {geo.connectors.length ? (
        <path
          d={geo.connectors.map((c) => `M${c.x0} ${c.y}H${c.x1}`).join("")}
          fill="none"
          data-mc-ink="muted"
          data-mc-w="support"
          strokeOpacity={0.4}
          shapeRendering="crispEdges"
        />
      ) : null}
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
        >
          {labelText(data[l.index]!.value as number)}
        </text>
      ))}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
