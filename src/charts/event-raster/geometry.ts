// EventRaster: One lane
// per source, one tick per event. Vertical banding = synchronization, diagonals
// = propagation, sparse rows = silence. One tick = one event, always — the only
// exception is the honest `overflow="bin"` mode, which switches an aliasing lane
// to per-bucket counts (opacity) and SAYS SO in the summary. 2-dp.
import { uniformBins } from "../../core/bin.js";
import { scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import { labelFitsBand, labelFont, textGutterProse } from "../../core/labels.js";

/** Lane-label layout: whether the source names are drawn, and the gutter they cost. */
export interface RasterLabelLayout {
  show: boolean;
  /** Left gutter reserved for the names — 0 when they're dropped. */
  gutter: number;
  fontSize: number;
}

/**
 * Resolve the lane-label gutter — the ONE place the static and interactive
 * entries agree on it, because the gutter is the plot's x origin and a
 * second-guessed copy puts every tick and every hover overlay in the wrong place.
 *
 * The names degrade in two directions, and either one drops them outright rather
 * than letting them overlap or spill:
 *
 *  - **Vertically** the lane pitch is the budget. Each name is centred in its
 *    lane, so once the lane is shorter than one em the names of adjacent sources
 *    stack, and the first and last lanes push their em-boxes past the viewBox
 *    edge — that is a Raster in a tab header stacking "api/db/cache". `labelFont`
 *    floors at 7, so there is no smaller type to retreat to.
 *  - **Horizontally** the widest name is the budget, at the library's PROSE
 *    per-char over-estimate. A lane name is caller text ("API", "authz-service"),
 *    not a figure this chart formatted, so the digits rate `textGutter` is
 *    calibrated for under-reserves an all-caps source and pushes it out of the
 *    gutter (`.mc-root` is `overflow: visible` — it spills, it never clips).
 *    Unknown width also means the reserve can outgrow the sensible share of a
 *    narrow chart (45%); when it did, the old behaviour CLAMPED the gutter and
 *    slid the text out through the left edge.
 *
 * The events never degrade: the lanes reclaim the gutter and keep every tick.
 */
export function rasterLabels(opts: {
  labels: boolean;
  width: number;
  height: number;
  lanes: number;
  /** Chars in the widest lane name. */
  maxChars: number;
  /** Minimum label size in viewBox units (the chart's `labelSize` prop). */
  labelSize?: number | undefined;
}): RasterLabelLayout {
  const { labels, width, height, lanes, maxChars } = opts;
  const laneH = height / Math.max(1, lanes);
  const fontSize = labelFont(laneH, 0.56, opts.labelSize);
  const gutter = textGutterProse(Math.max(1, maxChars), fontSize, 4);
  const show = labels && labelFitsBand(laneH, fontSize) && gutter <= width * 0.45;
  return { show, gutter: show ? gutter : 0, fontSize };
}

export interface RasterLaneInput {
  label: string;
  events: readonly number[];
}

interface RasterBin {
  x: number;
  width: number;
  opacity: number;
}

export interface RasterLane {
  label: string;
  y: number;
  laneH: number;
  /** Tick path (one vertical stroke per event) — empty when binned. */
  path: string;
  /** Per-bucket opacity rects — non-empty only when this lane is binned. */
  bins: RasterBin[];
  /** Events inside the window — what this lane paints, not what it was handed. */
  count: number;
  binned: boolean;
}

export const LANE_CAP = 12;

/**
 * Resolve the caller `domain` — the second thing both entries must agree on,
 * for the same reason as the gutter above: two windows put the ticks and the
 * hover overlay on different axes.
 *
 * A `domain` is computed by the host, not typed by hand, so it arrives hostile.
 * `[NaN, NaN]` — a window derived from an empty fetch — put `MNaN` in every
 * lane path, so nothing painted while the accessible name still announced every
 * event. `[0, NaN]` was worse: the span fell back to 1 and the ticks marched
 * hundreds of units past the viewBox. Falling back to the data extent is the
 * guard the other domain-taking charts already apply.
 *
 * A reversed pair is a window with its ends swapped, not a mirrored time axis:
 * `uniformBins` normalizes it, so honoring the reversal made a binned lane run
 * left→right while its tick neighbours ran right→left in the same chart.
 */
export function resolveRasterDomain(
  domain: readonly [number, number] | undefined,
  data: readonly RasterLaneInput[],
): readonly [number, number] {
  if (!domain || !Number.isFinite(domain[0]) || !Number.isFinite(domain[1]))
    return rasterDomain(data);
  return domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
}

/**
 * The events a window actually holds, in input order.
 *
 * An explicit `domain` is a window — a caller overfetching around it is normal
 * — and an event outside it used to be scaled anyway, landing hundreds of units
 * past the viewBox (`.mc-root` is `overflow: visible`: it spills, it never
 * clips). Clamping to the edge was the alternative and it lies, piling ticks
 * into the vertical band this chart exists to report. The binned branch already
 * dropped those events (`uniformBins` counts nothing outside its domain), so
 * one chart was reading two windows depending on lane density.
 */
export function rasterWindow(
  events: readonly number[],
  domain: readonly [number, number],
): number[] {
  // isFiniteValue first: `null >= 0` is true (it coerces), so the comparisons
  // alone would admit a null event and place it at the window's low edge.
  return events.filter((e) => isFiniteValue(e) && e >= domain[0] && e <= domain[1]);
}

/** A lane aliases once its events outnumber the pixels available to draw them. */
export function rasterAliases(events: number, plotW: number): boolean {
  return events > plotW * 0.9;
}

/** Default domain: min/max over every event across all lanes. */
export function rasterDomain(data: readonly RasterLaneInput[]): readonly [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const lane of data)
    for (const e of lane.events)
      if (isFiniteValue(e)) {
        if (e < lo) lo = e;
        if (e > hi) hi = e;
      }
  if (!Number.isFinite(lo)) return [0, 1];
  return [lo, hi === lo ? lo + 1 : hi];
}

