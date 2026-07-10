# Baseline — 2026-07-10, commit 431f6b3 (main, clean)

## Hard-gate status at baseline
| Gate | Status | Detail |
|---|---|---|
| Tests | GREEN | 309 files, 2298 tests pass (`pnpm test`) |
| Craft matrix | GREEN | `pnpm craft`: 611 configs, 0 issues |
| Size budgets | GREEN | all subpaths within limits (`audit/baseline-size-table.txt`, 198 entries); styles.css 2.08 kB gz / 12 kB cap |
| Bench (SSR floor) | **RED — 12 charts below floor** | see below; full data `audit/baseline-bench-results.json` |
| Visual regression | **GAP** | 21 batch-4 (frontier) charts have NO visual spec in tests/visual/ (list below). Argos baselines exist for the rest. |
| Axe | GREEN (assumed via suite) | per-chart axe tests in unit suite; re-verify in Phase 3 |

## Bench below-floor charts (rows/ms vs floor)
trace-fold 3.3/15 (~6.6 kB/row!) · calibration-strip 3.3/15 · partition-strip 4.1/20 · minimap-strip 4.4/8 · confusion-grid 7.2/40 · dual-window-meter 10/30 · tape-gauge 11/20 · volume-profile 12.6/20 · star-spoke 20.3/60 · depth-wedge 29.3/40 · phase-trace 36.1/40 · (folded-day-band + station-glyph OK).
All are batch-4 frontier charts. SSR core scenario healthy: 500 sparkline rows → 5.7 ms (~0.011 ms/row).

## Missing visual specs (all batch-4)
calibration-strip, confusion-grid, depth-wedge, dual-window-meter, eta-bar, event-raster, folded-day-band, hypnogram, minimap-strip, partition-strip, phase-trace, rubric-strip, star-spoke, station-glyph, tape-gauge, time-in-range, token-confidence, trace-fold, volume-profile, waveform, wind-barb.
(activity-grid/bullet/delta/sparkbar are covered by catalog.spec.ts + annotations.spec.ts.)

## Triage implication
Batch 4 (frontier 21) shipped with weaker DoD compliance (bench floors red, no visual specs). It is the worst-scoring family cluster → process first in Phase 2 after foundation checkpoint.

## Artifacts
- `audit/baseline-size-full.txt` / `baseline-size-table.txt` — per-subpath gz sizes
- `audit/baseline-bench-results.json` — full bench numbers
- `audit/baseline-tests.txt`, `baseline-craft.txt`, `baseline-bench.txt`
- Argos baselines (CI) + `screenshots/{light,dark}` for visual reference
- Emil Kowalski skills installed at `.agents/skills/` (emil-design-eng, animation-vocabulary, review-animations, apple-design)
