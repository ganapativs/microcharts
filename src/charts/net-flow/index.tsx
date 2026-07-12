// <NetFlow> — in versus out, and where that leaves us net. Inflow
// area above a zero baseline, outflow mirrored below on ONE shared magnitude
// scale, with the net line (in − out) on top. Static, hook-free, RSC-safe.
// Both directions share one scale (never independently balanced); areas anchor
// at zero both ways; the net sign is stated in TEXT (never color-alone).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { makeFormatter } from "../../core/format.js";
import { EN_NET_FLOW, type NetFlowStrings } from "../../core/strings-net-flow.js";
import {
  netFlowGeometry,
  type NetFlowGeometry,
  type NetFlowMode,
  type NetFlowPeriod,
} from "./geometry.js";

/** Signed value string — direction lives in the text, not the color. */
export function signedNet(net: number, fmt: (n: number) => string): string {
  return net > 0 ? `+${fmt(net)}` : fmt(net);
}

/** Factual net-flow summary. Shared with the interactive entry. */
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
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
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

  const FONT = Math.min(11, Math.max(7, Math.round(height * 0.55)));
  const fmt = makeFormatter(format, locale);
  const cls = className ? `mc-net-flow ${className}` : "mc-net-flow";

  // probe to size the signed-net gutter
  const probe = netFlowGeometry({ width, height, data, mode, domain });
  const showLabel = label === "last" && probe != null && !probe.degenerate && probe.last != null;
  const labelText = showLabel ? signedNet(probe!.last!.net, fmt) : "";
  const gutterCh = showLabel ? labelText.length : 0;

  const geo = netFlowGeometry({ width, height, data, mode, domain, gutterCh, fontSize: FONT });

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

  const accName = summary === false ? false : (summary ?? netFlowSummary(geo, fmt, strings));
  // color encodes valence (which direction is good), position encodes identity
  // (in always above, out always below) — the two channels are independent
  const inRole = positive === "down" ? "negative" : "positive";
  const outRole = positive === "down" ? "positive" : "negative";
  const rootStyle = { ...style, "--mc-label-size": `${FONT}px` } as CSSProperties;
  const bars = geo.mode === "bars";

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
      {/* mirrored flow surfaces — pos/neg ink-role earns the forced-colors
          distinction; opacity dialed inline */}
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
      {/* zero baseline — the axis both directions read against */}
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
          x={geo.labelX}
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
      {children}
    </Chart>
  );
}
