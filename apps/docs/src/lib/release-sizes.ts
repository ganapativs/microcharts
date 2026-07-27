/**
 * Interactive-gzip size history, per release. The hero of the v3 homepage plots
 * the **ceiling** — the largest chart in the catalog at each tag — because that
 * is what its sentence claims ("none has ever shipped over seven").
 *
 * Provenance: `apps/docs/src/lib/chart-sizes.json` and
 * `apps/docs/src/lib/charts/entries.generated.json` read at each
 * `@microcharts/react@<version>` git tag, median and max computed across the
 * stable catalog's interactive subpaths (105 of 106 — `wind-barb` is static
 * only). Reproduce with:
 *
 *   git show "@microcharts/react@0.9.0:apps/docs/src/lib/chart-sizes.json"
 *
 * The current release is NOT frozen here: it reads live from `docs-facts`, so
 * the newest point can never drift from the measured file. `CURRENT_VERSION` is
 * checked against the workspace package version by `release-sizes.test.ts`.
 */
import { SIZE } from "./docs-facts";

export type ReleaseSize = {
  version: string;
  /** Median interactive gzip kB across the stable catalog at that tag. */
  median: number;
  /** Largest interactive gzip kB at that tag — the ceiling. */
  max: number;
};

/** The release the working tree is on; its numbers come from live data. */
export const CURRENT_VERSION = "0.10.0";

const HISTORY: ReleaseSize[] = [
  { version: "0.4.0", median: 3.57, max: 4.97 },
  { version: "0.5.0", median: 3.57, max: 4.97 },
  { version: "0.6.0", median: 4.7, max: 6.12 },
  { version: "0.7.0", median: 4.92, max: 6.54 },
  { version: "0.8.0", median: 5.03, max: 6.64 },
  { version: "0.9.0", median: 5.04, max: 6.64 },
];

export const RELEASE_SIZES: readonly ReleaseSize[] = [
  ...HISTORY,
  { version: CURRENT_VERSION, median: SIZE.interactiveMedian, max: SIZE.interactiveMax },
];

/** The ceiling series the hero sparkline draws. */
export const CEILINGS: readonly number[] = RELEASE_SIZES.map((r) => r.max);

/** Rounded-up kB ceiling the copy quotes — 7 while every max stays under it. */
export const CEILING_CLAIM = Math.ceil(Math.max(...CEILINGS));