export function eventRasterGeometry(opts: {
  data: readonly RasterLaneInput[];
  domain: readonly [number, number];
  width: number;
  height: number;
  gutter: number;
  overflow: "bin" | "clip";
}): { lanes: RasterLane[] } {
  const { data, domain, width, height, gutter, overflow } = opts;
  const lanes = data.slice(0, LANE_CAP);
  const n = Math.max(1, lanes.length);
  const laneH = height / n;
  const plotX0 = gutter;
  const plotW = Math.max(1, width - gutter - 1);
  // scaleLinear, not `(t - d0) / span`: it maps a degenerate window to the plot
  // midpoint and survives a span that overflows to Infinity (`1e308 - -1e308`),
  // which the hand-rolled form turned into NaN coordinates.
  const x = scaleLinear(domain, [plotX0, plotX0 + plotW]);
  const xOf = (t: number): number => round2(x(t));
  const pad = Math.min(1, laneH * 0.18);

  const out: RasterLane[] = lanes.map((lane, i) => {
    const y = round2(i * laneH);
    const events = rasterWindow(lane.events, domain);
    const y0 = round2(y + pad);
    const y1 = round2(y + laneH - pad);
    // aliasing → each event would collide with its neighbour; bin honestly
    const aliasing = overflow === "bin" && rasterAliases(events.length, plotW);
    if (aliasing) {
      const nb = Math.max(2, Math.floor(plotW / 2));
      const binned = uniformBins(events, { domain, bins: nb });
      const bins: RasterBin[] = binned
        ? binned.bins
            .filter((b) => b.count > 0)
            .map((b) => ({
              x: xOf(b.x0),
              width: round2(Math.max(0.6, xOf(b.x1) - xOf(b.x0))),
              opacity: round2(0.2 + 0.8 * (b.count / (binned.maxCount || 1))),
            }))
        : [];
      return {
        label: lane.label,
        y,
        laneH: round2(laneH),
        path: "",
        bins,
        count: events.length,
        binned: true,
      };
    }
    const path = events.map((e) => `M${xOf(e)} ${y0}V${y1}`).join("");
    return {
      label: lane.label,
      y,
      laneH: round2(laneH),
      path,
      bins: [],
      count: events.length,
      binned: false,
    };
  });
  return { lanes: out };
}
