// RugStrip geometry — pure, React-free. Every
// tick is one real observation: no jitter, no smoothing, no thinning. Density
// reads by ink accumulation — and because SVG paints ONE path's stroke as a
// single operation (overlaps inside a path never composite), multiplicity is
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
  const domain =
    opts.domain && Number.isFinite(opts.domain[0]) && Number.isFinite(opts.domain[1])
      ? opts.domain
      : (extent(finite) ?? [0, 1]);
  const pad = 0.5;
  const scale = scaleLinear(domain, [pad, length - pad]);

  const ticks: RugTick[] = finite.map((v) => ({
    pos: round2(clamp(scale(v), pad, length - pad)),
    value: v,
  }));

  // group coincident positions (2-dp keys), bucket multiplicity into tiers
  const counts = new Map<number, number>();
  for (const t of ticks) counts.set(t.pos, (counts.get(t.pos) ?? 0) + 1);
  const byTier: string[][] = [[], [], []];
  for (const [pos, count] of counts) {
    // regular ticks are inset 1 unit each end, so the full-extent highlight
    // reads "taller" while everything stays inside the viewBox (containment)
    const seg =
      orientation === "horizontal"
        ? `M${pos} 1V${round2(thickness - 1)}`
        : `M1 ${pos}H${round2(thickness - 1)}`;
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
