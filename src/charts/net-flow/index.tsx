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
import { chartSide } from "../../core/types.js";
import {
  NET_FLOW_PAD,
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

/**
 * The `label="last"` net readout, or `null` when the box cannot seat it.
 *
 * Exported because the interactive entry reserves the SAME right gutter in its
 * own geometry pass. It used to decide that on `label` alone, so in a box too
 * short to seat the text the static dropped the label (viewBox = `width`) while
 * the client still reserved the gutter (`totalWidth = width + gutter`) — the
 * pointer map ran over a wider box than the one on screen and the crosshair and
 * readout chip drifted off the cursor.
 */
export function netFlowLabel(
  geo: NetFlowGeometry,
  height: number,
  label: "last" | "none",
  fmt: (n: number) => string,
  min?: number | undefined,
): { font: number; text: string } | null {
  if (label !== "last" || geo.degenerate || geo.last === null) return null;
  const font = labelFont(height, 0.55, min);
  // Degradation contract: a label the box can no longer seat is DROPPED, and
  // its reserved gutter goes with it.
  if (!labelFitsY(height / 2, font, height)) return null;
  return { font, text: signedNet(geo.last.net, fmt) };
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

// Presentation ATTRIBUTES, not inline style: `styles.css` is written at
// `:where()` zero specificity so a consumer rule can retune a chart, and an
// inline style is the one thing that cannot be overridden.
const AREA_OPACITY = 0.2;
// Columns are narrow where an area is broad — they need the extra weight to
// read as the same surface at the same value.
const BAR_OPACITY = 0.45;

export function NetFlow(props: NetFlowProps): ReactNode {
  const {
    data,
    mode,
    net = true,
    positive = "up",
    label = "last",
    domain,
    format,
    locale,
    strings = EN_NET_FLOW,
    labelSize,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  // `Chart` clamps the box it puts in the viewBox; the label gutter and the
  // seat are measured against the same clamped box so a non-finite prop cannot
  // put text or a baseline outside the frame (see `chartSide`).
  const width = chartSide(props.width ?? 80);
  const height = chartSide(props.height ?? 20);

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
        seat={{ mode: "center", top: NET_FLOW_PAD, bottom: height - NET_FLOW_PAD }}
        className={cls}
        style={style}
      >
        {children}
      </Chart>
    );
  }

  const fmt = makeFormatter(format, locale);
  const lab = netFlowLabel(geo, height, label, fmt, labelSize);
  const totalWidth = lab ? width + Math.ceil(lab.text.length * lab.font * 0.72) + 4 : width;

  const accName = resolveSummary(summary, () => netFlowSummary(geo, fmt, strings));
  // color encodes valence (which direction is good), position encodes identity
  // (in always above, out always below) — the two channels are independent
  const inRole = positive === "down" ? "negative" : "positive";
  const outRole = positive === "down" ? "positive" : "negative";
  const rootStyle = lab
    ? ({ ...style, "--mc-label-px": `${lab.font}px` } as CSSProperties)
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
          {/* Keyed by period index, not by x: in a box too narrow to separate
              the slots every column lands on the SAME x, and a coordinate key
              then collides — React drops the duplicates and columns vanish. */}
          {geo.inBars.map((b, i) =>
            b.height > 0 ? (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                data-mc-ink={inRole}
                fillOpacity={BAR_OPACITY}
                shapeRendering="crispEdges"
              />
            ) : null,
          )}
          {geo.outBars.map((b, i) =>
            b.height > 0 ? (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                data-mc-ink={outRole}
                fillOpacity={BAR_OPACITY}
                shapeRendering="crispEdges"
              />
            ) : null,
          )}
        </>
      ) : (
        <>
          <path d={geo.inArea.d} data-mc-ink={inRole} fillOpacity={AREA_OPACITY} />
          <path d={geo.outArea.d} data-mc-ink={outRole} fillOpacity={AREA_OPACITY} />
        </>
      )}
      {/* `muted` IS this line's paint — `fill: none; stroke: var(--mc-neutral)`,
          the attribute it replaces — so the role repaints nothing and earns the
          forced-colors mapping the literal could never have: `.mc-root` sets
          `forced-color-adjust: none`, so a fixed warm gray survived verbatim
          onto whatever Canvas the user chose. The role maps it to GrayText.
          (Same move, same reason, as ShiftHistogram's mirror axis. It buys no
          motion: a <line> is positioned by `x1`/`y1`, which are not CSS
          properties in any engine, so no line mark can travel.) */}
      <line
        x1={0}
        y1={geo.zeroY}
        x2={width}
        y2={geo.zeroY}
        data-mc-ink="muted"
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
      {lab ? (
        <text
          x={geo.labelX}
          y={geo.labelY}
          textAnchor="start"
          dominantBaseline="central"
          data-mc-ink="label"
          fontSize={lab.font}
        >
          {lab.text}
        </text>
      ) : null}
      {ann.over}
      {ann.rest}
    </Chart>
  );
}
