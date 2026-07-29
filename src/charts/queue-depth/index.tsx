// <QueueDepth> — is the backlog draining or growing? A
// zero-anchored stock area, a dashed capacity hairline, and above-capacity
// spans re-stroked in the negative ink (shape + color, never color alone). The
// endpoint label carries a trend glyph fit over the last quarter.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_QUEUE_DEPTH, type QueueDepthStrings } from "../../core/strings-queue-depth.js";
import { queueDepthGeometry, type QueueDepthGeometry } from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";
import { scaleLinear } from "../../core/scale.js";
import type { Value } from "../../core/types.js";
import { resolveSummary } from "../../core/summary.js";

export function queueSummary(
  geo: QueueDepthGeometry,
  fmt: (n: number) => string,
  strings: QueueDepthStrings,
): string {
  const capacityClause =
    geo.ratio !== null
      ? geo.breached
        ? strings.queueOver(fmt(Math.round(geo.ratio * 10) / 10))
        : strings.queueUnder
      : "";
  const trend =
    geo.trend === "up"
      ? strings.queueGrow
      : geo.trend === "down"
        ? strings.queueDrain
        : strings.queueFlat;
  return strings.queueDepth(fmt(geo.now), capacityClause, trend);
}

const GLYPH: Record<QueueDepthGeometry["trend"], string> = { up: "▴", down: "▾", flat: "" };

/**
 * The seat-gated right-gutter labels and, with them, the static's real viewBox
 * width. Exported as ONE function because both entries need the same answer:
 * the static draws with it, and the interactive entry must scale pointer x by
 * the same total — scaling by bare `width` shifts every hit rightward and puts
 * the last readings out of reach. `endText`/`capText` are `""` when seat-gated
 * off, which is also the "don't render it" signal.
 */
export function queueDepthLabels(
  geo: QueueDepthGeometry,
  opts: {
    width: number;
    height: number;
    capacity: number | undefined;
    label: "last" | "none";
    fmt: (n: number) => string;
  },
): { endText: string; capText: string; totalWidth: number } {
  const font = labelFont(opts.height);
  // Degradation: `labelFont` floors at 7 viewBox units, so under a 7-unit-tall
  // box neither readout can be seated inside the plot. Both DROP rather than
  // spilling past the viewBox, and the gutter below is derived from their text
  // so it drops with them — the area keeps its own width and simply stops
  // paying for text it no longer draws. Pure arithmetic: never measured.
  const fits = labelFitsY(opts.height / 2, font, opts.height);
  const showEnd = opts.label === "last" && fits;
  const end = geo.points[geo.points.length - 1]!;
  const endText = showEnd ? `${opts.fmt(end.value)}${GLYPH[geo.trend]}` : "";
  // the capacity label yields to the endpoint label when they'd overlap (seat-gate)
  const showCap =
    fits &&
    geo.capLabelY !== null &&
    opts.capacity !== undefined &&
    (!showEnd || Math.abs(geo.capLabelY - geo.labelY) >= font + 0.8);
  const capText = showCap ? opts.fmt(opts.capacity!) : "";
  // reserve the right gutter for whichever label is wider (containment)
  const gutterCh = Math.max(endText.length, capText.length);
  return {
    endText,
    capText,
    totalWidth: opts.width + (gutterCh > 0 ? Math.ceil(gutterCh * font * 0.72) + 4 : 0),
  };
}

export interface QueueDepthProps {
  /** Backlog depth per period (≥ 0). `null`/`NaN`/`±Infinity` are gaps. */
  data: readonly Value[];
  /**
   * Steady-state capacity (> 0); a dashed hairline + a seat-gated value label.
   * Non-finite or non-positive reads as no capacity — no hairline, no breach.
   */
  capacity?: number | undefined;
  /** Endpoint value + trend glyph (`"last"`, default) or nothing (`"none"`). */
  label?: "last" | "none" | undefined;
  /**
   * Fixed y-domain `[min, max]`; zero-anchored to the data + capacity
   * otherwise. Honored only as a finite ascending pair — anything else falls
   * back to the auto domain rather than flattening or inverting the scale.
   */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** Series color override (any CSS color); `prop > CSS var > preset`. */
  color?: string | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: QueueDepthStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function QueueDepth(props: QueueDepthProps): ReactNode {
  const {
    data,
    capacity,
    label = "last",
    domain,
    width = 80,
    height = 20,
    color,
    format,
    locale,
    strings = EN_QUEUE_DEPTH,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const FONT = labelFont(height);
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-queue-depth ${className}` : "mc-queue-depth";

  const geo = queueDepthGeometry({ width, height, data, capacity, domain, fontSize: FONT });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={{ mode: "floor", bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const end = geo.points[geo.points.length - 1]!;
  const { endText, capText, totalWidth } = queueDepthLabels(geo, {
    width,
    height,
    capacity,
    label,
    fmt,
  });
  const showEnd = endText !== "";
  const showCap = capText !== "";

  const accName = resolveSummary(summary, () => queueSummary(geo, fmt, strings));

  // annotations host contract: Marker x = data INDEX, Threshold/TargetZone y =
  // data values on the shared (zero-anchored) value scale. The frame width is
  // the `width` prop (the plot basis the points use), not the label-gutter
  // totalWidth.
  const xForIndex = scaleLinear([0, Math.max(1, data.length - 1)], [2, width - 2]);
  const ann = resolveAnnotations(children, {
    x: (i) => xForIndex(i),
    y: scaleLinear(geo.domain, [height - 2, 2]),
    width,
    height,
    fontSize: annotationFontSize(height),
  });

  const lineColor = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;
  // Breach valence: red is the story, so the endpoint dot AND its label flip to
  // it — the trend glyph already double-encodes direction, so color never
  // stands alone. An ink ROLE, not an inline fill: `.mc-root` sets
  // forced-color-adjust: none, so an inline `var(--mc-negative)` survived
  // verbatim into High Contrast Mode and a consumer could not restyle the
  // numeral either. Only the caller's own `color` stays inline.
  const endInk = geo.breached ? "negative" : "accent";
  const endStyle = !geo.breached && color ? { fill: color } : undefined;

  return (
    <Chart
      width={totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // A stock: the zero-anchored area's own baseline is the datum "queue
      // empty", so that floor belongs on the text baseline. The capacity
      // hairline floats inside the frame and never redefines the bottom.
      seat={{ mode: "floor", bottom: geo.y1 }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      <path d={geo.area} fill={lineColor} fillOpacity={0.22} stroke="none" />
      {geo.capacityY !== null ? (
        <line
          x1={0}
          y1={geo.capacityY}
          x2={width}
          y2={geo.capacityY}
          data-mc-ink="muted"
          data-mc-w="hair"
          strokeDasharray="2.5 2.5"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <path
        d={geo.line}
        data-mc-ink="accent"
        data-mc-w="support"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={color ? { stroke: color } : undefined}
      />
      {geo.breach ? (
        <path
          d={geo.breach}
          data-mc-ink="negative"
          data-mc-w="full"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <circle cx={end.x} cy={end.y} r={1.8} data-mc-ink={endInk} style={endStyle} />
      {showCap && geo.capLabelY !== null ? (
        <text
          x={geo.labelX}
          y={geo.capLabelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          data-mc-ink="label"
        >
          {capText}
        </text>
      ) : null}
      {showEnd ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          data-mc-ink={endInk}
          style={endStyle}
        >
          {endText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
