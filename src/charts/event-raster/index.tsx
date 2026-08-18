// <EventRaster> — when did each source fire, and do sources fire together, in
// sequence, or not at all.
// Vertical banding is the phenomenon; one tick is always one event (the only
// exception is the disclosed `overflow="bin"` mode).
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_EVENT_RASTER, type EventRasterStrings } from "../../core/strings-event-raster.js";
import {
  eventRasterGeometry,
  LANE_CAP,
  rasterDomain,
  rasterLabels,
  rasterWindow,
  resolveRasterDomain,
  type RasterLaneInput,
} from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";
import { maxOf } from "../../core/scale.js";
import { round2 } from "../../core/types.js";

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
  strings?: EventRasterStrings | undefined;
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

const LANE_UNIT = 14;

/**
 * Shared summary — lane/event totals, the busiest lane, binned disclosure.
 *
 * `domain` is the window the chart drew, and the counts are taken over it: an
 * explicit domain narrower than the data hides those events from the picture,
 * and a name announcing a total the reader cannot count is the one thing a
 * summary must never do. Omitted, it fits the data — every finite event, which
 * is what the default render shows.
 */
export function eventRasterSummary(
  data: readonly EventRasterDatum[],
  binnedLabels: readonly string[],
  strings: EventRasterStrings,
  domain: readonly [number, number] = rasterDomain(data),
): string {
  const lanes = data.slice(0, LANE_CAP);
  if (lanes.length === 0) return strings.noData;
  let total = 0;
  let busy = lanes[0]!.label;
  let busyCount = -1;
  for (const lane of lanes) {
    const c = rasterWindow(lane.events, domain).length;
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
    labelSize,
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
  // Lane names are seat-gated: they drop (and hand their gutter back to the
  // events) once a lane is under one em tall or the widest name outgrows its
  // share of the width — see `rasterLabels`, shared with the interactive entry.
  const {
    show: labels,
    gutter,
    fontSize,
  } = rasterLabels({
    labels: labelsProp ?? lanesN <= 8,
    width,
    height,
    lanes: lanesN,
    maxChars: maxOf(
      data.slice(0, LANE_CAP).map((d) => d.label.length),
      1,
    ),
    labelSize,
  });

  const domain = resolveRasterDomain(domainProp, data);
  const geo = eventRasterGeometry({ data, domain, width, height, gutter, overflow });
  const binnedLabels = geo.lanes.filter((l) => l.binned).map((l) => l.label);
  const accName = resolveSummary(summary, () =>
    eventRasterSummary(data, binnedLabels, strings, domain),
  );

  return (
    <Chart
      width={width}
      height={height}
      title={title}
      summary={accName}
      id={id}
      // Lanes are sources, not magnitudes — the bottom lane is the last row
      // rather than a floor, so the stack centres on the cap band. Lanes divide
      // the full height, and `labels` only takes a LEFT gutter from it.
      seat={{ mode: "center", top: 0, bottom: height }}
      className={className ? `mc-raster ${className}` : "mc-raster"}
      style={{ ...style, "--mc-label-px": `${fontSize}px` } as CSSProperties}
    >
      {geo.lanes.map((lane, i) =>
        i % 2 === 1 ? (
          <rect
            key={i}
            x={round2(gutter)}
            y={lane.y}
            width={round2(width - gutter)}
            height={lane.laneH}
            data-mc-ink="band"
          />
        ) : null,
      )}
      {/* flat siblings, no per-lane <g> — up to LANE_CAP lanes puts this well
          past the >10-element SSR hot-path line; the dim multiplier is repeated
          as a plain `opacity` on each lane's own marks instead of one group */}
      {geo.lanes.flatMap((lane, i) => {
        const active = emphasis ? lane.label === emphasis : true;
        const dim = emphasis && !active ? 0.7 : 1;
        // Ink roles are element-split in styles.css: a bucket is a filled rect
        // and takes the fill family, a tick path is an open stroke and takes the
        // stroked one. A muted lane used to take `neutral` for both — it is
        // fill-only, so on the tick path it set `stroke: none` and filled zero-
        // area verticals with nothing: every muted lane VANISHED under `emphasis`.
        const fillInk = emphasis ? (active ? "accent" : "neutral") : "bar";
        // One weight for every lane, whatever its emphasis state, and it comes
        // from `--mc-sw` so density and prefers-contrast retune the ticks. The
        // literal stroke this replaced was deaf to both, and it survived
        // forced-colors verbatim: the theme ink against the user's own
        // background is not a visible tick in High Contrast Mode.
        const strokeInk = emphasis ? (active ? "accent" : "muted") : "data";
        const cy = round2(lane.y + lane.laneH / 2);
        const nodes: ReactNode[] = lane.binned
          ? lane.bins.map((b, j) => (
              <rect
                key={`b-${i}-${j}`}
                x={b.x}
                y={round2(lane.y + lane.laneH * 0.16)}
                width={b.width}
                height={round2(lane.laneH * 0.68)}
                data-mc-ink={fillInk}
                opacity={dim}
                fillOpacity={b.opacity}
              />
            ))
          : [
              <path
                key={`p-${i}`}
                d={lane.path}
                // literal, and load-bearing: it is the only signal the accent
                // and forced-colors rules read to keep an open mark hollow
                fill="none"
                data-mc-ink={strokeInk}
                data-mc-w="full"
                strokeLinecap="round"
                opacity={dim}
                vectorEffect="non-scaling-stroke"
              />,
            ];
        if (labels)
          nodes.push(
            <text
              key={`t-${i}`}
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

export { rasterDomain };
