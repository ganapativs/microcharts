// Natural-language series summary — the flagship a11y feature.
// Pure, deterministic, template-driven, i18n-able. No ML. Also exported
// standalone. Implements the S1 (single trend series) shape; S2–S4 land with
// their chart types.
import { seriesStats } from "./stats.js";
import { makeFormatter as cachedFormatter } from "./format.js";
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
  /**
   * Announcement for a unit named by `labels`, e.g. "Aug 2026. Point 3 of 12: 1.1K."
   * `body` is the chart's own sentence, unchanged — the name is prepended, so the
   * position stays available to a screen reader as series context.
   */
  named: (name: string, body: string) => string;
  /** Terse VISIBLE chip form, e.g. "Aug 2026 · 1.1K" (no trailing period). */
  namedChip: (name: string, body: string) => string;
  /** S4 scalar direction, e.g. "Up 12%." (trend-arrow; lands with it). */
  scalarDir: (direction: "up" | "down", amount: string) => string;
  /** S4 within-noise-floor change (trend-arrow flatBand). */
  flatChange: string;
  /** S4 categorical state, e.g. "Status: warning." (status-dot). */
  status: (stateLabel: string) => string;
  /** S4 calibrated step, e.g. "42 — level 3 of 5." (heat-cell; 1-based level). */
  level: (value: string, level: number, steps: number) => string;
  /** Terse VISIBLE chip form of `level`, e.g. "42 — level 3 of 5" (no period). */
  levelChip: (value: string, level: number, steps: number) => string;
  /** S3 completion, e.g. "68% complete." (progress; reused by progress-ring). */
  progress: (pct: string) => string;
  /** S3 burn-down / countdown, e.g. "32% remaining." (progress `positive="down"`). */
  remaining: (pct: string) => string;
  /** S3 segmented steps, e.g. "3 of 5 steps." (progress `segments`). */
  stepsDone: (done: number, total: number) => string;
  /** S3 discrete units, e.g. "5 of 8." (pictogram-row). */
  countOf: (value: string, total: number) => string;
  /** S4 bullet value-only, e.g. "72." (bullet). */
  bullet: (value: string) => string;
  /** S4 bullet vs target, e.g. "72 of 80 target." (bullet). */
  bulletTarget: (value: string, target: string) => string;
  /** S4 counted total, e.g. "23 counted." (tally-marks). */
  tally: (value: string) => string;
  /** S4 dice face, e.g. "4 out of 6." (dice-pips). */
  dicePips: (value: string) => string;
  /** S4 dice numeral fallback for value > 6, e.g. "9." (dice-pips). */
  dicePipsOver: (value: string) => string;
  /** S4 label-is-the-bar, e.g. "uploading: 62% complete." (fill-word). */
  fillWord: (word: string, pct: string) => string;
  /** S4 fill-word drain mode, e.g. "session: 25% remaining." (fill-word). */
  fillWordRemaining: (word: string, pct: string) => string;
  /** S4 weighted numeral, e.g. "1,204 — tier 4 of 5." (fat-digits). */
  fatDigits: (value: string, tier: number, tiers: number) => string;
  /** S4 fat-digits digit-mode plain value, e.g. "1,204." (fat-digits). */
  fatDigitsPlain: (value: string) => string;
  /** S4 calibrated tube, e.g. "72 on a 0–100 scale." (thermometer). */
  thermometer: (value: string, min: string, max: string) => string;
  /** S4 thermometer with a goal, e.g. "72 on a 0–100 scale; target 80." */
  thermometerTarget: (value: string, min: string, max: string, target: string) => string;
  /** S4 moon progress, e.g. "68% of the cycle complete." (moon-phase). */
  moonPhase: (pct: string) => string;
  /** S4 moon cycle mode, e.g. "68% through the cycle." (moon-phase). */
  moonPhaseCycle: (pct: string) => string;
  /** S4 hourglass, e.g. "75% elapsed, 25% remaining." (hourglass). */
  hourglass: (elapsed: string, remaining: string) => string;
  /** S2 two-sided balance, e.g. "Inflow 620 vs outflow 480; inflow heavier." */
  balanceBeam: (
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
    heavierLabel: string,
  ) => string;
  /** S2 balanced beam, e.g. "A 500 vs B 500; balanced." (balance-beam). */
  balanceBeamBalanced: (
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
  ) => string;
  /** Interactive pan announcement, e.g. "Inflow: 620." (balance-beam). */
  beamPanAt: (label: string, value: string) => string;
  /** S2 ordinal growth stages (seed/sprout/leaf/bloom). (sprout-row) */
  sproutStageNames: readonly [string, string, string, string];
  /** S2 sprout summary, e.g. "6 accounts; 2 at bloom, 1 at seed." (sprout-row). */
  sproutRow: (n: number, bloom: number, seed: number) => string;
  /** S2 sprout per-item, e.g. "Acme: bloom, stage 4 of 4." (sprout-row). */
  sproutStage: (label: string, stageName: string, k: number) => string;
  /** S2 sprout missing item, e.g. "Acme: no data." (sprout-row). */
  sproutEmpty: (label: string) => string;
  /** S1 garden grid, e.g. "12 weeks; peak 34, 9 active." (garden-grid). */
  gardenGrid: (n: number, unit: string, peak: string, active: number) => string;
  /** S1 garden cell, e.g. "3 of 12: 8, step 2 of 5." (garden-grid). */
  gardenCell: (pos: number, total: number, value: string, k: number, steps: number) => string;
  /** ActivityGrid empty, e.g. "No activity." — distinct from series `noData`. */
  noActivity: string;
  /** S1-binned activity, e.g. "Total 6 over 3 periods. Busiest 3." (activity-grid). */
  activityGrid: (total: string, count: number, busiest: string) => string;
  /** S2 bubble row, e.g. "4 items; largest EMEA at 1,240, smallest LATAM at 210." */
  bubbleRow: (
    n: number,
    maxLabel: string,
    maxValue: string,
    minLabel: string,
    minValue: string,
  ) => string;
  /** S2 bubble announcement, e.g. "EMEA: 1,240." (bubble-row). */
  bubbleAt: (label: string, value: string) => string;
  /** S2 bubble with no value, e.g. "LATAM: no data." (bubble-row). */
  bubbleEmpty: (label: string) => string;
  /** S1 tree rings, e.g. "8 years; latest 14, biggest 22 in year 5." (tree-rings). */
  treeRings: (n: number, unit: string, last: string, max: string, argmaxLabel: string) => string;
  /** S1 ring announcement, e.g. "Year 5: 22." (tree-rings). */
  treeRingAt: (label: string, value: string) => string;
  /** Structured skyline, e.g. "5 teams; tallest Platform at 46." (city-skyline). */
  citySkyline: (n: number, unit: string, tallLabel: string, tallValue: string) => string;
  /** Skyline building (no lit), e.g. "Platform: 46." (city-skyline). */
  citySkylineAt: (label: string, value: string) => string;
  /** Skyline building with lit, e.g. "Platform: 46; 70% lit." (city-skyline). */
  citySkylineAtLit: (label: string, value: string, litPct: string) => string;
  /** Skyline building with no value, e.g. "Web: no data." (city-skyline). */
  citySkylineEmpty: (label: string) => string;
  /** S4 occupancy, e.g. "34 of 40 seats filled." (honeycomb). */
  honeycomb: (value: string, total: string, unit: string) => string;
  /** Honeycomb cell announcement, e.g. "Cell 7 of 40 — filled." (honeycomb). */
  honeycombCell: (index: number, total: number, filled: boolean) => string;
  /** S1 sparse events, e.g. "4 events between Jan and Jun; largest at Mar." */
  constellation: (n: number, first: string, last: string, largest: string) => string;
  /** Sparse events with no ranking channel, e.g. "5 events between 0 and 9."
   *  (constellation). Neither magnitude nor value is encoded, so the chart rings
   *  no largest star and the sentence names none. */
  constellationPlain: (n: number, first: string, last: string) => string;
  /** Single sparse event, e.g. "1 event at Mar." (constellation). */
  constellationOne: (label: string) => string;
  /** Hovered/focused constellation event, e.g. "Mar: 82, magnitude 5." */
  constellationAt: (label: string, value: string) => string;
  /** Magnitude clause in a hovered event detail, e.g. "magnitude 5" (constellation). */
  constellationMagnitude: (value: string) => string;
  /** Fallback detail when an event carries no numeric value, e.g. "event" (constellation). */
  constellationEvent: string;
  /** S1 cyclic, e.g. "Peaks at 14:00 (312); quietest 04:00." (polar-clock). */
  polarClock: (peakLabel: string, max: string, minLabel: string) => string;
  /** Flat cycle, e.g. "Flat at 120 across the cycle." (polar-clock). */
  polarClockFlat: (value: string) => string;
  /** Hovered/focused cycle segment, e.g. "14:00: 312." (polar-clock). */
  polarClockAt: (label: string, value: string) => string;
  /** Weekday names for a 7-segment cycle (i18n contract; index 0 = Sunday). */
  weekdays: readonly string[];
  /** S1 calendar spiral, e.g. "52 weeks; peak 480 in week 30, low in week 6." */
  spiralYear: (
    n: number,
    cadence: "day" | "week",
    max: string,
    peakLabel: string,
    minLabel: string,
  ) => string;
  /** Hovered/focused spiral mark, e.g. "week 30: 480." (spiral-year). */
  spiralYearAt: (label: string, value: string) => string;
  /** S4 ambient load, e.g. "Load 42% — calm." (breathing-dot). */
  breathingDot: (pct: string, bandWord: string) => string;
  /** Unknown load state, e.g. "Load unknown." (breathing-dot). */
  breathingDotUnknown: string;
  /** Load band words [calm, elevated, strained] (breathing-dot). */
  loadBands: readonly [string, string, string];
  /** Structured events, e.g. "12 events in the last minute; last 3s ago." */
  heartbeat: (n: number, windowLabel: string, ago: string) => string;
  /** Flat (down) state, e.g. "No events in the last minute." (heartbeat-blip). */
  heartbeatFlat: (windowLabel: string) => string;
  /** Window duration → label, e.g. 60000 → "minute" (heartbeat-blip). */
  heartbeatWindow: (ms: number) => string;
  /** Elapsed ms → compact label, e.g. 3000 → "3s" (heartbeat-blip). */
  heartbeatAgo: (ms: number) => string;
  /** Static empty-state in-chart label (heartbeat-blip). */
  heartbeatEmpty: string;
  /** Terse VISIBLE chip form, e.g. "3 events" (heartbeat-blip). */
  heartbeatChip: (n: number) => string;
  /** S1 rolling window, e.g. "Now 87, rising over the last 12 updates." */
  cometTrail: (last: string, trendWord: string, n: number) => string;
  /** Single point, e.g. "Now 87." (comet-trail). */
  cometTrailNow: (last: string) => string;
  /** Stepped-back trail point, e.g. "3 updates ago: 74." (comet-trail). */
  cometTrailAt: (k: number, value: string) => string;
  /** Trend words indexed by sign+1: [falling, steady, rising] (comet-trail). */
  cometTrends: readonly [string, string, string];
  /** Two live variables, e.g. "240ms latency at 12 calls/s." (orbit-status). */
  orbitStatus: (latency: string, rate: string, alerted: boolean) => string;
  /** Threshold-crossing announce, e.g. "Latency high — 240ms." (orbit-status). */
  orbitAlert: (latency: string) => string;
  /** Unknown state, e.g. "Latency unknown." (orbit-status). */
  orbitUnknown: string;
  /** Bare latency with its unit, e.g. "240ms" — the in-chart label, the readout
   *  chip and `datum.formatted` (orbit-status). */
  orbitLatency: (latency: string) => string;
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
  /** The two direction words, `[up, down]`, for a VISIBLE chip that shows the
   *  direction on its own. The sentence templates below take the direction as an
   *  ENUM and so can already word it themselves; a chip has no sentence to put it
   *  in, and was rendering the raw `"up"`/`"down"` token. */
  dirNames: readonly [up: string, down: string];
  /** S2-paired change, e.g. "From 62,000 to 84,000, up 35%." (dumbbell). */
  fromTo: (from: string, to: string, direction: "up" | "down", pct: string) => string;
  /** Degenerate pair, e.g. "No change at 62,000." */
  flatPair: (value: string) => string;
  /** Multi-row lead, e.g. "5 rows. Largest change Berlin, up 41%." */
  rows: (count: number, topLabel: string, topDirection: "up" | "down", topPct: string) => string;
  /** Referenced pair announcement, e.g. "East: 940 vs 1,200." (paired-bars). */
  pairAt: (label: string, value: string, ref: string) => string;
  /** Referenced pair with no reference value, e.g. "East: 940, no reference." (paired-bars). */
  pairAtNoRef: (label: string, value: string) => string;
  /** Referenced pair with no value, e.g. "East: no data." (paired-bars). */
  pairAtEmpty: (label: string) => string;
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
  /** Rollup announcement, e.g. "Other: 5%, 402 over 3 categories." `value` is
   *  the rolled-up total — the members count alone said how MANY were folded in
   *  but never how much they came to. */
  shareOther: (label: string, pct: string, members: number, value: string) => string;
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
  /** Interactive level announcement, e.g. "Agree: 34% (68), level 4 of 5."
   *  `value` is the level's own count — the number the caller passed. A share
   *  alone cannot be turned back into it, so both travel. */
  likertAt: (label: string, pct: string, level: number, total: number, value: string) => string;
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
  /** Closing-total announcement, e.g. "Total: 1,360." (waterfall) */
  waterfallTotal: (level: string) => string;
  /** Waterfall summary, e.g. "From 1,200 to 1,540 over 5 steps: +480 gains, −140 losses." */
  waterfall: (start: string, end: string, steps: number, gains: string, losses: string) => string;
  /** Rank announcement, e.g. "Week 4 of 12: #3." `unit` names the period
   *  (default "Week"). */
  rankAt: (period: number, total: number, rank: number, unit?: string) => string;
  /** Rank run, e.g. "From #5 to #2 over 12 weeks; best #1." `unit` names the
   *  period, plural (default "weeks"). */
  rankRun: (from: number, to: number, best: number, periods: number, unit?: string) => string;
  /** Dual point, e.g. "Point 9 of 12: 17 vs 15." */
  vsAt: (position: number, total: number, value: string, ref: string) => string;
  /** Dual summary, e.g. "Trending up 12% vs benchmark up 4%. Last 17 vs 15." */
  vs: (primaryClause: string, compareClause: string, lastValue: string, lastRef: string) => string;
  /** Matching-benchmark degenerate. */
  vsMatching: string;
  /** Stack point, e.g. "Point 8 of 12: Mobile 45%, Web 38%, API 17%." */
  stackAt: (position: number, total: number, clauses: string) => string;
  /** Name for a series the caller left unlabelled, e.g. "Series 2". (stacked-area) */
  seriesFallback: (position: number) => string;
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
  /** Name for an UNLABELLED item, e.g. "Span 3" / "Event 2". Reaches the live
   *  region and the visible chip, so it can never be composed inline. */
  timelineFallback: (index: number, kind: "span" | "point") => string;

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
  bandClause: (level: string, lo: string, hi: string) => string;
  /** Band edge announcement, e.g. "80% interval: 17 to 26." */
  bandEdge: (level: string, lo: string, hi: string) => string;
  /** Graded band with no spread, e.g. "Point value 21, no interval." */
  bandPoint: (value: string) => string;
  /** Icon-array summary, e.g. "3 in 20. About 15%." (+ note for degenerate/sub-unit). */
  iconArray: (k: number, n: number, pct: string, note: "none" | "all" | "sub" | null) => string;
  /** Terse VISIBLE chip form of `tokenAt`, e.g. "guessing 0.31". */
  tokenChip: (tier: string, confidence: string) => string;
  /** Icon-array's PAINTED ratio label, e.g. "3 in 20" (`label="ratio"`, the default). */
  iconArrayRatio: (k: number, n: number) => string;
  /** Icon-array unit announcement, e.g. "Unit 7 of 20 — filled. 3 of 20 filled." */
  iconArrayUnit: (index: number, n: number, filled: boolean, filledCount: number) => string;
  /** Terse VISIBLE chip form of `iconArrayUnit`, e.g. "7 of 20 — filled". */
  iconArrayChip: (index: number, n: number, filled: boolean) => string;
  /**
   * Pictogram unit announcement, e.g. "Unit 7 of 8 — 40% filled." (pictogram-row).
   * Unlike `iconArrayUnit` a pictogram unit may be PARTLY filled (`fractional`),
   * so fullness is a three-state discriminator plus a preformatted percentage
   * (only meaningful for `"part"`).
   */
  pictogramUnit: (index: number, n: number, fill: "full" | "part" | "none", pct: string) => string;
  /** Terse VISIBLE chip form of `pictogramUnit`, e.g. "7 of 8 — 40%". */
  pictogramChip: (index: number, n: number, fill: "full" | "part" | "none", pct: string) => string;
  /** Quantile-dots with a threshold, e.g. "4 in 20 chances above 15 min." */
  quantileDots: (past: number, count: number, side: string, threshold: string) => string;
  /** Quantile-dots without a threshold, e.g. "Most likely 12–15; range 4 to 38." */
  quantileDotsRange: (modeLo: string, modeHi: string, min: string, max: string) => string;
  /** Terse VISIBLE chip form of `quantileDots`, e.g. "4 in 20 above 15 min". */
  quantileDotsChip: (past: number, count: number, side: string, threshold: string) => string;
  /** Idle odds shown beside the plot, e.g. "4 in 20". */
  quantileDotsOdds: (past: number, count: number) => string;
  /** Rate-volume summary, e.g. "4.1% on 38 events (low volume); up from 2.3% across 12 periods." */
  rateVolume: (
    rateLast: string,
    volumeLast: string,
    unit: string,
    low: boolean,
    direction: "up" | "down",
    rateFirst: string,
    n: number,
  ) => string;
  /** Rate-volume, single/degenerate, e.g. "4.1% on 38 events (low volume)." */
  rateVolumeShort: (rateLast: string, volumeLast: string, unit: string, low: boolean) => string;
  /** Rate-volume period announcement, e.g. "Period 4 of 12: 4.1% on 38 events (low volume)." */
  rateVolumeAt: (
    position: number,
    total: number,
    rate: string,
    volume: string,
    unit: string,
    low: boolean,
  ) => string;
  /** Rate-volume zero-volume period, e.g. "Period 5 of 12: no events." */
  rateVolumeNoEvents: (position: number, total: number) => string;
  /** Compact rate-volume readout chip, e.g. "4.1% · 38 events (low)". */
  rateVolumeChip: (rate: string, volume: string, unit: string, low: boolean) => string;
  /** Compact rate-volume chip for a zero-volume period, e.g. "no events". */
  rateVolumeChipEmpty: string;
  /** Net-flow summary, e.g. "Net +1.1k last period; in 4.2k vs out 3.1k; net positive 9 of 12 periods." */
  netFlow: (
    netLast: string,
    inLast: string,
    outLast: string,
    netPositive: number,
    n: number,
  ) => string;
  /** Net-flow period announcement, e.g. "Period 6 of 12: in 4.2k, out 3.1k, net +1.1k." */
  netFlowAt: (
    position: number,
    total: number,
    inValue: string,
    outValue: string,
    net: string,
  ) => string;
  /** Net-flow all-zero, e.g. "No flow across 12 periods." */
  netFlowNoFlow: (n: number) => string;
  /** Retention summary, e.g. "34% retained after 8 weeks; curve plateaus from week 5." */
  retention: (last: string, n: number, unit: string, from: number) => string;
  /** Retention summary, no plateau, e.g. "34% retained after 8 weeks." */
  retentionNoPlateau: (last: string, n: number, unit: string) => string;
  /** Retention period announcement, e.g. "week 3: 41% retained (benchmark 37%)." */
  retentionAt: (unit: string, period: number, value: string, benchmark: string | null) => string;
  /** Burn summary, e.g. "12 of 20 days in: 34 points remain vs 28 planned — projected to finish 3 days late." */
  burn: (
    elapsed: number,
    total: number,
    unit: string,
    nowActual: string,
    work: string,
    verb: string,
    nowPlan: string,
    landing: string,
  ) => string;
  /** Burn summary, no plan line, e.g. "12 days in: 34 points remain." */
  burnNoPlan: (
    elapsed: number,
    unit: string,
    nowActual: string,
    work: string,
    verb: string,
  ) => string;
  /** Landing clause, e.g. "projected to finish 3 days late" / "...on time". */
  burnLanding: (delta: number, unit: string) => string;
  /** Flatlined projection clause. */
  burnFlatlined: string;
  /** Burn "remain" (down) / "done" (up) verb. */
  burnRemain: string;
  /** Default noun for the work being burned down, e.g. "points". (burn-chart) */
  burnWork: string;
  burnDone: string;
  /** Burn period announcement, e.g. "day 12: 34 points remain, plan 28." */
  burnAt: (
    unit: string,
    period: number,
    nowActual: string,
    work: string,
    verb: string,
    nowPlan: string | null,
  ) => string;
  /** Projected-region announcement, e.g. "day 18 (projected): 9 points remain." */
  burnAtProjected: (
    unit: string,
    period: number,
    value: string,
    work: string,
    verb: string,
  ) => string;
  /** Error-budget summary, e.g. "62% of error budget remains at day 12 of 30 — burning at 0.9× the steady rate." */
  errorBudget: (
    remaining: string,
    elapsed: number,
    total: number,
    unit: string,
    rate: string,
  ) => string;
  /** Exhausted-budget summary, e.g. "Budget exhausted at day 19 of 30." */
  errorBudgetExhausted: (unit: string, at: number, total: number) => string;
  /** Error-budget step announcement, e.g. "day 12 of 30: 62% budget remaining, burning at 1.4× steady rate." */
  errorBudgetAt: (
    unit: string,
    at: number,
    total: number,
    remaining: string,
    rate: string,
  ) => string;
  /** Control summary, e.g. "2 of 30 points outside control limits (center 74.2, limits 69.0–79.4)." */
  control: (k: number, n: number, center: string, lo: string, hi: string) => string;
  /** In-control summary, e.g. "All 30 points within control limits (center 74.2, limits 69.0–79.4)." */
  controlInControl: (n: number, center: string, lo: string, hi: string) => string;
  /** Provisional-limits clause appended when n < 10, e.g. " Limits provisional (n=6)." */
  controlProvisional: (n: number) => string;
  /** Control point announcement, e.g. "Point 14 of 30: 82.1 — above the upper limit (79.4)." */
  controlAt: (
    position: number,
    total: number,
    value: string,
    side: "upper" | "lower" | null,
    limit: string,
  ) => string;
  /** Compact control readout chip, e.g. "82.1 above 79.4" (side null → just the value). */
  controlChip: (value: string, side: "upper" | "lower" | null, limit: string) => string;
  /** Forecast summary, e.g. "Median forecast 42 by week 14 (80% between 33 and 55), from 38 today." */
  forecast: (
    mid: string,
    at: number,
    unit: string,
    lo: string,
    hi: string,
    now: string | null,
  ) => string;
  /** Clearance clause, e.g. " The 80% band clears the 45 target." */
  forecastClearance: (status: "clears" | "straddles" | "misses", target: string) => string;
  /** History-region announcement, e.g. "Week 9: 38." */
  forecastAtHistory: (unit: string, period: number, value: string) => string;
  /** Forecast-region announcement, e.g. "Week 14 (forecast): median 42, 80% between 33 and 55." */
  forecastAtForecast: (unit: string, period: number, mid: string, lo: string, hi: string) => string;
  /** A/B summary, e.g. "B median 118 ms vs A 130 ms (−9%); middle halves overlap 40%." */
  ab: (
    bLabel: string,
    bMed: string,
    aLabel: string,
    aMed: string,
    delta: string,
    overlapPct: string,
  ) => string;
  /** Appended verdict when overlap is total / none. */
  abSeparated: string;
  abNoDiff: string;
  /** A/B row announcement, e.g. "B median 118 ms, 12 ms below A." */
  abRow: (
    label: string,
    med: string,
    amount: string,
    dir: "below" | "above",
    other: string,
  ) => string;
  /** A/B edge announcement, e.g. "B p75: 140 ms." */
  abEdge: (label: string, p: number, value: string) => string;
  /** Shift summary, e.g. "Median fell from 130 ms to 106 ms." */
  shift: (direction: "fell" | "rose", before: string, after: string) => string;
  /** No-change shift, e.g. "Median unchanged at 130 ms." */
  shiftHeld: (value: string) => string;
  /** Appended when the two sides have unequal n, e.g. " On 6,400 / 7,100 samples." */
  shiftSamples: (nBefore: number, nAfter: number) => string;
  /** One-sided (the other side is empty), e.g. "Median 130 ms; no after sample." */
  shiftOneSide: (value: string, missing: string) => string;
  /** Shift bin announcement, e.g. "10–12 ms: 18% before, 6% after." */
  shiftBin: (lo: string, hi: string, beforePct: string, afterPct: string) => string;
  /** Pareto summary, e.g. "Top 3 of 9 causes account for 82% of incidents." */
  pareto: (k: number, n: number, unit: string, cumPct: string, metric: string) => string;
  /** Pareto without a threshold, e.g. "Timeouts leads at 34%." */
  paretoTop: (topLabel: string, topPct: string) => string;
  /** Empty (zero total), e.g. "No recorded incidents." */
  paretoEmpty: (metric: string) => string;
  /** Pareto bar announcement, e.g. "Timeouts: 34% of total, cumulative 61%." */
  paretoAt: (label: string, sharePct: string, cumPct: string) => string;
  /** Pareto's PAINTED gutter label, e.g. "3 of 12 → 61%". Rendered, not spoken,
   *  so it needs its own token: the announcement above is a sentence and this is
   *  a two-number caption, and the arrow is a glyph a locale may reorder. */
  paretoCount: (k: number, n: number, cumPct: string) => string;
  /** DataDiff summary, e.g. "+512 added, −187 removed across 6 keys; largest change: users (+340)." */
  dataDiff: (added: string, removed: string, n: number, key: string, net: string) => string;
  /** DataDiff with no net change anywhere, e.g. "No changes across 6 keys." */
  dataDiffEmpty: (n: number) => string;
  /** DataDiff row announcement, e.g. "users: +340 added, −120 removed, net +220." */
  dataDiffAt: (key: string, added: string, removed: string, net: string) => string;
  /** Quadrant name, e.g. "high-impact, low-effort" (reading: y then x). */
  quadrantName: (yHigh: boolean, yLabel: string, xHigh: boolean, xLabel: string) => string;
  /** QuadrantDot summary against a field, e.g. "Impact 9, effort 3 — in the high-impact, low-effort quadrant (2 of 14 peers)." */
  quadrant: (
    yLabel: string,
    yv: string,
    xLabel: string,
    xv: string,
    quadName: string,
    k: number,
    n: number,
  ) => string;
  /** QuadrantDot with no field, e.g. "Impact 9, effort 3 — in the high-impact, low-effort quadrant." */
  quadrantLone: (
    yLabel: string,
    yv: string,
    xLabel: string,
    xv: string,
    quadName: string,
  ) => string;
  /** Peer announcement, e.g. "Peer 3 of 12: effort 6, impact 4 — high-effort, low-impact." */
  quadrantAt: (
    pos: number,
    total: number,
    xLabel: string,
    xv: string,
    yLabel: string,
    yv: string,
    quadName: string,
  ) => string;
  /** CyclePlot summary with a leading drift, e.g. "Peaks Fri (61), dips Sun (38); Mon rising across 6 weeks." */
  cycle: (
    peakSlot: string,
    peak: string,
    dipSlot: string,
    dip: string,
    driftSlot: string,
    driftDir: "rising" | "falling",
    cycles: number,
    cycleUnit: string,
  ) => string;
  /** CyclePlot summary, no notable drift, e.g. "Peaks Fri (61), dips Sun (38)." */
  cycleNoDrift: (peakSlot: string, peak: string, dipSlot: string, dip: string) => string;
  /** Slot drift direction, indexed by sign+1 (falling, steady, rising). (cycle-plot) */
  cycleDriftNames: readonly [string, string, string];
  /** Slot announcement, e.g. "Mondays: mean 42 across 6 weeks, rising." */
  cycleAt: (
    slotName: string,
    center: "mean" | "median",
    value: string,
    cycles: number,
    cycleUnit: string,
    driftDir: "rising" | "falling" | "steady",
  ) => string;
  /** Within-slot observation, e.g. "Mon, cycle 3 of 6: 44." */
  cyclePoint: (slotName: string, pos: number, total: number, value: string) => string;
  /** Slot with no observations, e.g. "Wednesdays: no data." (cycle-plot). */
  cycleEmpty: (slotName: string) => string;
  /** ChangePoint summary, e.g. "Level shifted up 50% around point 34 (mean 32 → 48); stable since." */
  changePoint: (
    dir: "up" | "down",
    delta: string,
    i: number,
    before: string,
    after: string,
    tail: "stable" | "again",
  ) => string;
  /** No detected shift, e.g. "No clear level shift across 90 points." */
  changePointNone: (n: number) => string;
  /** Point announcement, e.g. "Point 40: 51 — regime 2 of 3, mean 48." */
  changePointAt: (
    pos: number,
    value: string,
    regime: number,
    regimes: number,
    mean: string,
  ) => string;
  /** Regime tag for the VISIBLE chip, e.g. "regime 2 of 3". `changePointAt`
   *  already carries the same words for the announcement; the chip is a caption
   *  and needs the fragment on its own. */
  changePointRegime: (regime: number, regimes: number) => string;
  /** Break announcement, e.g. "Break at point 34: mean 32 to 48 (+50%)." */
  changePointBreak: (i: number, before: string, after: string, signedDelta: string) => string;
  /** Ensemble summary, e.g. "24 simulated paths end between 31 and 58; typical path ends near 44." */
  ensemble: (n: number, lo: string, hi: string, mid: string) => string;
  /** Single-member ensemble, e.g. "Single path, ends at 44." */
  ensembleSingle: (end: string) => string;
  /** Member announcement, e.g. "Member 7 of 24; ends at 42." */
  ensembleAt: (pos: number, total: number, end: string) => string;
  /** Member with no terminal value, e.g. "Member 7 of 24; no data." (ensemble-ghosts). */
  ensembleEmpty: (pos: number, total: number) => string;
  /** Zone display names, indexed severe-low → below → in → above → severe-high. */
  tirNames: readonly [string, string, string, string, string];
  /** One zone clause, e.g. "72% in range" (time-in-range). */
  tirClause: (pct: string, name: string) => string;
  /** Full time-in-range summary from a joined clause list, e.g.
   *  "72% in range, 9% below, 19% above." */
  timeInRange: (list: string) => string;
  /** Interactive zone announce, e.g. "In range: 72%." (time-in-range). */
  tirZone: (name: string, pct: string) => string;
  /** Hypnogram overview, e.g. "14 transitions across 4 states; longest run Light." */
  hypnogram: (transitions: number, states: number, longest: string) => string;
  /** Single-run hypnogram, e.g. "1 state, no transitions; Awake throughout." */
  hypnogramFlat: (state: string) => string;
  /** Interactive run announce, e.g. "Light, from 90 to 240." (hypnogram). */
  hypnogramRun: (state: string, t0: string, t1: string) => string;
  /** ETA forecast, e.g. "64% done; about 2 min remaining at the current rate." */
  etaBar: (pct: string, remaining: string) => string;
  /** Stalled transfer, e.g. "64% done; stalled." (eta-bar). */
  etaBarStalled: (pct: string) => string;
  /** Completed, e.g. "Done." (eta-bar). */
  etaBarDone: string;
  /** Waveform overview, e.g. "Peak 0.82 at 63% through 4,096 samples." */
  waveform: (peak: string, pct: string, n: string) => string;
  /** All-silence, e.g. "Silent." (waveform). */
  waveformSilent: string;
  /** Interactive bucket announce, e.g. "63% through, peak 0.82." (waveform). */
  waveformAt: (pct: string, value: string) => string;
  /** EventRaster overview, e.g. "6 lanes, 214 events; busiest api (89)." */
  eventRaster: (lanes: number, events: number, lane: string, count: number) => string;
  /** Binned-lane disclosure appended to the raster summary, e.g. " api shown binned." */
  eventRasterBinned: (lanes: string) => string;
  /** Interactive event announce, e.g. "api, event at 42 (3 of 89)." (event-raster). */
  eventRasterAt: (lane: string, t: string, k: number, n: number) => string;
  /** RubricStrip overview, e.g.
   *  "4 criteria; highest Correctness (0.92), lowest Style (0.41)." */
  rubric: (n: number, hi: string, hiScore: string, lo: string, loScore: string) => string;
  /** Interactive criterion announce, e.g. "Correctness: 0.92, weight 40% of total." */
  rubricRow: (label: string, score: string, weightPct: string) => string;
  /** Criterion with no score, e.g. "Style: no score, weight 20% of total." (rubric-strip). */
  rubricRowEmpty: (label: string, weightPct: string) => string;
  /** TokenConfidence empty state, e.g. "No tokens." — a distinct key from the
   *  series `noData` so the aggregate EN dictionary keeps both (spread order). */
  noTokens: string;
  /** TokenConfidence overview, e.g. "42 tokens: 33 confident, 6 unsure, 3 guessing." */
  tokenConfidence: (n: number, confident: number, unsure: number, guessing: number) => string;
  /** Tier display names, indexed confident → unsure → guessing. */
  tokenTierNames: readonly [string, string, string];
  /** Interactive token announce, e.g. "sauce: guessing, 0.22." (token-confidence). */
  tokenAt: (token: string, tier: string, confidence: string) => string;
  /** TokenConfidence aria-label fallback when title and summary are absent. */
  tokenConfidenceLabel: string;
  /** WindBarb reading, e.g. "Southwest (225°), magnitude 32." */
  windBarb: (compass: string, deg: string, value: string) => string;
  /** Terse VISIBLE chip form, e.g. "southwest 225° · 32" (wind-barb). */
  windBarbChip: (compass: string, deg: string, value: string) => string;
  /** Calm state, e.g. "Calm." (wind-barb). */
  windBarbCalm: string;
  /** Compass octant names, indexed N, NE, E, SE, S, SW, W, NW. Canonically
   *  lowercase (used sentence-medially by station-glyph); templates that open a
   *  sentence with an octant capitalize it themselves. */
  compass8: readonly [string, string, string, string, string, string, string, string];
  /** StarSpoke overview, e.g. "5 metrics; highest Speed (0.9), lowest Cost (0.3)." */
  starSpoke: (n: number, hi: string, hiValue: string, lo: string, loValue: string) => string;
  /** Interactive spoke announce, e.g. "Speed: 0.9." (star-spoke). */
  spokeAt: (label: string, value: string) => string;
  /** Spoke with no value, e.g. "Speed: no data." (star-spoke). */
  spokeEmpty: (label: string) => string;
  /** MinimapStrip overview, e.g.
   *  "Viewing 12% of the whole (520–660 of 1,200); 3 marks; 8% unknown." */
  minimap: (
    pct: string,
    a: string,
    b: string,
    total: string,
    marks: number,
    unknownClause: string,
  ) => string;
  /** Unknown-share clause appended to the minimap summary, e.g. "; 8% unknown". */
  minimapUnknown: (pct: string) => string;
  /** Interactive window announce, e.g. "Viewing 520 to 660 of 1,200." (minimap). */
  minimapView: (a: string, b: string, total: string) => string;
  /** DualWindowMeter overview, e.g. "Slow window −23.1 vs target −23.0; fast −20.4." */
  dualWindow: (slow: string, target: string, fast: string) => string;
  /** Interactive point announce, e.g. "fast −20.4, slow −23.1, target −23.0." */
  dualWindowAt: (fast: string, slow: string, target: string) => string;
  /** DepthWedge overview, e.g.
   *  "Demand outweighs supply 1.8× within the shown range; spread 0.25." */
  depthWedge: (leadSide: string, laggSide: string, ratio: string, spread: string) => string;
  /** Balanced book, e.g. "Demand and supply are balanced; spread 0.25." Side
   *  names default to `depthWedgeSides` (sentence-initial casing). */
  depthWedgeBalanced: (spread: string, sideA?: string, sideB?: string) => string;
  /** Side names, indexed demand, supply. */
  depthWedgeSides: readonly [string, string];
  /** Interactive depth announce, e.g. "demand: 1,240 within 0.20 of mid." */
  depthWedgeAt: (side: string, cum: string, dist: string) => string;
  /** PartitionStrip overview, e.g.
   *  "3 groups, 8 parts; largest JS → react (28% of the whole)." */
  partition: (groups: number, parts: number, parent: string, child: string, pct: string) => string;
  /** Single-level partition, e.g. "3 groups; largest JS (44% of the whole)." */
  partitionFlat: (groups: number, parent: string, pct: string) => string;
  /** Interactive node announce, e.g. "react: 120, 28% of the whole, 63% of JS."
   *  `value` is the node's own magnitude; shares are derived from it and cannot
   *  be inverted back to it without the total. */
  partitionAt: (label: string, pct: string, parentClause: string, value: string) => string;
  /** Parent clause appended for a child node, e.g. ", 63% of JS". */
  partitionParent: (pct: string, parent: string) => string;
  /** CalibrationStrip overview, e.g.
   *  "10 bins; largest gap at 0.7 predicted (observed 0.52); 2 low-support bins." */
  calibration: (bins: number, p: string, o: string, low: number) => string;
  /** Perfect calibration, e.g. "10 bins; well calibrated." (calibration-strip). */
  calibrationGood: (bins: number) => string;
  /** Interactive bin announce, e.g. "predicted 0.7, observed 0.52, 40 samples." */
  calibrationAt: (p: string, o: string, n: number, lowClause: string) => string;
  /** Low-support clause appended to a bin announce, e.g. ", low support". */
  calibrationLow: string;
  /** Compact calibration readout chip, e.g. "0.7 → 0.52 (n=40, low support)". */
  calibrationChip: (p: string, o: string, n: string, lowClause: string) => string;
  /** ConfusionGrid overview, e.g.
   *  "Accuracy 87%. Most confused: cat predicted as dog (12% of cats)." */
  confusion: (acc: string, actual: string, predicted: string, pct: string) => string;
  /** Perfect diagonal, e.g. "Accuracy 100%. No confusion." (confusion-grid). */
  confusionPerfect: (acc: string) => string;
  /** Interactive cell announce, e.g. "Actual cat, predicted dog: 12% of cats (8)."
   *  `count` is the cell's own tally — the number the caller passed. The row
   *  percentage hides it, and no other surface carries it. */
  confusionAt: (actual: string, predicted: string, pct: string, count: string) => string;
  /** Empty-row note, e.g. "no dog samples" appended to the summary. */
  confusionEmpty: (cls: string) => string;
  /** FoldedDayBand overview, e.g. "Median peaks at 14 (82)." (+ today clause). */
  foldedBand: (pos: string, value: string, todayClause: string) => string;
  /** Today-vs-typical clauses, indexed below-25 / typical / above-75. */
  foldedToday: readonly [string, string, string];
  /** Interactive fold-bin announce, e.g. "at 14: median 82, middle half 70–90." */
  foldedAt: (pos: string, m: string, q1: string, q3: string, todayClause: string) => string;
  /** VolumeProfile overview, e.g. "Activity concentrates at 142 (POC); 70% within 138–147." */
  volumeProfile: (poc: string, va: string, lo: string, hi: string) => string;
  /** Uniform distribution, e.g. "Activity is evenly spread." (volume-profile). */
  volumeEven: string;
  /** Interactive level announce, e.g. "level 142: 3,400, 18% of activity (POC)."
   *  `mass` is the level's own activity magnitude behind the share. */
  volumeAt: (level: string, pct: string, pocClause: string, mass: string) => string;
  /** POC clause appended to a level announce, e.g. " (POC)". */
  volumePoc: string;
  /** PhaseTrace overview, e.g. "Latency vs CPU: now 62, 130; heading up-right." */
  phaseTrace: (yLabel: string, xLabel: string, x: string, y: string, direction: string) => string;
  /** Heading words, indexed up-right / up-left / down-right / down-left / steady. */
  phaseHeadings: readonly [string, string, string, string, string];
  /** Interactive point announce, e.g. "point 8 of 20: CPU 62, Latency 130." */
  phaseAt: (i: number, n: number, xLabel: string, x: string, yLabel: string, y: string) => string;
  /** TraceFold overview, e.g.
   *  "9 spans over 214 ms; longest db.query (86 ms) on the critical path." */
  traceFold: (
    n: number,
    total: string,
    label: string,
    duration: string,
    onCritical: boolean,
  ) => string;
  /** Interactive span announce, e.g. "db.query, 86 ms, 40% of total, depth 2, on the critical path." */
  traceFoldAt: (
    label: string,
    duration: string,
    pct: string,
    depth: number,
    criticalClause: string,
  ) => string;
  /** Critical-path clause appended to a span announce, e.g. ", on the critical path". */
  traceCritical: string;
  /** TapeGauge reading, e.g. "Now 142, rising; in the 130–150 caution zone." */
  tapeGauge: (value: string, rateClause: string, zoneClause: string) => string;
  /** Rate words, indexed by chevron tier + 2: falling fast … steady … rising fast. */
  tapeRates: readonly [string, string, string, string, string];
  /** Zone clause, e.g. "; in the 130–150 zone" (tape-gauge). */
  tapeZone: (from: string, to: string) => string;
  /** StationGlyph reading, e.g. "KSFO, wind southwest 15; sky broken, 16° / 9°, 1013." */
  stationGlyph: (station: string, windClause: string, sky: string, fieldsClause: string) => string;
  /** Sky-cover words indexed by round(fraction·4): clear … overcast. */
  stationSky: readonly [string, string, string, string, string];
  /** Wind clause, e.g. ", wind southwest 15" (station-glyph). */
  stationWind: (octantName: string, magnitude: string) => string;
  /** Calm-wind clause, e.g. ", wind calm" (station-glyph). */
  stationCalm: string;
  /** Interactive field-by-field readouts (station-glyph roving keyboard). */
  stationFieldWindCalm: string;
  stationFieldWind: (octantName: string, magnitude: string) => string;
  stationFieldSky: (sky: string) => string;
  stationFieldTemp: (v: string) => string;
  stationFieldDew: (v: string) => string;
  stationFieldPressure: (v: string) => string;
  /** CohortTriangle summary, e.g.
   *  "5 cohorts; at month 1, Mar retains worst (47%); newest May starts at 100%." */
  cohortTriangle: (
    n: number,
    unit: string,
    worstLabel: string,
    age: number,
    worstValue: string,
    newestLabel: string,
    newestFirst: string,
  ) => string;
  /** Single-cohort / no-comparison form, e.g. "1 cohort; Jan starts at 100%." */
  cohortTriangleShort: (n: number, newestLabel: string, newestFirst: string) => string;
  /** Interactive cell announce, e.g. "Feb cohort, month 1: 50%." */
  cohortTriangleAt: (cohortLabel: string, unit: string, age: number, value: string) => string;
  /** Interactive gap announce, e.g. "Feb cohort, month 2: no data." */
  cohortTriangleEmpty: (cohortLabel: string, unit: string, age: number) => string;
  /** StreakSpark overview, e.g. "Current run 2 failing; record 9; broke 3 times." */
  streakSpark: (current: string, word: string, record: string, breaks: number) => string;
  /** Unbroken streak, e.g. "Current run 6 passing, unbroken." (streak-spark). */
  streakSparkUnbroken: (current: string, word: string) => string;
  /** No completed streak, e.g. "Current run 5 failing; no completed streak." (streak-spark). */
  streakSparkAllBreak: (current: string, word: string) => string;
  /** Interactive run announce, e.g. "Run 4 of 12: 9 passing, record." (streak-spark). */
  streakAt: (pos: number, total: number, len: string, word: string, recordClause: string) => string;
  /** Record-run clause appended to a run announce, e.g. ", record". (streak-spark). */
  streakRecord: string;
  /** Run outcome words, indexed streak (ok) then break (fail). (streak-spark). */
  streakWords: readonly [string, string];
  /** GradeProfile overview, e.g. "900 m, 67 m gain; steepest 16% at 800 m." */
  gradeProfile: (distance: string, gain: string, grade: string, at: string) => string;
  /** GradeProfile with no real climb (flat / descent-only), e.g. "600 m, no real climb." */
  gradeProfileFlat: (distance: string) => string;
  /** GradeProfile pitch announce, e.g. "km 18: 9.5%, 620 m gained." */
  gradeProfileAt: (at: string, grade: string, gain: string) => string;
  /** GradeProfile summit callout, e.g. "12% max". */
  gradeMax: (grade: string) => string;
  /** WinProbWorm summary, e.g. "Per the supplied model, home leads at 98%; 3 lead changes, biggest swing +17 at point 8." */
  winProbWorm: (
    leader: string,
    prob: string,
    flips: number,
    swingAt: number,
    swingDelta: string,
  ) => string;
  /** Constant lead, e.g. "Per the supplied model, home holds 64% throughout." */
  winProbWormFlat: (leader: string, prob: string) => string;
  /** Constant 50, e.g. "Per the supplied model, even at 50% throughout." */
  winProbWormTied: (prob: string) => string;
  /** Point announcement, e.g. "Point 15: home 98%." */
  winProbWormAt: (pos: number, leader: string, prob: string) => string;
  /** QueueDepth summary, e.g. "214 queued, 2.1× capacity, growing over the last quarter." */
  queueDepth: (depth: string, capacityClause: string, trend: string) => string;
  /** Breach clause, e.g. ", 2.1× capacity" (queue-depth). */
  queueOver: (ratio: string) => string;
  /** Under-capacity clause, e.g. ", within capacity" (queue-depth). */
  queueUnder: string;
  /** Trend words (queue-depth): growing / draining / holding steady. */
  queueGrow: string;
  queueDrain: string;
  queueFlat: string;
  /** QueueDepth period announcement, e.g. "t8: 214 queued, above capacity." */
  queueAt: (period: number, value: string, breachClause: string) => string;
  /** Above-capacity clause appended to a period announce (queue-depth). */
  queueAbove: string;
  /** SpreadBand lead summary, e.g. "Organic leads Paid by 8; last crossed at point 5." */
  spreadBand: (leader: string, other: string, gap: string, sinceClause: string) => string;
  /** Flip clause appended to a spread-band summary, e.g. "; last crossed at point 5". */
  spreadBandFlip: (position: number) => string;
  /** Never-crossed clause appended to a spread-band summary. */
  spreadBandNever: string;
  /** SpreadBand level/degenerate — identical or endpoint-tied series. */
  spreadBandTie: string;
  /** SpreadBand point announce, e.g. "Point 12 of 12: Organic +8 over Paid." */
  spreadBandAt: (
    position: number,
    total: number,
    leader: string,
    gap: string,
    other: string,
  ) => string;
  /** SpreadBand tie announce, e.g. "Point 6 of 12: level." */
  spreadBandAtTie: (position: number, total: number) => string;
  /** SpreadBand empty-point announce, e.g. "Point 3 of 12: no data." */
  spreadBandAtEmpty: (position: number, total: number) => string;
  /** BiasStrip agreement summary, e.g. "Bias +2.21 across 20 pairs; 90% within the limits of agreement." */
  biasStrip: (bias: string, n: number, withinPct: string) => string;
  /** BiasStrip small-sample summary (n < 5, no band), e.g. "Bias +2 across 4 pairs." */
  biasStripShort: (bias: string, n: number) => string;
  /** BiasStrip pair announcement, e.g. "Pair 12 of 20: mean 41.2, diff +3.1 — outside the limits." */
  biasStripAt: (
    pos: number,
    total: number,
    mean: string,
    diff: string,
    statusClause: string,
  ) => string;
  /** Outside-limits clause appended to a BiasStrip pair announce. */
  biasOutside: string;
  /** BiasStrip's PAINTED caption, e.g. "+3.2 bias". The one word beside the
   *  number, and the only English left in that chart's rendered output. */
  biasStripLabel: (bias: string) => string;
  /** PercentileTrace value notation, e.g. "p81". (percentile-trace). */
  percentileValue: (n: string) => string;
  /** PercentileTrace summary, e.g. "p81 now, up 41 points from the first reading; moved above the middle half." */
  percentileTrace: (current: string, delta: string, band: string) => string;
  /** PercentileTrace change clause, e.g. "up 41 points from the first reading". */
  percentileDelta: (direction: "up" | "down", amount: string) => string;
  /** PercentileTrace no-change clause, e.g. "unchanged from the first reading". */
  percentileFlat: string;
  /** PercentileTrace band-movement clause, e.g. "moved above the middle half". */
  percentileBand: (
    movement:
      | "roseAbove"
      | "fellBelow"
      | "enteredMiddle"
      | "heldAbove"
      | "heldMiddle"
      | "heldBelow",
  ) => string;
  /** PercentileTrace reading announcement, e.g. "week 6: p68". (percentile-trace). */
  percentileTraceAt: (unit: string, index: number, value: string) => string;
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

