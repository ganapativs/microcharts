// <EventRaster> — when did each source fire, and do sources fire together, in
// sequence, or not at all (plan/25 §5, plan/17 F18). Static, hook-free, RSC-safe.
// Vertical banding is the phenomenon; one tick is always one event (the only
// exception is the disclosed `overflow="bin"` mode).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_EVENT_RASTER, type EventRasterStrings } from "../../core/strings-event-raster.js";
import { eventRasterGeometry, LANE_CAP, rasterDomain, type RasterLaneInput } from "./geometry.js";

export type EventRasterDatum = RasterLaneInput;

export interface EventRasterProps {
  data: readonly EventRasterDatum[];
  /** Accents one lane, mutes the rest — the synchronization read. */
  emphasis?: string | undefined;
  /** Left-gutter lane names (default: on when ≤ 8 lanes). */
  labels?: boolean | undefined;
  /** `"bin"` switches an aliasing lane to per-bucket counts (disclosed). */
  overflow?: "bin" | "clip" | undefined;
  domain?: [number, number] | undefined;
  width?: number | undefined;
  height?: number | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: EventRasterStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const LANE_UNIT = 8;

/** Shared summary — lane/event totals, the busiest lane, binned disclosure. */
export function eventRasterSummary(
  data: readonly EventRasterDatum[],
  binnedLabels: readonly string[],
  strings: EventRasterStrings,
): string {
  const lanes = data.slice(0, LANE_CAP);
  if (lanes.length === 0) return strings.noData;
  let total = 0;
  let busy = lanes[0]!.label;
  let busyCount = -1;
  for (const lane of lanes) {
    const c = lane.events.filter((e) => Number.isFinite(e)).length;
    total += c;
    if (c > busyCount) {
      busyCount = c;
      busy = lane.label;
    }
  }
  let s = strings.eventRaster(lanes.length, total, busy, busyCount);
  if (binnedLabels.length > 0) s += strings.eventRasterBinned(binnedLabels.join(", "));
  return s;
}

export function EventRaster(props: EventRasterProps): ReactNode {
  const {
    data,
    emphasis,
    labels: labelsProp,
    overflow = "bin",
    domain: domainProp,
    width = 120,
    height: heightProp,
    strings = EN_EVENT_RASTER,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.length > LANE_CAP)
    devWarn(`<EventRaster> ${data.length} lanes — capped at ${LANE_CAP}.`);
  const lanesN = Math.max(1, Math.min(LANE_CAP, data.length));
  const height = heightProp ?? lanesN * LANE_UNIT;
  const labels = labelsProp ?? lanesN <= 8;
  const fontSize = Math.max(5, Math.min(Math.round((height / lanesN) * 0.7), 7));

  const gutter = labels
    ? Math.min(
        width * 0.45,
        Math.max(...data.slice(0, LANE_CAP).map((d) => d.label.length), 1) * fontSize * 0.66 + 4,
      )
    : 0;

  const domain = domainProp ?? rasterDomain(data);
  const geo = eventRasterGeometry({ data, domain, width, height, gutter, overflow });
  const binnedLabels = geo.lanes.filter((l) => l.binned).map((l) => l.label);
  const accName =
    summary === false ? false : (summary ?? eventRasterSummary(data, binnedLabels, strings));

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-raster ${className}` : "mc-raster"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {geo.lanes.map((lane) => {
        const active = emphasis ? lane.label === emphasis : true;
        const stroke = emphasis
          ? active
            ? "var(--mc-accent)"
            : "var(--mc-neutral)"
          : "var(--mc-stroke)";
        const cy = round2(lane.y + lane.laneH / 2);
        return (
          <g key={lane.label} opacity={emphasis && !active ? 0.4 : 1}>
            {lane.binned ? (
              lane.bins.map((b) => (
                <rect
                  key={b.x}
                  x={b.x}
                  y={round2(lane.y + lane.laneH * 0.2)}
                  width={b.width}
                  height={round2(lane.laneH * 0.6)}
                  shapeRendering="crispEdges"
                  style={{ fill: stroke, fillOpacity: b.opacity }}
                />
              ))
            ) : (
              <path
                d={lane.path}
                fill="none"
                stroke={stroke}
                strokeWidth={0.9}
                shapeRendering="crispEdges"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {labels ? (
              <text
                x={round2(gutter - 2)}
                y={cy}
                dominantBaseline="central"
                textAnchor="end"
                fontSize={fontSize}
                data-mc-ink="label"
              >
                {lane.label}
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

export { rasterDomain };
