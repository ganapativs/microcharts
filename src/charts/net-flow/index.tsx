// <NetFlow> — in versus out, and where that leaves us net. Inflow
// area above a zero baseline, outflow mirrored below on ONE shared magnitude
// scale, with the net line (in − out) on top.
// Both directions share one scale (never independently balanced); areas anchor
// at zero both ways; the net sign is stated in TEXT (never color-alone).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter, withPlus, type Format } from "../../core/format.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { EN_NET_FLOW, type NetFlowStrings } from "../../core/strings-net-flow.js";
import { resolveSummary } from "../../core/summary.js";
import {
  netFlowGeometry,
  type NetFlowGeometry,
  type NetFlowMode,
  type NetFlowPeriod,
} from "./geometry.js";
import { resolveAnnotations, annotationFontSize } from "../../shared/annotations-host.js";

/** Signed value string — direction lives in the text, not the color. */
export function signedNet(net: number, fmt: (n: number) => string): string {
  return withPlus(net, fmt);
}

export function netFlowSummary(
  geo: NetFlowGeometry,
  fmt: (n: number) => string,
  strings: NetFlowStrings,
): string {
  if (geo.degenerate || geo.last === null) return strings.netFlowNoFlow(geo.n);
  return strings.netFlow(
    signedNet(geo.last.net, fmt),
    fmt(geo.last.in),
    fmt(geo.last.out),
    geo.netPositive,
    geo.n,
  );
}

export interface NetFlowProps {
  /** One period: inflow + outflow magnitudes (both ≥ 0). */
  data: readonly NetFlowPeriod[];
  /** Mirrored areas (default) or discrete mirrored columns for few periods. */
  mode?: NetFlowMode | undefined;
  /** The net line (in − out). Default `true` — areas alone answer "how much". */
  net?: boolean | undefined;
  /** Which direction is the good polarity — `"down"` for debt-paydown contexts. */
  positive?: "up" | "down" | undefined;
  /** `"last"` states the signed net in a right gutter. */
  label?: "last" | "none" | undefined;
  /** Symmetric magnitude bound (domain[1]); defaults to the data max. */
  domain?: readonly [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: NetFlowStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const AREA_OPACITY = 0.2;

export function NetFlow(props: NetFlowProps): ReactNode {
  const {
    data,
    mode,
    net = true,
    positive = "up",
    label = "last",
    domain,
    width = 80,
    height = 20,
    format,
    locale,
    strings = EN_NET_FLOW,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const cls = className ? `mc-net-flow ${className}` : "mc-net-flow";
  // Paths ignore the label gutter — one geometry pass, then widen the box.
  const geo = netFlowGeometry({ width, height, data, mode, domain });

  if (geo === null) {
    return (
      <Chart
        width={width}
        height={height}
        title={title}
        summary={resolveSummary(summary, () => strings.noData)}
        id={id}
        seat={{ mode: "center", top: 2, bottom: height - 2 }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const fmt = makeFormatter(format, locale);
  const FONT = label === "last" ? labelFont(height) : 0;
  const showLabel =
    FONT > 0 && !geo.degenerate && geo.last != null && labelFitsY(height / 2, FONT, height);
  const labelText = showLabel ? signedNet(geo.last!.net, fmt) : "";
  const totalWidth = showLabel ? width + Math.ceil(labelText.length * FONT * 0.72) + 4 : width;
  const labelX = width + 3;

  const accName = resolveSummary(summary, () => netFlowSummary(geo, fmt, strings));
  // color encodes valence (which direction is good), position encodes identity
  // (in always above, out always below) — the two channels are independent
  const inRole = positive === "down" ? "negative" : "positive";
  const outRole = positive === "down" ? "positive" : "negative";
  const rootStyle = showLabel
    ? ({ ...style, "--mc-label-size": `${FONT}px` } as CSSProperties)
    : style;
  const bars = geo.mode === "bars";

  const ann = children
    ? resolveAnnotations(children, {
        x: (i) => geo.points[Math.round(i)]?.x ?? Number.NaN,
        y: geo.yFor,
        width,
        height,
        fontSize: annotationFontSize(height),
      })
    : { under: null, over: null, rest: null };

  return (
    <Chart
      width={totalWidth}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Zero here is a MIDLINE, not a floor: inflow rises above it and outflow
      // mirrors below on the same scale, so the mark has no bottom to stand on.
      // Seating the padded plot frame puts that zero baseline on the cap band.
      seat={{ mode: "center", top: geo.y0, bottom: geo.y1 }}
      className={cls}
      style={rootStyle}
    >
      {ann.under}
      {geo.degenerate ? null : bars ? (
        <>
          {geo.inBars.map((b) =>
            b.height > 0 ? (
              <rect
                key={`i${b.x}`}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                data-mc-ink={inRole}
                style={{ fillOpacity: AREA_OPACITY + 0.25 }}
                shapeRendering="crispEdges"
              />
            ) : null,
          )}
          {geo.outBars.map((b) =>
            b.height > 0 ? (
              <rect
                key={`o${b.x}`}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                data-mc-ink={outRole}
                style={{ fillOpacity: AREA_OPACITY + 0.25 }}
                shapeRendering="crispEdges"
              />
            ) : null,
          )}
        </>
      ) : (
        <>
          <path d={geo.inArea.d} data-mc-ink={inRole} style={{ fillOpacity: AREA_OPACITY }} />
          <path d={geo.outArea.d} data-mc-ink={outRole} style={{ fillOpacity: AREA_OPACITY }} />
        </>
      )}
      <line
        x1={0}
        y1={geo.zeroY}
        x2={width}
        y2={geo.zeroY}
        stroke="var(--mc-neutral)"
        strokeOpacity={0.4}
        data-mc-w="hair"
        vectorEffect="non-scaling-stroke"
      />
      {net && !geo.degenerate ? (
        // stroke-width already comes from [data-mc-ink="data"] — no width role needed
        <path d={geo.netLine.d} data-mc-ink="data" vectorEffect="non-scaling-stroke" />
      ) : null}
      {net && !geo.degenerate && geo.last ? (
        <circle cx={geo.last.x} cy={geo.last.y} r={1.8} data-mc-ink="point" />
      ) : null}
      {showLabel ? (
        <text
          x={labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={FONT}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {labelText}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
