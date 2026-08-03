/**
 * Interactive-gzip size history per release (catalog ceiling = largest chart).
 *
 * Kept as a docs-as-tests claim: the hero sentence quotes "&lt; 7 kB", and
 * `CEILING_CLAIM` must stay the tightest whole number above every measured max.
 * Current release numbers come live from `docs-facts` so the newest point can't
 * drift. Reproduce history with:
 *
 *   git show "@microcharts/react@0.9.0:apps/docs/src/lib/chart-sizes.json"
 */
import pkg from "@microcharts/react/package.json" with { type: "json" };
import { SIZE } from "./docs-facts";

export type ReleaseSize = {
  version: string;
  /** Median interactive gzip kB across the stable catalog at that tag. */
  median: number;
  /** Largest interactive gzip kB at that tag — the ceiling. */
  max: number;
};

/**
 * The release the working tree is on; its numbers come from live data.
 *
 * Read from the library manifest rather than written down here: `changeset
 * version` rewrites `package.json` in its own release PR and touches nothing
 * else, so a literal would be one release stale on every Version Packages PR
 * and fail this module's own test until a follow-up sync landed.
 */
export const CURRENT_VERSION: string = pkg.version;

const HISTORY: ReleaseSize[] = [
  { version: "0.4.0", median: 3.57, max: 4.97 },
  { version: "0.5.0", median: 3.57, max: 4.97 },
  { version: "0.6.0", median: 4.7, max: 6.12 },
  { version: "0.7.0", median: 4.92, max: 6.54 },
  { version: "0.8.0", median: 5.03, max: 6.64 },
  { version: "0.9.0", median: 5.04, max: 6.64 },
  { version: "0.10.0", median: 5.07, max: 6.75 },
  // Frozen from the `@microcharts/react@0.11.0` tag's chart-sizes.json.
  { version: "0.11.0", median: 5.24, max: 6.94 },
  // …and from the `@microcharts/react@0.12.0` tag's.
  { version: "0.12.0", median: 5.25, max: 7 },
];

// The newest point is always live data. The frozen twin of whatever version the
// tree is on drops out, so a release can be pinned to history the moment it is
// tagged without the next bump leaving a duplicate behind.
export const RELEASE_SIZES: readonly ReleaseSize[] = [
  ...HISTORY.filter((r) => r.version !== CURRENT_VERSION),
  { version: CURRENT_VERSION, median: SIZE.interactiveMedian, max: SIZE.interactiveMax },
];

/** Ceiling series across releases (kB). */
export const CEILINGS: readonly number[] = RELEASE_SIZES.map((r) => r.max);

/** Rounded-up kB ceiling the hero copy quotes — 7 while every max stays under it. */
export const CEILING_CLAIM = Math.ceil(Math.max(...CEILINGS));
