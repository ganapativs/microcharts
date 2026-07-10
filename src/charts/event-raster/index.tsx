// <EventRaster> — when did each source fire, and do sources fire together, in
// sequence, or not at all (plan/25 §5, plan/17 F18). Static, hook-free, RSC-safe.
// Vertical banding is the phenomenon; one tick is always one event (the only
// exception is the disclosed `overflow="bin"` mode).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { labelFont } from "../../core/labels.js";
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
  domain?: readonly [number, number] | undefined;
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

const LANE_UNIT = 14;

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
  const laneH = height / lanesN;
  const fontSize = labelFont(laneH, 0.56);

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
      {/* zebra lane bands so each row reads as a distinct track */}
      {geo.lanes.map((lane, i) =>
        i % 2 === 1 ? (
          <rect
            key={`band-${lane.label}`}
            x={round2(gutter)}
            y={lane.y}
            width={round2(width - gutter)}
            height={lane.laneH}
            data-mc-ink="band"
            shapeRendering="crispEdges"
          />
        ) : null,
      )}
      {/* flat siblings, no per-lane <g> — up to LANE_CAP lanes puts this well
          past the >10-element SSR hot-path line; the dim multiplier is repeated
          as a plain `opacity` on each lane's own marks instead of one group */}
      {geo.lanes.flatMap((lane) => {
        const active = emphasis ? lane.label === emphasis : true;
        const dim = emphasis && !active ? 0.45 : 1;
        const ink = emphasis ? (active ? "accent" : "neutral") : undefined;
        const cy = round2(lane.y + lane.laneH / 2);
        const nodes: ReactNode[] = lane.binned
          ? lane.bins.map((b) => (
              <rect
                key={`b-${lane.label}-${b.x}`}
                x={b.x}
                y={round2(lane.y + lane.laneH * 0.16)}
                width={b.width}
                height={round2(lane.laneH * 0.68)}
                shapeRendering="crispEdges"
                data-mc-ink={ink ?? "bar"}
                opacity={dim}
                fillOpacity={b.opacity}
              />
            ))
          : [
              <path
                key={`p-${lane.label}`}
                d={lane.path}
                fill="none"
                // no-emphasis default stays a literal stroke (not the "data" ink
                // role): that role also sets stroke-width via CSS, which would
                // beat the literal strokeWidth below for THIS state only and
                // leave emphasized/muted lanes 0.1 thinner — every lane must
                // stay the same tick weight regardless of emphasis state
                data-mc-ink={ink}
                stroke={ink ? undefined : "var(--mc-stroke)"}
                strokeWidth={1.4}
                strokeLinecap="round"
                opacity={dim}
                vectorEffect="non-scaling-stroke"
              />,
            ];
        if (labels)
          nodes.push(
            <text
              key={`t-${lane.label}`}
              x={round2(gutter - 3)}
              y={cy}
              dominantBaseline="central"
              textAnchor="end"
              fontSize={fontSize}
              data-mc-ink="label"
              opacity={dim}
            >
              {lane.label}
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

export { rasterDomain };
