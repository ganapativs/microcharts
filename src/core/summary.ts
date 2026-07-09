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
  /** S4 occupancy, e.g. "34 of 40 seats filled." (honeycomb). */
  honeycomb: (value: string, total: string, unit: string) => string;
  /** S1 sparse events, e.g. "4 events between Jan and Jun; largest at Mar." */
  constellation: (n: number, first: string, last: string, largest: string) => string;
  /** Single sparse event, e.g. "1 event at Mar." (constellation). */
  constellationOne: (label: string) => string;
  /** Hovered/focused constellation event, e.g. "Mar: 82, magnitude 5." */
  constellationAt: (label: string, value: string) => string;
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
  /** Quantile-dots with a threshold, e.g. "4 in 20 chances above 15 min." */
  quantileDots: (past: number, count: number, side: string, threshold: string) => string;
  /** Quantile-dots without a threshold, e.g. "Most likely 12–15; range 4 to 38." */
  quantileDotsRange: (modeLo: string, modeHi: string, min: string, max: string) => string;
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
  /** Break announcement, e.g. "Break at point 34: mean 32 to 48 (+50%)." */
  changePointBreak: (i: number, before: string, after: string, signedDelta: string) => string;
  /** Ensemble summary, e.g. "24 simulated paths end between 31 and 58; typical path ends near 44." */
  ensemble: (n: number, lo: string, hi: string, mid: string) => string;
  /** Single-member ensemble, e.g. "Single path, ends at 44." */
  ensembleSingle: (end: string) => string;
  /** Member announcement, e.g. "Member 7 of 24; ends at 42." */
  ensembleAt: (pos: number, total: number, end: string) => string;
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
