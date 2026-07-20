/**
 * Accessible strings a chart page quotes that the STATIC render cannot contain.
 *
 * Almost every `**"…"**` quote in a chart page's `## Accessibility` section is an
 * accessible name the page's own demos render, so the built HTML proves it. The
 * exceptions are listed here, each hand-verified against the generator that
 * produces it. Two kinds qualify:
 *
 *  - **interactive readouts** — announced on hover/focus by the `…/interactive`
 *    entry, so they exist only after hydration and a pointer/key event.
 *  - **conditional static names** — a real code path (a locale variant, a
 *    degenerate-input branch) that no demo on the page happens to exercise.
 *
 * Everything here is a claim a reader will take literally, so an entry earns its
 * place only with the code path that generates it. `chart-a11y-claims.test.ts`
 * enforces both directions: an unlisted, unrendered quote fails, and a listed
 * string no page quotes any more fails too.
 */
export const INTERACTIVE_READOUT_CLAIMS: Record<string, readonly string[]> = {
  // de-DE variant of the static name; no demo on the page passes a locale.
  // EN_BIAS_STRIP.biasStrip + makeFormatter(…, { signDisplay: "exceptZero" }).
  "bias-strip": ["Bias +2,21 across 20 pairs; 90% within the limits of agreement."],
  // client.tsx → strings.bubbleAt(label, fmt(value)) — EN_BUBBLE.bubbleAt.
  "bubble-row": ["EMEA: 1,240."],
  // client.tsx → strings.rankAt(i + 1, n, rank) — EN_FLOW.rankAt.
  "bump-strip": ["Week 7 of 12: #2."],
  // client.tsx → strings.dayAt / strings.dayEmpty — EN_CALENDAR.
  "calendar-strip": ["Thursday, June 11: 0.", "Tuesday, June 23: no data."],
  // index.tsx confusionPerfect — the zero-off-diagonal branch.
  "confusion-grid": ["Accuracy 100%. No confusion."],
  // client.tsx → strings.category(label, value, rank, of) — EN_CATEGORY.category.
  "dot-plot": ["Ada: 96 — 1st of 3."],
  // client.tsx → strings.vsAt(pos, total, v, ref) — EN_VS.vsAt.
  "dual-sparkline": ["Point 9 of 12: 17 vs 15."],
  // client.tsx → strings.fromTo(from, to, dir, pct) — EN_PAIRED.fromTo.
  dumbbell: ["From 52 to 61, up 17%."],
  // client.tsx → strings.spanAt / strings.eventAt — EN_TIMELINE, UTC date formatter.
  "event-timeline": ["Freeze: Jun 3, 01:00 to Jun 3, 05:00 — 4h.", "Incident: Jun 3, 11:00."],
  // client.tsx → strings.stageAt(label, value, retainedPct, firstLabel).
  funnel: ["Activated: 2,730 — 22% of Visitors."],
  // client.tsx → strings.gardenCell(pos, total, value, step, steps).
  "garden-grid": ["3 of 21: 8, step 2 of 5."],
  // client.tsx → EN_SERIES.point(pos, total, v).
  "heat-strip": ["Point 8 of 20: 90."],
  // client.tsx → strings.binAt(lo, hi, count) — EN_DIST.binAt.
  "histogram-strip": ["42.09 to 47.36: 26 values."],
  // client.tsx → strings.honeycombCell(pos, total, state) — EN_HONEYCOMB.
  honeycomb: ["Cell 7 of 40 — filled."],
  // client.tsx → strings.hypnogramRun(state, t0, t1).
  hypnogram: ["Light, from 8 to 22."],
  // client.tsx → strings.iconArrayUnit(pos, n, filled, k).
  "icon-array": ["Unit 1 of 20 — filled. 3 of 20 filled."],
  // client.tsx → strings.likertAt(label, share, level + 1, levels).
  "likert-strip": ["Disagree: 14%, level 2 of 5."],
  // client.tsx → strings.boxStat("median", fmt(v)) — EN_DIST.boxStat.
  "micro-box": ["Median: 42."],
  // client.tsx → strings.category(label, value, rank, of), ranks descending.
  "mini-bar": ["East: 940 — 1st of 4."],
  // client.tsx → EN_SERIES.point(pos, total, v) over the hero [3,5,4,8,6,9].
  "music-staff": ["Point 3 of 6: 4."],
  // client.tsx → strings.ohlcAt(pos, total, o, h, l, c).
  ohlc: ["Period 18 of 20: open 145.6, high 150.6, low 141.6, close 144.1."],
  // client.tsx → ladderProbe(label, value, ratio) — EN_QUANTILE.
  "percentile-ladder": ["p99: 1,661.13 — 13.3× the median."],
  // client.tsx → strings.queueAt(i, value, strings.queueAbove).
  "queue-depth": ["t8: 214 queued, above capacity."],
  // client.tsx → strings.rubricRow(label, score, weightShare).
  "rubric-strip": ["Coverage: 0.78, weight 29% of total."],
  // client.tsx → strings.observation(value, rank, count) — EN_DIST.observation.
  "rug-strip": ["48 — 2nd of 17."],
  // client.tsx → strings.shareOther(label, pct, members).
  "segmented-bar": ["Other: 2%, 2 categories."],
  // client.tsx → strings.slopeAt(label, from, to, dir, pct) — EN_PAIRED.slopeAt.
  slope: ["East: 40 to 47, up 18%."],
  // client.tsx → strings.spreadBandAt(pos, total, leader, gap, other).
  "spread-band": ["Point 12 of 12: Organic +8 over Paid."],
  // client.tsx → strings.sproutStage(label, stageName, stage + 1).
  "sprout-row": ["Acme: bloom, stage 4 of 4."],
  // client.tsx → strings.stackAt(pos, total, shares) — EN_STACK.
  "stacked-area": ["Point 8 of 12: Mobile 56%, Web 36%, API 8%."],
  // client.tsx → strings.runAt(i + 1, runs, count, state).
  "streak-spark": ["Run 3 of 5: 4 passing."],
  // client.tsx → strings.tirZone(name, pct) — EN_TIME_IN_RANGE.
  "time-in-range": ["in range: 72%."],
  // client.tsx → strings.stepAt(label, signed, running); minus is U+2212.
  waterfall: ["Refunds: −12, running 108."],
};