/**
 * "Trending up 12%. Range 3 to 18. Last value 17." — the default accessible
 * name for a chart. Degenerate series produce honest short forms:
 * empty/all-null → "No data.", one point → "Single value X.", constant →
 * "Flat at X." Direction is stated factually (up/down); valence/color live in
 * the component, never in the words.
 */
export function describeSeries(values: readonly Value[], opts: DescribeOptions = {}): string {
  const s = seriesStats(values);
  const t = opts.strings ?? EN_SERIES;
  if (!s) return t.noData;

  const fmt = cachedFormatter(opts.format, opts.locale);
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
      // Percent as a plain integer, but routed through the locale formatter so
      // digits match the rest of the sentence (never String() — that pins ASCII
      // digits, mixing scripts in e.g. Arabic/Devanagari locales).
      const pctFmt = cachedFormatter({ maximumFractionDigits: 0 }, opts.locale);
      parts.push(t.trendPct(dir, pctFmt(Math.round(Math.abs(s.deltaRatio) * 100))));
    }
  }
  parts.push(t.range(fmt(s.min), fmt(s.max)));
  parts.push(t.last(fmt(s.last)));
  return parts.join(" ");
}

/**
 * Resolve a chart's `summary` prop to its rendered accessible description.
 * `false` stays `false` (decorative, T0 opt-out); an explicit string wins; only
 * when omitted is the default generated. `generate` is a callback so the (often
 * formatter-heavy) default is computed lazily — decorative charts never pay for
 * a summary they won't render.
 */
export function resolveSummary(
  summary: string | false | undefined,
  generate: () => string,
): string | false {
  return summary === false ? false : (summary ?? generate());
}
