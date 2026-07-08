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
  /** One share clause, e.g. "Chrome 62%" (segmented-bar/micro-donut). */
  shareClause: (label: string, pct: string) => string;
  /** Joined composition, e.g. "Chrome 62%, Safari 24%, Other 5%." */
  shares: (list: string) => string;
  /** Share announcement, e.g. "Safari: 24%, 1,204." */
  shareAt: (label: string, pct: string, value: string) => string;
  /** Rollup announcement, e.g. "Other: 5%, 3 categories." */
  shareOther: (label: string, pct: string, members: number) => string;
  /** The rollup label ("Other"). */
  otherLabel: string;
  /** Funnel summary, e.g. "4 stages, 12,400 to 1,116 — overall 9%." */
  funnel: (stages: number, first: string, last: string, overallPct: string) => string;
  /** Non-monotonic note, e.g. "Stage 3 exceeds stage 2." */
  funnelInversion: (stage: number, prev: number) => string;
  /** Stage announcement, e.g. "Checkout: 2,730 — 22% of visitors." */
  stageAt: (label: string, value: string, retainedPct: string, firstLabel: string) => string;
  /** Likert composition, e.g. "62% agree, 24% disagree, 14% neutral." */
  likert: (agreePct: string, disagreePct: string, neutralPct: string | null) => string;
  /** Lean clause, e.g. "Leans positive." */
  likertLean: (direction: "positive" | "negative" | "balanced") => string;
  /** All-neutral / empty likert rows. */
  allNeutral: string;
  noResponses: string;
  /** Histogram bin announcement, e.g. "40 to 50: 34 values." */
  binAt: (lo: string, hi: string, count: number) => string;
  /** Histogram summary, e.g. "120 values, most between 40 and 50." */
  distribution: (count: number, modalLo: string, modalHi: string) => string;
  /** Five-number summary, e.g. "Median 42, middle half 35 to 51, range 12 to 96." */
  fiveNum: (median: string, q1: string, q3: string, min: string, max: string) => string;
  /** Stat announcement, e.g. "Median: 42." */
  boxStat: (which: "min" | "q1" | "median" | "q3" | "max", value: string) => string;
  /** Waterfall step, e.g. "Refunds: −140, running 1,410." */
  waterfallStep: (label: string, delta: string, level: string) => string;
  /** Waterfall summary, e.g. "From 1,200 to 1,540 over 5 steps: +480 gains, −140 losses." */
  waterfall: (start: string, end: string, steps: number, gains: string, losses: string) => string;
  /** Rank announcement, e.g. "Week 4 of 12: #3." */
  rankAt: (period: number, total: number, rank: number) => string;
  /** Rank run, e.g. "From #5 to #2 over 12 weeks; best #1." */
  rankRun: (from: number, to: number, best: number, periods: number) => string;
  /** Dual point, e.g. "Point 9 of 12: 17 vs 15." */
  vsAt: (position: number, total: number, value: string, ref: string) => string;
  /** Dual summary, e.g. "Trending up 12% vs benchmark up 4%. Last 17 vs 15." */
  vs: (primaryClause: string, compareClause: string, lastValue: string, lastRef: string) => string;
  /** Matching-benchmark degenerate. */
  vsMatching: string;
  /** Stack point, e.g. "Point 8 of 12: Mobile 45%, Web 38%, API 17%." */
  stackAt: (position: number, total: number, clauses: string) => string;
  /** Stack summary, e.g. "3 series over 12 points; Mobile leads at 45% share." */
  shareShift: (count: number, points: number, topLabel: string, topPct: string) => string;
  /** OHLC period, e.g. "Period 18 of 20: open 145.10, high 149.30, low 144.00, close 148.20." */
  ohlcAt: (position: number, total: number, o: string, h: string, l: string, c: string) => string;
  /** OHLC run, e.g. "20 periods. Last close 148.20, up 3.4%; range 141.10 to 151.90." */
  ohlcRun: (
    periods: number,
    close: string,
    direction: "up" | "down" | "flat",
    changePct: string,
    lo: string,
    hi: string,
  ) => string;
  /** "Tuesday, June 24: 12." */
  dayAt: (dateLabel: string, value: string) => string;
  /** "Tuesday, June 24: no data." */
  dayEmpty: (dateLabel: string) => string;
  /** "Active 18 of 28 days over 4 weeks." */
  calendar: (activeDays: number, totalDays: number, weeks: number) => string;
  /** "Deploy freeze: Jun 3, 09:00 to 13:30 — 4h 30m." */
  spanAt: (label: string, startLabel: string, endLabel: string, duration: string) => string;
  /** "Incident: Jun 3, 11:12." */
  eventAt: (label: string, atLabel: string) => string;
  /** "4 spans covering 82% of the window; 2 events." */
  timeline: (spans: number, events: number, coveragePct: string) => string;

  /* ── Batch 2 — decision micrographs ──────────────────────────────────── */

  /** Coverage summary, e.g. "18 of 24 slots measured (75%); longest gap 4 slots." */
  coverage: (measured: number, expected: number, coveragePct: string, longestGap: number) => string;
  /** Coverage slot announcement, e.g. "Slot 14: 3.2." / "Slot 14: no measurement." */
  coverageSlot: (slot: number, value: string | null) => string;
  /** Benchmark summary, e.g. "312 ms — 68th percentile of 42 peers (middle half 250–420 ms)." */
  benchmark: (value: string, percentile: number, n: number, p25: string, p75: string) => string;
  /** Benchmark all-equal peers, e.g. "312 ms — all 8 peers at 312 ms." */
  benchmarkFlat: (value: string, n: number, peerValue: string) => string;
  /** Benchmark edge announcement, e.g. "p75: 420 ms." */
  benchmarkEdge: (name: string, value: string) => string;
  /** Percentile-ladder summary, e.g. "p50 120 ms, p90 480 ms, p99 2.1 s — the slowest 1% take 17× the median." */
  ladder: (list: string, tailShare: string, ratio: string) => string;
  /** One ladder tick, e.g. "p90 480 ms" (list) — joined by the summary. */
  ladderTick: (p: string, value: string) => string;
  /** Ladder probe announcement, e.g. "p99: 2.1 s — 17× the median." */
  ladderProbe: (p: string, value: string, ratio: string) => string;
  /** Ladder all-equal, e.g. "All percentiles equal at 120 ms." */
  ladderFlat: (value: string) => string;
  /** Graded-band summary, e.g. "Median 21; 50% within 17–26, 95% within 9–38." */
  gradedBand: (median: string, clauses: string) => string;
  /** One band clause, e.g. "50% within 17–26" — joined by the summary. */
  bandClause: (level: number, lo: string, hi: string) => string;
  /** Band edge announcement, e.g. "80% interval: 17 to 26." */
  bandEdge: (level: number, lo: string, hi: string) => string;
  /** Graded band with no spread, e.g. "Point value 21, no interval." */
  bandPoint: (value: string) => string;
  /** Icon-array summary, e.g. "3 in 20. About 15%." (+ note for degenerate/sub-unit). */
  iconArray: (k: number, n: number, pct: string, note: "none" | "all" | "sub" | null) => string;
  /** Icon-array unit announcement, e.g. "Unit 7 of 20 — filled. 3 of 20 filled." */
  iconArrayUnit: (index: number, n: number, filled: boolean, filledCount: number) => string;
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
