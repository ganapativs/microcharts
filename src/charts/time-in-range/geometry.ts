// TimeInRange geometry — pure, React-free (plan/25 §1, plan/17 F6). Time-in-band
// stacked strip with a FIXED semantic zone order (severe-low → below → in →
// above → severe-high); the order is positional grammar, never sorted by size.
// Counts or fractions in, normalized shares out. 2-dp. Uses core/stack shares.
import { normalizeShares } from "../../core/stack.js";
import { isFiniteValue, round2 } from "../../core/types.js";
import type { Orientation } from "../../core/types.js";

export type { Orientation } from "../../core/types.js";

export type ZoneKey = "severeBelow" | "below" | "in" | "above" | "severeAbove";

export interface TimeInRangeDatum {
  severeBelow?: number | undefined;
  below: number;
  in: number;
  above: number;
  severeAbove?: number | undefined;
}

/** Fixed semantic order — low to high. Positional identity, never reordered. */
export const ZONE_ORDER: readonly ZoneKey[] = [
  "severeBelow",
  "below",
  "in",
  "above",
  "severeAbove",
];

export interface TirZone {
  key: ZoneKey;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Share of the whole period (2-dp). */
  share: number;
}

export function timeInRangeGeometry(opts: {
  data: TimeInRangeDatum;
  width: number;
  height: number;
  orientation: Orientation;
  gap?: number | undefined;
}): { zones: TirZone[] } {
  const { data, width, height, orientation, gap = 0.5 } = opts;
  const horizontal = orientation !== "vertical";
  const inset = 1;

  const keys = ZONE_ORDER.filter((k) => {
    const v = data[k];
    return isFiniteValue(v) && v > 0;
  });
  const norm = normalizeShares(keys.map((k) => data[k] as number));
  if (!norm) return { zones: [] };

  const along = (horizontal ? width : height) - inset * 2;
  const thick = (horizontal ? height : width) - inset * 2;
  const n = keys.length;
  const usable = along - gap * Math.max(0, n - 1);

  const zones: TirZone[] = [];
  let pos = inset;
  norm.shares.forEach((share, i) => {
    const len = round2(Math.max(0, share * usable));
    if (horizontal) {
      zones.push({
        key: keys[i]!,
        x: round2(pos),
        y: inset,
        width: len,
        height: round2(thick),
        share: round2(share),
      });
    } else {
      // vertical: severe-low sits at the BOTTOM, severe-high at the top
      zones.push({
        key: keys[i]!,
        x: inset,
        y: round2(height - pos - len),
        width: round2(thick),
        height: len,
        share: round2(share),
      });
    }
    pos += len + gap;
  });
  return { zones };
}

/** Integer percents that sum to exactly 100 (largest remainder) — label and
 *  summary read from the SAME rounding so they can never disagree. */
export function zonePercents(shares: readonly number[]): number[] {
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum <= 0) return shares.map(() => 0);
  const raw = shares.map((s) => (s / sum) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]!++;
    left--;
  }
  return floors;
}
