/**
 * @microcharts/react — public root barrel.
 *
 * Charts are consumed via per-component subpaths (added in Phase 2), e.g.
 *   import { Sparkline } from '@microcharts/react/sparkline'
 * The root barrel carries only the shared grammar types and metadata, so
 * importing it never pulls chart code into a bundle.
 */

export const MICROCHARTS_VERSION = "0.0.1";

// Flagship: standalone natural-language series summary (plan/08 §2).
export { describeSeries, EN } from "./core/summary.js";
export type { SummaryStrings, DescribeOptions } from "./core/summary.js";

// Theming + the shared chart shell (plan/06, plan/03).
export { MicroProvider } from "./shared/MicroProvider.js";
export type { Preset, MicroProviderProps } from "./shared/MicroProvider.js";
export { Chart } from "./shared/Chart.js";
export type { ChartProps } from "./shared/Chart.js";
export { SparkGroup } from "./shared/SparkGroup.js";
export type { SparkGroupProps } from "./shared/SparkGroup.js";

export type { Value, Polarity } from "./core/types.js";
export { makeFormatter, type Format } from "./core/format.js";

/** Shared prop grammar — one meaning per name across every chart (plan/04). */
export interface MicrochartCommonProps {
  /** The series. `null`/`NaN` are gaps; `data` alone always renders (plan/04). */
  data: readonly (number | null)[];
  /** Fixed value domain `[min, max]`; auto-fit when omitted. */
  domain?: readonly [number, number];
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  summary?: string | false;
  /** Visible title, wired into `aria-labelledby` (plan/08). */
  title?: string;
}
