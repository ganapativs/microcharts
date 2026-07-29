// RugStrip: Every
// tick is one real observation: no jitter, no smoothing, no thinning. Density
// reads by ink accumulation — and because SVG paints ONE path's stroke as a
// single operation (overlaps inside a path never composite). multiplicity is
// bucketed into opacity TIERS, one path per tier (≤ 3 paths + highlight, never
// one node per tick). Coords 2-dp.
import { clamp, extent, scaleLinear } from "../../core/scale.js";
import { isFiniteValue, round2, type Value } from "../../core/types.js";

export interface RugTick {
  /** Position along the value axis (viewBox units). */
  pos: number;
  value: number;
}

interface RugTier {
  /** Path of tick segments sharing one multiplicity tier. */
  d: string;
  /** Stroke opacity for the tier (more coincident ticks → darker). */
  opacity: number;
}

export interface RugGeometry {
  /** Opacity-tiered tick paths (1–3). */
  tiers: RugTier[];
  /** All finite observations sorted ascending, with their positions. */
  ticks: RugTick[];
  highlightPos: number | null;
  /** Domain actually used (explicit or data-fit). */
  domain: readonly [number, number];
}

// multiplicity → tier opacity: singles stay visible, stacks read as density
const TIER_OPACITY = [0.35, 0.6, 0.85] as const;
const tierOf = (count: number): number => (count >= 4 ? 2 : count >= 2 ? 1 : 0);

export function rugGeometry(opts: {
  /** Length along the value axis. */
  length: number;
  /** Tick extent across the strip. */
  thickness: number;
  values: readonly Value[];
  domain?: readonly [number, number] | undefined;
  markValue?: number | undefined;
  orientation: "horizontal" | "vertical";
}): RugGeometry {
  const { length, thickness, values, markValue, orientation } = opts;
  const finite = values.filter(isFiniteValue).sort((a, b) => a - b);
  const given =
    opts.domain && Number.isFinite(opts.domain[0]) && Number.isFinite(opts.domain[1])
      ? opts.domain
      : (extent(finite) ?? [0, 1]);
  // A caller-supplied domain may arrive high→low. It is a WINDOW, not a
  // mirrored axis — `uniformBins` and EventRaster already order theirs — and
  // honoring the reversal broke both things `domain` exists for: the rug ran
  // right→left beside a HistogramStrip fixed to the same domain, and the
  // interactive picker's binary search (which assumes position ascends with
  // value) announced a tick nowhere near the cursor.
  const domain: readonly [number, number] = given[0] <= given[1] ? given : [given[1], given[0]];
  const pad = 0.5;
  const scale = scaleLinear(domain, [pad, length - pad]);

  const ticks: RugTick[] = finite.map((v) => ({
    pos: round2(clamp(scale(v), pad, length - pad)),
    value: v,
  }));

  // group coincident positions (2-dp keys), bucket multiplicity into tiers
  const counts = new Map<number, number>();
  for (const t of ticks) counts.set(t.pos, (counts.get(t.pos) ?? 0) + 1);
  // Regular ticks are inset 1 unit each end, so the full-extent highlight reads
  // "taller". The inset is a QUARTER of a thin strip rather than a flat 1: at
  // `thickness` 2 the flat inset put both ends on the same coordinate, and
  // below 1 it ran the segment from y=1 to a negative y — ink outside the
  // viewBox, which `.mc-root`'s `overflow: visible` spills rather than clips.
  const inset = thickness < 4 ? round2(thickness / 4) : 1;
  const far = round2(thickness - inset);
  const byTier: string[][] = [[], [], []];
  for (const [pos, count] of counts) {
    const seg =
      orientation === "horizontal" ? `M${pos} ${inset}V${far}` : `M${inset} ${pos}H${far}`;
    byTier[tierOf(count)]!.push(seg);
  }
  const tiers: RugTier[] = byTier
    .map((segs, i) => ({ d: segs.join(""), opacity: TIER_OPACITY[i]! }))
    .filter((t) => t.d !== "");

  const highlightPos =
    markValue !== undefined && Number.isFinite(markValue)
      ? round2(clamp(scale(markValue), pad, length - pad))
      : null;

  return { tiers, ticks, highlightPos, domain };
}
