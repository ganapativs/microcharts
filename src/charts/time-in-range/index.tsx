// <TimeInRange> — how much of the period was the metric inside its acceptable
// corridor, and which side did it miss on. Static,
// hook-free, RSC-safe. Zone order is semantic and immutable: the strip is read
// by position first, color second — a clinically proven grammar (AGP lineage).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont, labelFitsY } from "../../core/labels.js";
import { ON_FILL_INK } from "../../core/color.js";
import { EN_TIME_IN_RANGE, type TimeInRangeStrings } from "../../core/strings-time-in-range.js";
import { resolveSummary } from "../../core/summary.js";
import {
  timeInRangeGeometry,
  zonePercents,
  ZONE_ORDER,
  type Orientation,
  type TimeInRangeDatum,
  type ZoneKey,
} from "./geometry.js";

/** Ink role + opacity per zone: position carries the reading, hue confirms it.
 *  Severity is encoded by ink weight (opacity), never by hue alone. `above`/
 *  `severeAbove` have no dedicated ink role, so they borrow the shared
 *  categorical amber (--mc-cat-1), matching TapeGauge's warn-zone convention. */
const ZONE_INK: Record<ZoneKey, { ink: Record<string, string | number>; opacity: number }> = {
  severeBelow: { ink: { "data-mc-ink": "negative" }, opacity: 1 },
  below: { ink: { "data-mc-ink": "negative" }, opacity: 0.5 },
  in: { ink: { "data-mc-ink": "positive" }, opacity: 1 },
  above: { ink: { "data-mc-cat": 1 }, opacity: 0.72 },
  severeAbove: { ink: { "data-mc-cat": 1 }, opacity: 1 },
};

export interface TimeInRangeProps {
  data: TimeInRangeDatum;
  /** Vertical matches the clinical-column convention and fits KPI cards. */
  orientation?: Orientation | undefined;
  /** `"in"` = the headline read; `"all"` = per-zone audit; `"none"` = clean. */
  label?: "in" | "all" | "none" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  strings?: TimeInRangeStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Present-zone integer percents keyed by zone — label + summary read the same. */
export function zonePercentMap(data: TimeInRangeDatum): Partial<Record<ZoneKey, number>> {
  const keys = ZONE_ORDER.filter((k) => {
    const v = data[k];
    return typeof v === "number" && Number.isFinite(v) && v > 0;
  });
  const pcts = zonePercents(keys.map((k) => data[k] as number));
  const out: Partial<Record<ZoneKey, number>> = {};
  keys.forEach((k, i) => (out[k] = pcts[i]!));
  return out;
}

/** Shared summary — leads with the in-range headline, then the misses. */
export function timeInRangeSummary(data: TimeInRangeDatum, strings: TimeInRangeStrings): string {
  const pct = zonePercentMap(data);
  if (Object.keys(pct).length === 0) return strings.noData;
  // summary order: in, below, above, severe-low, severe-high (only present ones)
  const order: ZoneKey[] = ["in", "below", "above", "severeBelow", "severeAbove"];
  const nameByKey: Record<ZoneKey, string> = {
    severeBelow: strings.tirNames[0],
    below: strings.tirNames[1],
    in: strings.tirNames[2],
    above: strings.tirNames[3],
    severeAbove: strings.tirNames[4],
  };
  const clauses = order
    .filter((k) => pct[k] !== undefined)
    .map((k) => strings.tirClause(`${pct[k]}%`, nameByKey[k]));
  return strings.timeInRange(clauses.join(", "));
}

export function TimeInRange(props: TimeInRangeProps): ReactNode {
  const {
    data,
    orientation = "horizontal",
    label = "in",
    width = 80,
    height = 12,
    strings = EN_TIME_IN_RANGE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const geo = timeInRangeGeometry({ data, width, height, orientation });
  const pct = zonePercentMap(data);
  const fontSize = labelFont(Math.min(width, height), 0.55);
  const accName = resolveSummary(summary, () => timeInRangeSummary(data, strings));
  const horizontal = orientation !== "vertical";

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // One seat for both orientations: the zones always normalize to fill the
      // whole strip, so the strip is a fixed frame centred in the box and its
      // far edge is a frame edge, not a zero. Even the vertical column has
      // nothing to stand on — it centres on the cap band either way.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-tir ${className}` : "mc-tir"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.zones.flatMap((z) => {
        const paint = ZONE_INK[z.key];
        const showLabel =
          label === "all" || (label === "in" && z.key === "in") ? pct[z.key] : undefined;
        const span = horizontal ? z.width : z.height;
        const text = showLabel !== undefined ? `${showLabel}%` : undefined;
        // The percent lives INSIDE its zone rect, so it has to clear the rect on
        // BOTH axes: `span` along the strip, and — the part a short strip broke —
        // a full line of text across it. `labelFont` floors at 7 viewBox units,
        // so a 6-unit-tall strip can seat nothing and every percent DROPS; the
        // zones themselves are the encoding and still read. Pure arithmetic:
        // the static path may never measure text.
        const cy = round2(z.y + z.height / 2);
        const fits =
          text !== undefined &&
          span >= Math.max(14, text.length * fontSize * 0.62 + 2) &&
          labelFitsY(cy, fontSize, height);
        // flat siblings (no per-zone <g>) — the zone list is this chart's SSR
        // hot path; ink comes from an exact role (positive/negative/cat), never
        // "band" (that role would exempt the rect from the craft text-collision
        // check, hiding a real label-on-fill risk).
        const nodes = [
          <rect
            key={`r-${z.key}`}
            x={z.x}
            y={z.y}
            width={z.width}
            height={z.height}
            rx={0.5}
            shapeRendering="crispEdges"
            fillOpacity={paint.opacity}
            {...paint.ink}
          />,
        ];
        if (fits)
          nodes.push(
            <text
              key={`t-${z.key}`}
              x={round2(z.x + z.width / 2)}
              y={cy}
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight={600}
              fill={ON_FILL_INK}
            >
              {text}
            </text>,
          );
        return nodes;
      })}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
