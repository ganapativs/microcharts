// <QueueDepth> — is the backlog draining or growing? A
// zero-anchored stock area, a dashed capacity hairline, and above-capacity
// spans re-stroked in the negative ink (shape + color, never color alone). The
// endpoint label carries a trend glyph fit over the last quarter. Static,
// hook-free, RSC-safe.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { makeFormatter } from "../../core/format.js";
import { EN_QUEUE_DEPTH, type QueueDepthStrings } from "../../core/strings-queue-depth.js";
import { queueDepthGeometry, type QueueDepthGeometry } from "./geometry.js";
import type { Value } from "../../core/types.js";

/** Factual backlog summary. Shared with the interactive entry. */
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

export interface QueueDepthProps {
  /** Backlog depth per period (≥ 0). `null`/`NaN`/`±Infinity` are gaps. */
  data: readonly Value[];
  /** Steady-state capacity; a dashed hairline + a seat-gated value label. */
  capacity?: number | undefined;
  /** Endpoint value + trend glyph (`"last"`, default) or nothing (`"none"`). */
  label?: "last" | "none" | undefined;
  /** Fixed y-domain `[min, max]`; zero-anchored to the data + capacity otherwise. */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  /** Series color override (any CSS color); `prop > CSS var > preset`. */
  color?: string | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
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
        summary={summary === false ? false : (summary ?? strings.noData)}
        id={id}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const end = geo.points[geo.points.length - 1]!;
  const showEnd = label === "last";
  const endText = showEnd ? `${fmt(end.value)}${GLYPH[geo.trend]}` : "";
  // the capacity label yields to the endpoint label when they'd overlap (seat-gate)
  const showCap =
    geo.capLabelY !== null &&
    capacity !== undefined &&
    (!showEnd || Math.abs(geo.capLabelY - geo.labelY) >= FONT + 0.8);
  const capText = showCap ? fmt(capacity!) : "";
  // reserve the right gutter for whichever label is wider (containment)
  const gutterCh = Math.max(showEnd ? endText.length : 0, showCap ? capText.length : 0);
  const totalWidth = width + (gutterCh > 0 ? Math.ceil(gutterCh * FONT * 0.72) + 4 : 0);

  const accName = summary === false ? false : (summary ?? queueSummary(geo, fmt, strings));
  const lineColor = color ?? "var(--mc-accent)";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;
  // breach valence: red is the story, so the endpoint label + dot flip to it —
  // the trend glyph already double-encodes direction, so color never stands alone
  const endColor = geo.breached ? "var(--mc-negative)" : lineColor;

  return (
    <Chart
      width={totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={cls}
      style={rootStyle}
    >
      {/* stock area — accent, zero-anchored, lowest z */}
      <path d={geo.area} fill={lineColor} fillOpacity={0.22} stroke="none" />
      {/* capacity hairline — muted, dashed */}
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
      {/* top edge — accent, support width */}
      <path
        d={geo.line}
        data-mc-ink="accent"
        data-mc-w="support"
        fill="none"
        vectorEffect="non-scaling-stroke"
        style={color ? { stroke: color } : undefined}
      />
      {/* above-capacity spans — negative, full width (shape + color) */}
      {geo.breach ? (
        <path
          d={geo.breach}
          data-mc-ink="negative"
          data-mc-w="full"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* endpoint dot — accent, or negative when breached */}
      <circle
        cx={end.x}
        cy={end.y}
        r={1.8}
        data-mc-ink={geo.breached ? "negative" : "accent"}
        style={!geo.breached && color ? { fill: color } : undefined}
      />
      {showCap && geo.capLabelY !== null ? (
        <text
          x={geo.labelX}
          y={geo.capLabelY}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={FONT}
          data-mc-ink="label"
          style={{ fontVariantNumeric: "tabular-nums" }}
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
          style={{ fontVariantNumeric: "tabular-nums", fill: endColor }}
        >
          {endText}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
