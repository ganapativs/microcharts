// EventRaster geometry — pure, React-free (plan/25 §5, plan/17 F18). One lane
// per source, one tick per event. Vertical banding = synchronization, diagonals
// = propagation, sparse rows = silence. One tick = one event, always — the only
// exception is the honest `overflow="bin"` mode, which switches an aliasing lane
// to per-bucket counts (opacity) and SAYS SO in the summary. 2-dp.
import { uniformBins } from "../../core/bin.js";
import { isFiniteValue, round2 } from "../../core/types.js";

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
  count: number;
  binned: boolean;
}

export const LANE_CAP = 12;

/** Default domain: min/max over every event across all lanes. */
export function rasterDomain(data: readonly RasterLaneInput[]): [number, number] {
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
  domain: [number, number];
  width: number;
  height: number;
  gutter: number;
  overflow: "bin" | "clip";
}): { lanes: RasterLane[] } {
  const { data, domain, width, height, gutter, overflow } = opts;
  const lanes = data.slice(0, LANE_CAP);
  const n = Math.max(1, lanes.length);
  const laneH = height / n;
  const [d0, d1] = domain;
  const span = d1 - d0 || 1;
  const plotX0 = gutter;
  const plotW = Math.max(1, width - gutter - 1);
  const xOf = (t: number): number => round2(plotX0 + ((t - d0) / span) * plotW);
  const pad = Math.min(1, laneH * 0.18);

  const out: RasterLane[] = lanes.map((lane, i) => {
    const y = round2(i * laneH);
    const events = lane.events.filter(isFiniteValue);
    const y0 = round2(y + pad);
    const y1 = round2(y + laneH - pad);
    // aliasing → each event would collide with its neighbour; bin honestly
    const aliasing = overflow === "bin" && events.length > plotW * 0.9;
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
