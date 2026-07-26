// <DepthWedge> — how much pressure is stacked on each side of the current level,
// and how wide the gap between them is. Two cumulative step-wedges meeting at the spread. The
// y-scale is linear and the visible range is stated — never a silent log.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_DEPTH_WEDGE, type DepthWedgeStrings } from "../../core/strings-depth-wedge.js";
import { depthWedgeGeometry, type DepthWedgeResult, type Level } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface DepthWedgeDatum {
  demand: readonly Level[];
  supply: readonly Level[];
}

export interface DepthWedgeProps {
  data: DepthWedgeDatum;
  /** ± level distance from mid to include; the wedge shape depends on it. */
  levels?: number | undefined;
  /** The gap is the headline number. */
  label?: "spread" | "none" | undefined;
  /** Plot cumulative shares per side instead of absolute amounts. */
  normalize?: boolean | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: DepthWedgeStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — the lead side, its ratio, and the spread (range-scoped). */
export function depthWedgeSummary(
  geo: DepthWedgeResult,
  strings: DepthWedgeStrings,
  fmt: (n: number) => string,
): string {
  if (geo.demandTotal === 0 && geo.supplyTotal === 0) return strings.noData;
  const spread = fmt(geo.spread);
  const [demandName, supplyName] = strings.depthWedgeSides;
  if (geo.lead === 0) return strings.depthWedgeBalanced(spread, demandName, supplyName);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const leadSide = geo.lead > 0 ? demandName : cap(supplyName);
  const laggSide = geo.lead > 0 ? supplyName : low(demandName);
  return strings.depthWedge(leadSide, laggSide, fmt(geo.ratio), spread);
}

export function DepthWedge(props: DepthWedgeProps): ReactNode {
  const {
    data,
    levels,
    label = "spread",
    normalize = false,
    width = 100,
    height = 24,
    format,
    locale,
    strings = EN_DEPTH_WEDGE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const fmt = makeFormatter(format, locale);
  const fontSize = labelFont(height, 0.18);
  const geo = depthWedgeGeometry({
    demand: data.demand,
    supply: data.supply,
    levels: levels ?? null,
    normalize,
    width,
    height,
  });
  const accName = resolveSummary(summary, () => depthWedgeSummary(geo, strings, fmt));
  // the spread rides a top gutter at `fontSize * 0.7`; `labelFont` floors at 7
  // viewBox units, so under a ~9-unit box that gutter is taller than the chart
  // and the readout hangs out of the bottom. It DROPS instead — the two wedges
  // and the mid hairline still read the balance, which is the primary encoding.
  const spreadY = fontSize * 0.7;
  const showSpread =
    label === "spread" &&
    data.demand.length > 0 &&
    data.supply.length > 0 &&
    labelFitsY(spreadY, fontSize, height);

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Both wedges accumulate upward from one shared baseline already flush
      // with the box bottom, so that edge is a true floor for the baseline. The
      // spread readout occupies a top gutter, which a floor seat never reads.
      seat={{ mode: "floor", bottom: geo.yBase }}
      className={className ? `mc-depth ${className}` : "mc-depth"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {/* The two wedges meet at the gap (midX): demand's inner edge is on the
          right, supply's on the left. Pinning each sweep to its inner edge keeps
          the spread stationary as they grow outward — instead of the gap
          visibly widening/closing under a center origin. */}
      {geo.demandPath ? (
        <path
          d={geo.demandPath}
          data-mc-ink="positive"
          data-mc-origin="right"
          fillOpacity={0.5}
          shapeRendering="crispEdges"
        />
      ) : null}
      {geo.supplyPath ? (
        <path
          d={geo.supplyPath}
          data-mc-ink="negative"
          data-mc-origin="left"
          fillOpacity={0.5}
          shapeRendering="crispEdges"
        />
      ) : null}
      <line
        x1={geo.midX}
        x2={geo.midX}
        y1={showSpread ? fontSize + 1 : 0.5}
        y2={height - 0.5}
        data-mc-ink="muted"
        data-mc-w="support"
        strokeDasharray="1.5 1.5"
        vectorEffect="non-scaling-stroke"
      />
      {showSpread ? (
        <text
          x={geo.midX}
          y={spreadY}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={fontSize}
          data-mc-ink="label"
        >
          {fmt(geo.spread)}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
