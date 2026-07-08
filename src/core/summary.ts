// Natural-language series summary — the flagship a11y feature (plan/08 §2).
// Pure, deterministic, template-driven, i18n-able. No ML. Also exported
// standalone. Implements the S1 (single trend series) shape; S2–S4 land with
// their chart types.
import { seriesStats } from "./stats.js";
import type { Value } from "./types.js";

/** Swappable string templates (en shipped; structure is the locale contract). */
export interface SummaryStrings {
  noData: string;
  single: (value: string) => string;
  flat: (value: string) => string;
  /** e.g. "Trending up 12%." */
  trendPct: (direction: "up" | "down", percent: string) => string;
  /** used when the first value is 0 (percent change undefined) */
  trendAbs: (direction: "up" | "down", amount: string) => string;
  noChange: string;
  range: (min: string, max: string) => string;
  last: (value: string) => string;
  /** Interactive point announcement, e.g. "Point 3 of 12: 42." */
  point: (position: number, total: number, value: string) => string;
  /** Interactive announcement for an empty slot, e.g. "Point 3 of 12: no data." */
  pointEmpty: (position: number, total: number) => string;
  /** S4 scalar direction, e.g. "Up 12%." (trend-arrow; lands with it, plan/22 #1). */
  scalarDir: (direction: "up" | "down", amount: string) => string;
  /** S4 within-noise-floor change (trend-arrow flatBand). */
  flatChange: string;
  /** S4 categorical state, e.g. "Status: warning." (status-dot). */
  status: (stateLabel: string) => string;
  /** S4 calibrated step, e.g. "42 — level 3 of 5." (heat-cell; 1-based level). */
  level: (value: string, level: number, steps: number) => string;
  /** S3 completion, e.g. "68% complete." (progress; reused by progress-ring). */
  progress: (pct: string) => string;
  /** S3 burn-down / countdown, e.g. "32% remaining." (progress `positive="down"`). */
  remaining: (pct: string) => string;
  /** S3 segmented steps, e.g. "3 of 5 steps." (progress `segments`). */
  stepsDone: (done: number, total: number) => string;
  /** S3 discrete units, e.g. "5 of 8." (pictogram-row). */
  countOf: (value: string, total: number) => string;
  /** S2 composition, e.g. "4 categories. Highest East 940, lowest North 120." */
  categories: (
    count: number,
    maxLabel: string,
    maxValue: string,
    minLabel: string,
    minValue: string,
  ) => string;
  /** S2 per-category announcement, e.g. "East: 940 — 1st of 4." */
  category: (label: string, value: string, rank: number, count: number) => string;
  /** Distribution, e.g. "38 values from 3.1 to 9.7, median 5.2." (rug-strip). */
  observations: (count: number, min: string, max: string, median: string) => string;
  /** Per-observation announcement, e.g. "5.2 — 19th of 38." (rug-strip). */
  observation: (value: string, rank: number, count: number) => string;
  /** Event run, e.g. "34 events, peak 8." (seismogram). */
  events: (count: number, peak: string) => string;
  /** Quiet event strip (seismogram all-zero). */
  noEvents: string;
  /** S2-paired change, e.g. "From 62,000 to 84,000, up 35%." (dumbbell). */
  fromTo: (from: string, to: string, direction: "up" | "down", pct: string) => string;
  /** Degenerate pair, e.g. "No change at 62,000." */
  flatPair: (value: string) => string;
  /** Multi-row lead, e.g. "5 rows. Largest change Berlin, up 41%." */
  rows: (count: number, topLabel: string, topDirection: "up" | "down", topPct: string) => string;
  /** Referenced pair announcement, e.g. "East: 940 vs 1,200." (paired-bars). */
  pairAt: (label: string, value: string, ref: string) => string;
  /** Referenced pairs summary, e.g. "4 pairs. Largest gap East: 940 vs 1,200." */
  pairs: (count: number, gapLabel: string, value: string, ref: string) => string;
  /** Slope announcement, e.g. "Berlin: 48 to 61, up 27%." */
  slopeAt: (
    label: string,
    from: string,
    to: string,
    direction: "up" | "down",
    pct: string,
  ) => string;
  /** Slope summary, e.g. "5 categories: 3 up, 2 down. Largest change East, up 18%." */
  slopes: (
    count: number,
    up: number,
    down: number,
    topLabel: string,
    topDirection: "up" | "down",
    topPct: string,
  ) => string;
  /** Slope with a missing end, e.g. "Berlin: 48, incomplete." */
  slopeIncomplete: (label: string, value: string) => string;
  /** Scatter size, e.g. "24 points." (micro-scatter). */
  scatterCount: (count: number) => string;
  /** Relationship clause, e.g. "Strong positive relationship (r 0.82)." */
  relationship: (
    tier: "strong" | "moderate" | "weak" | "none",
    direction: "positive" | "negative",
    r: string,
  ) => string;
}

/** The S1 series subset — what `describeSeries` and series-chart interactive
 *  entries consume. Series charts default to this sub-dictionary so they never
 *  bundle scalar/composition templates (and vice versa). */
export type SeriesStrings = Pick<
  SummaryStrings,
  "noData" | "single" | "flat" | "trendPct" | "trendAbs" | "noChange" | "range" | "last" | "point"
>;

export const EN_SERIES: SeriesStrings = {
  noData: "No data.",
  single: (v) => `Single value ${v}.`,
  flat: (v) => `Flat at ${v}.`,
  trendPct: (dir, pct) => `Trending ${dir} ${pct}%.`,
  trendAbs: (dir, amt) => `Trending ${dir} by ${amt}.`,
  noChange: "No net change.",
  range: (min, max) => `Range ${min} to ${max}.`,
  last: (v) => `Last value ${v}.`,
  point: (pos, total, v) => `Point ${pos} of ${total}: ${v}.`,
};

export interface DescribeOptions {
  /** `Intl.NumberFormat` options, or a custom formatter. Locale-aware default. */
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: SeriesStrings | undefined;
}

import { makeFormatter as cachedFormatter } from "./format.js";

function makeFormatter(opts: DescribeOptions): (n: number) => string {
  return cachedFormatter(opts.format, opts.locale);
}

/**
 * "Trending up 12%. Range 3 to 18. Last value 17." — the default accessible
 * name for a chart (plan/08). Degenerate series produce honest short forms:
 * empty/all-null → "No data.", one point → "Single value X.", constant →
 * "Flat at X." Direction is stated factually (up/down); valence/color live in
 * the component, never in the words (plan/04 rule 6, plan/08 1.4.1).
 */
export function describeSeries(values: readonly Value[], opts: DescribeOptions = {}): string {
  const s = seriesStats(values);
  const t = opts.strings ?? EN_SERIES;
  if (!s) return t.noData;

  const fmt = makeFormatter(opts);
  if (s.count === 1) return t.single(fmt(s.last));
  if (s.min === s.max) return t.flat(fmt(s.min));

  const parts: string[] = [];
  if (s.trend === 0) {
    parts.push(t.noChange);
  } else {
    const dir = s.trend > 0 ? "up" : "down";
    if (s.first === 0) {
      parts.push(t.trendAbs(dir, fmt(Math.abs(s.delta))));
    } else {
      parts.push(t.trendPct(dir, String(Math.round(Math.abs(s.deltaRatio) * 100))));
    }
  }
  parts.push(t.range(fmt(s.min), fmt(s.max)));
  parts.push(t.last(fmt(s.last)));
  return parts.join(" ");
}
