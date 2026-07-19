/**
 * @microcharts/react — public root barrel.
 *
 * Charts are consumed via per-component subpaths (added in Phase 2), e.g.
 *   import { Sparkline } from '@microcharts/react/sparkline'
 * The root barrel carries only the shared grammar types and metadata, so
 * importing it never pulls chart code into a bundle.
 */

/** Replaced with a string literal at build time — see scripts/pkg-version.mjs. */
declare const __MC_VERSION__: string;

/** The published package version, injected from package.json at build time. */
export const MICROCHARTS_VERSION: string = __MC_VERSION__;

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

import type { CSSProperties } from "react";

/**
 * The shared prop grammar — one meaning per name across every chart. Each chart
 * declares the subset it supports inline (kept per-file for tree-shaking and
 * clarity), but a prop that appears here carries this exact type wherever a
 * chart uses it — held to the contract by `grammar-conformance.test.ts` so the
 * grammar can't drift one chart at a time. Categorical charts also take a
 * `colors` array; a new data shape is a new component, not a variant here.
 */
export interface MicrochartCommonProps {
  /** The series. `null`/`NaN` are gaps; `data` alone always renders. Charts with
   *  a structured input (points, segments, events) document their own shape. */
  data: readonly (number | null)[];
  /** Fixed value domain `[min, max]`; auto-fit when omitted. */
  domain?: readonly [number, number];
  /** Mark colour: any CSS colour or token string (`"var(--mc-accent)"`). */
  color?: string;
  /** Names the chart: an SVG `<title>` (accessible name + native tooltip), not visible text. */
  title?: string;
  /** Accessible name. A string overrides the auto-summary; `false` = decorative. */
  summary?: string | false;
  /** Stable id root — opts into `<title>`/`<desc>` + `aria-labelledby` naming. */
  id?: string;
  /** Class on the chart root. */
  className?: string;
  /** Inline style on the chart root (a common place to set width/height). */
  style?: CSSProperties;
}
