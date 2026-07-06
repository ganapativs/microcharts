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

/** Shared prop grammar — one meaning per name across every chart (plan/04). */
export interface MicrochartCommonProps {
  /** The series. `data` alone always renders something (plan/04). */
  data: readonly number[];
  /** Fixed value domain `[min, max]`; auto-fit when omitted. */
  domain?: readonly [number, number];
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  summary?: string | false;
  /** Visible title, wired into `aria-labelledby` (plan/08). */
  title?: string;
}
