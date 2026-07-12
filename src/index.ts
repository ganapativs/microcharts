/**
 * @microcharts/react — public root barrel.
 *
 * Charts are consumed via per-component subpaths (added in Phase 2), e.g.
 *   import { Sparkline } from '@microcharts/react/sparkline'
 * The root barrel carries only the shared grammar types and metadata, so
 * importing it never pulls chart code into a bundle.
 */

export const MICROCHARTS_VERSION = "0.0.1";

// Flagship: standalone natural-language series summary.
export { describeSeries } from "./core/summary.js";
export { EN } from "./core/strings.js";
export type { SummaryStrings, DescribeOptions } from "./core/summary.js";

// Theming + the shared chart shell.
export { MicroProvider } from "./shared/MicroProvider.js";
export type { Preset, MicroProviderProps } from "./shared/MicroProvider.js";
export { Chart } from "./shared/Chart.js";
export type { ChartProps } from "./shared/Chart.js";
export { SparkGroup } from "./shared/SparkGroup.js";
export type { SparkGroupProps } from "./shared/SparkGroup.js";

export type { Value, Polarity } from "./core/types.js";
export { makeFormatter, type Format } from "./core/format.js";

/** Shared prop grammar — one meaning per name across every chart. */
export interface MicrochartCommonProps {
  /** The series. `null`/`NaN` are gaps; `data` alone always renders. */
  data: readonly (number | null)[];
  /** Fixed value domain `[min, max]`; auto-fit when omitted. */
  domain?: readonly [number, number];
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  summary?: string | false;
  /** Visible title, wired into `aria-labelledby`. */
  title?: string;
}
