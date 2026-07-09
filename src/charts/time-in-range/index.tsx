// <TimeInRange> — how much of the period was the metric inside its acceptable
// corridor, and which side did it miss on (plan/25 §1, plan/17 F6). Static,
// hook-free, RSC-safe. Zone order is semantic and immutable: the strip is read
// by position first, color second — a clinically proven grammar (AGP lineage).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { labelFont } from "../../core/labels.js";
import { EN_TIME_IN_RANGE, type TimeInRangeStrings } from "../../core/strings-time-in-range.js";
import {
  timeInRangeGeometry,
  zonePercents,
  ZONE_ORDER,
  type TimeInRangeDatum,
  type ZoneKey,
} from "./geometry.js";

/** Fill + opacity per zone: position carries the reading, hue confirms it.
 *  Severity is encoded by ink weight (opacity), never by hue alone. */
const ZONE_FILL: Record<ZoneKey, { fill: string; opacity: number }> = {
  severeBelow: { fill: "var(--mc-negative)", opacity: 1 },
  below: { fill: "var(--mc-negative)", opacity: 0.5 },
  in: { fill: "var(--mc-positive)", opacity: 1 },
  above: { fill: "var(--mc-cat-1)", opacity: 0.72 },
  severeAbove: { fill: "var(--mc-cat-1)", opacity: 1 },
};

export interface TimeInRangeProps {
  data: TimeInRangeDatum;
  /** Vertical matches the clinical-column convention and fits KPI cards. */
  orientation?: "horizontal" | "vertical" | undefined;
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
  const accName = summary === false ? false : (summary ?? timeInRangeSummary(data, strings));
  const horizontal = orientation !== "vertical";

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-tir ${className}` : "mc-tir"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.zones.map((z) => {
        const paint = ZONE_FILL[z.key];
        const showLabel =
          label === "all" || (label === "in" && z.key === "in") ? pct[z.key] : undefined;
        const span = horizontal ? z.width : z.height;
        const text = showLabel !== undefined ? `${showLabel}%` : undefined;
        const fits = text !== undefined && span >= Math.max(14, text.length * fontSize * 0.62 + 2);
        return (
          <g key={z.key}>
            <rect
              x={z.x}
              y={z.y}
              width={z.width}
              height={z.height}
              rx={0.5}
              shapeRendering="crispEdges"
              data-mc-ink="band"
              style={{ fill: paint.fill, fillOpacity: paint.opacity }}
            />
            {fits ? (
              <text
                x={round2(z.x + z.width / 2)}
                y={round2(z.y + z.height / 2)}
                dominantBaseline="central"
                textAnchor="middle"
                fontSize={fontSize}
                style={{ fill: "rgba(255,255,255,0.96)", fontWeight: 600 }}
              >
                {text}
              </text>
            ) : null}
          </g>
        );
      })}
      {children}
    </Chart>
  );
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
