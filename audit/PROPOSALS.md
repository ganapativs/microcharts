# New-chart proposals — research round 2026-07-10

Method: 3 independent research passes (word-scale literature · industry product surfaces · editorial/consumer graphics), each cross-checked against the 98 shipped slugs + plan/15 cut ledger + plan/05 §4 bans, then judged by the orchestrator against the admission bar (≤200×60, unique decision question, honest documented channel, read-back without training). Visual designs: Artifact "proposal board" (https://claude.ai/code/artifact/9060e71f-e7e0-413b-934b-acc3e5379a04).

## Proposed (8) — ranked

| # | Name | Family | Answers | Nearest / gap | Lineage | Floors |
|---|---|---|---|---|---|---|
| 1 | **CohortTriangle** | grid | which vintage retains worst, at equal maturity | RetentionCurve (one decay line); ActivityGrid (calendar-fixed) — no ragged age-aligned matrix | chain-ladder actuarial; PostHog/Amplitude/Mixpanel standard; rolling-return triangles (2nd documented read) | ≥60×44; ≤2.2 kB |
| 2 | **StreakSpark** | strip | current run vs record + run texture | SparkBar win-loss (raw sequence, no run aggregation); Progress+Marker loses run texture | Wald–Wolfowitz runs; days-since-incident boards; hit/habit streaks | ≥72×12; ≤1.8 kB |
| 3 | **GradeProfile** | band | how hard is the route, where | Horizon (folds sign); CitySkyline (categorical) — no derivative-colored profile | Strava/Komoot climb profiles; grade categories | ≥72×20; ≤2.4 kB. Honesty: ≤4 documented grade bins, never continuous ramp |
| 4 | **WinProbWorm** | line | who's winning, when did it flip | Sparkline (unbounded/single-valence); NetFlow (quantity) | ESPN/Statcast win prob; cricket worms; honest non-gauge election read. AI: agent-run success over steps | ≥80×18; ≤2.2 kB. Honesty: never truncate 0–100; name the model in summary |
| 5 | **QueueDepth** | band | backlog level vs capacity, draining or growing | NetFlow explicitly per-period differential (its header); no accumulated-stock chart | Kafka lag panels; Connect queue boards; ticket backlogs | ≥72×18; ≤2.2 kB |
| 6 | **SpreadBand** | line | which of two series leads, by how much, since when | DualSparkline (no gap ink); NetFlow (flows); ABStrips (distributions) | trade-balance/band charts (FT/Economist); price-vs-benchmark; latency-vs-SLA | ≥64×16; ≤2.4 kB |
| 7 | **BiasStrip** | dot | systematic bias between two paired measurements | CalibrationStrip (probability); MicroScatter (generic); DataDiff (counts) | Bland & Altman, Lancet 1986 (frontier class) | ≥90×24; ≤2.4 kB; dots capped ~40 |
| 8 | **PercentileTrace** | line | one entity's standing drifting inside a population | BumpStrip (≤8 named ranks); sparkline band (static); BenchmarkStrip (one moment) | pediatric growth percentiles; fleet-percentile SRE panels | ≥72×18; ≤2.4 kB |

Prop sketches, encodings, and data shapes per proposal are on the artifact board; all conform to plan/04 + §8 contract (Value[], readonly domains, standard grammar, annotations as children).

## Rejected this round (log — prevents re-litigation, plan/15 cut-ledger style)

- **ShapeCheck (Q–Q micro)** — fails read-back without training.
- **DirectionRose** — PolarClock `variant` experiment, not a type (MountainRidges precedent).
- **Mix-shift ribbons** — QuipuCord/Ripple legibility class at ≤60 px; Slope + ConfusionGrid-recipe cover the stories.
- **TransitionGrid (general N×M)** — ConfusionGrid geometry with different labels → docs recipe.
- **RaceSplitBars** — MiniBar + deviation-coloring convention.
- **Runway/depletion** — EtaBar already is this (observed-rate remainder).
- **Warming stripes / spend-pace / swing needle** — HeatStrip / BurnChart-generalized-plan / BalanceBeam.

## Notes

- Count implication: 98 → 106 if all accepted (the "standardize on 98" checkpoint-1 decision predates this round; accepting any subset means resweeping public counts — they're computed from the registry, so it's automatic).
- Each accepted chart goes through the full DoD + FAMILY-BRIEF pipeline (geometry/static/client/tests/vspec/bench scenario+floor/page/registry) — nothing ships below the wave standard.
- Disagreement recorded: one research agent argued StreakSpark is a Progress+Marker composition; overruled because run TEXTURE (break frequency) is the encoding's second read and compositions can't express it. If the human reviewer sides with the composition view, drop to 7.
