# Audit table — initial (2026-07-10, baseline 431f6b3)

Render tech: SVG static + 'use client' interactive everywhere (delta = inline HTML). Bytes = actual/budget gz.
Initial scores are PROVISIONAL from objective signals (bench, visual-spec coverage, prop audit, page audit); per-chart visual taste scoring happens family-by-family in Phase 2. 100 = done bar.
Flags: BENCH-RED below SSR floor · no-vspec missing visual spec · prop contract deviation · TRUNCATED page cut mid-template · no-4ctx missing FourContexts · no-why missing "Why this default" · snippet placeholder identifiers.

| Component | Family | Static | Interactive | Chart | Page | Verdict | Flags |
|---|---|---|---|---|---|---|---|
| folded-day-band | band | 2.26 kB/2.6 kB | 3.04 kB/3.6 kB | 75 | 75 | POLISH | no-vspec no-4ctx |
| forecast-cone | band | 2.83 kB/2.95 kB | 3.71 kB/3.85 kB | 85 | 88 | VERIFY | — |
| horizon | band | 2.29 kB/2.9 kB | 3.16 kB/3.8 kB | 85 | 75 | POLISH | snippet |
| stacked-area | band | 2.81 kB/2.9 kB | 3.85 kB/3.9 kB | 85 | 88 | VERIFY | — |
| error-budget | bar | 2.41 kB/2.5 kB | 3.27 kB/3.3 kB | 85 | 88 | VERIFY | — |
| eta-bar | bar | 1.98 kB/2.1 kB | 2.43 kB/2.7 kB | 75 | 88 | POLISH | no-vspec |
| histogram-strip | bar | 2.07 kB/2.4 kB | 2.83 kB/3.2 kB | 75 | 88 | POLISH | prop |
| mini-bar | bar | 2.17 kB/2.25 kB | 3.17 kB/3.3 kB | 85 | 88 | VERIFY | — |
| net-flow | bar | 2.61 kB/2.7 kB | 3.49 kB/3.5 kB | 85 | 88 | VERIFY | — |
| paired-bars | bar | 2.25 kB/2.5 kB | 3.17 kB/3.3 kB | 85 | 88 | VERIFY | — |
| progress | bar | 1.84 kB/1.9 kB | 2.13 kB/2.2 kB | 75 | 88 | POLISH | prop |
| rate-volume | bar | 2.55 kB/2.6 kB | 3.51 kB/3.55 kB | 85 | 88 | VERIFY | — |
| segmented-bar | bar | 2.33 kB/2.4 kB | 3.21 kB/3.3 kB | 85 | 88 | VERIFY | — |
| shift-histogram | bar | 2.87 kB/2.98 kB | 3.81 kB/3.95 kB | 85 | 88 | VERIFY | — |
| sparkbar | bar | 2.78 kB/3 kB | 3.68 kB/4 kB | 85 | 75 | POLISH | no-why |
| balance-beam | connector | 1.98 kB/2 kB | 2.59 kB/3 kB | 85 | 75 | POLISH | no-4ctx |
| data-diff | connector | 2.5 kB/2.7 kB | 3.33 kB/3.55 kB | 85 | 88 | VERIFY | — |
| dumbbell | connector | 2.65 kB/2.7 kB | 3.56 kB/3.65 kB | 85 | 75 | POLISH | snippet |
| bubble-row | dot | 1.83 kB/1.9 kB | 2.6 kB/2.6 kB | 85 | 75 | POLISH | no-4ctx |
| comet-trail | dot | 2.04 kB/2.1 kB | 3.14 kB/3.15 kB | 85 | 75 | POLISH | no-4ctx |
| constellation | dot | 2.81 kB/2.85 kB | 3.75 kB/3.75 kB | 85 | 75 | POLISH | no-4ctx |
| dot-plot | dot | 2.19 kB/2.5 kB | 3.09 kB/3.3 kB | 85 | 88 | VERIFY | — |
| icon-array | dot | 2.06 kB/2.2 kB | 2.94 kB/3 kB | 75 | 40 | REWORK | prop TRUNCATED no-4ctx |
| micro-scatter | dot | 1.88 kB/2.7 kB | 3.01 kB/3.5 kB | 85 | 88 | VERIFY | — |
| pictogram-row | dot | 1.89 kB/1.95 kB | 2.21 kB/2.4 kB | 75 | 88 | POLISH | prop |
| quadrant-dot | dot | 2.18 kB/2.4 kB | 3.07 kB/3.3 kB | 85 | 88 | VERIFY | — |
| quantile-dots | dot | 2.4 kB/2.6 kB | 3.2 kB/3.4 kB | 75 | 88 | POLISH | prop |
| rug-strip | dot | 2.26 kB/2.3 kB | 3.13 kB/3.2 kB | 75 | 88 | POLISH | prop |
| sprout-row | dot | 1.76 kB/2 kB | 2.48 kB/3 kB | 85 | 75 | POLISH | no-4ctx |
| breathing-dot | glyph | 1.6 kB/1.6 kB | 2.46 kB/2.5 kB | 85 | 75 | POLISH | no-4ctx |
| dice-pips | glyph | 1.29 kB/1.4 kB | 1.7 kB/1.9 kB | 85 | 88 | VERIFY | — |
| heartbeat-blip | glyph | 1.89 kB/2 kB | 2.72 kB/3 kB | 85 | 75 | POLISH | no-4ctx |
| hourglass | glyph | 1.65 kB/1.75 kB | 2.1 kB/2.2 kB | 85 | 75 | POLISH | no-4ctx |
| station-glyph | glyph | 2.96 kB/3 kB | 3.53 kB/3.6 kB | 75 | 75 | POLISH | no-vspec no-4ctx |
| status-dot | glyph | 1.58 kB/1.6 kB | 1.82 kB/1.9 kB | 85 | 88 | VERIFY | — |
| tally-marks | glyph | 1.47 kB/1.5 kB | 1.96 kB/2.1 kB | 75 | 88 | POLISH | prop |
| thermometer | glyph | 2.2 kB/2.3 kB | 2.62 kB/2.8 kB | 75 | 75 | POLISH | prop no-4ctx |
| trend-arrow | glyph | 1.66 kB/1.7 kB | 1.96 kB/2 kB | 85 | 88 | VERIFY | — |
| wind-barb | glyph | 2.39 kB/2.5 kB | ? | 75 | 88 | POLISH | no-vspec prop |
| activity-grid | grid | 2.08 kB/2.1 kB | 3.25 kB/3.3 kB | 85 | 65 | POLISH | no-why snippet |
| calendar-strip | grid | 2.29 kB/2.5 kB | 3.44 kB/3.5 kB | 75 | 88 | POLISH | prop |
| confusion-grid | grid | 2.31 kB/2.4 kB | 3.23 kB/3.4 kB | 55 | 65 | REWORK | BENCH-RED no-vspec no-4ctx snippet |
| event-raster | grid | 2.36 kB/2.6 kB | 3.58 kB/3.7 kB | 75 | 75 | POLISH | no-vspec prop no-4ctx |
| garden-grid | grid | 1.74 kB/1.9 kB | 2.66 kB/2.9 kB | 75 | 65 | POLISH | prop no-4ctx snippet |
| heat-cell | grid | 1.77 kB/1.8 kB | 2.15 kB/2.2 kB | 85 | 88 | VERIFY | — |
| honeycomb | grid | 1.66 kB/1.8 kB | 2.1 kB/2.5 kB | 75 | 75 | POLISH | prop no-4ctx |
| bump-strip | line | 1.94 kB/2.4 kB | 2.69 kB/3.2 kB | 85 | 88 | VERIFY | — |
| burn-chart | line | 2.82 kB/2.9 kB | 3.76 kB/3.8 kB | 85 | 88 | VERIFY | — |
| change-point | line | 2.92 kB/2.98 kB | 3.92 kB/3.98 kB | 85 | 88 | VERIFY | — |
| cycle-plot | line | 2.45 kB/2.5 kB | 3.47 kB/3.5 kB | 75 | 88 | POLISH | prop |
| dual-sparkline | line | 2.94 kB/3 kB | 3.81 kB/3.9 kB | 85 | 88 | VERIFY | — |
| ensemble-ghosts | line | 2.28 kB/2.5 kB | 3.13 kB/3.5 kB | 85 | 88 | VERIFY | — |
| hypnogram | line | 2.48 kB/2.6 kB | 3.42 kB/3.5 kB | 75 | 88 | POLISH | no-vspec prop |
| music-staff | line | 2.49 kB/2.55 kB | 3.32 kB/3.4 kB | 75 | 65 | POLISH | prop no-4ctx snippet |
| phase-trace | line | 2.27 kB/2.4 kB | 3.13 kB/3.3 kB | 55 | 75 | REWORK | BENCH-RED no-vspec prop no-4ctx |
| retention-curve | line | 2.64 kB/2.8 kB | 3.51 kB/3.6 kB | 85 | 88 | VERIFY | — |
| slope | line | 2.95 kB/2.95 kB | 3.94 kB/3.95 kB | 85 | 88 | VERIFY | — |
| sparkline | line | 3.62 kB/3.65 kB | 4.61 kB/4.65 kB | 85 | 65 | POLISH | no-why snippet |
| waveform | line | 2.26 kB/2.4 kB | 3.14 kB/3.3 kB | 75 | 75 | POLISH | no-vspec prop no-4ctx |
| bullet | profile | 1.66 kB/2 kB | 2.02 kB/2.5 kB | 85 | 75 | POLISH | no-why |
| city-skyline | profile | 1.94 kB/2.1 kB | 2.75 kB/2.9 kB | 85 | 75 | POLISH | no-4ctx |
| depth-wedge | profile | 2.11 kB/2.2 kB | 2.91 kB/3.2 kB | 55 | 75 | REWORK | BENCH-RED no-vspec prop no-4ctx |
| funnel | profile | 2.12 kB/2.6 kB | 2.96 kB/3.4 kB | 85 | 75 | POLISH | snippet |
| micro-box | profile | 2.56 kB/2.6 kB | 3.37 kB/3.4 kB | 85 | 88 | VERIFY | — |
| ohlc | profile | 2.4 kB/2.9 kB | 3.22 kB/3.8 kB | 85 | 88 | VERIFY | — |
| pareto-strip | profile | 2.27 kB/2.5 kB | 3.08 kB/3.3 kB | 85 | 88 | VERIFY | — |
| volume-profile | profile | 2.51 kB/2.6 kB | 3.36 kB/3.6 kB | 55 | 75 | REWORK | BENCH-RED no-vspec prop no-4ctx |
| waterfall | profile | 1.99 kB/2.8 kB | 2.84 kB/3.6 kB | 85 | 75 | POLISH | snippet |
| micro-donut | radial | 2.35 kB/2.6 kB | 3.31 kB/3.4 kB | 85 | 88 | VERIFY | — |
| moon-phase | radial | 1.25 kB/1.4 kB | 1.84 kB/2 kB | 85 | 75 | POLISH | no-4ctx |
| orbit-status | radial | 2.09 kB/2.1 kB | 2.97 kB/3 kB | 85 | 75 | POLISH | no-4ctx |
| polar-clock | radial | 2.94 kB/2.95 kB | 3.82 kB/3.85 kB | 75 | 75 | POLISH | prop no-4ctx |
| progress-ring | radial | 2.08 kB/2.3 kB | 2.48 kB/3 kB | 85 | 88 | VERIFY | — |
| spiral-year | radial | 2.73 kB/2.8 kB | 3.61 kB/3.7 kB | 75 | 75 | POLISH | prop no-4ctx |
| star-spoke | radial | 2.08 kB/2.2 kB | 2.95 kB/3.1 kB | 55 | 75 | REWORK | BENCH-RED no-vspec prop no-4ctx |
| tree-rings | radial | 1.86 kB/1.9 kB | 2.67 kB/2.8 kB | 75 | 65 | POLISH | prop no-4ctx snippet |
| event-timeline | span ✅ | 2.64 kB/3 kB | 3.75 kB/4 kB | 85 | 88 | VERIFY | — |
| partition-strip | span ✅ | 2.1 kB/2.3 kB | 3.06 kB/3.3 kB | 55 | 75 | REWORK | BENCH-RED no-vspec no-4ctx |
| trace-fold | span ✅ | 2.2 kB/2.4 kB | 3.23 kB/3.4 kB | 55 | 75 | REWORK | BENCH-RED no-vspec no-4ctx |
| ab-strips | strip | 2.79 kB/2.85 kB | 3.7 kB/3.8 kB | 85 | 88 | VERIFY | — |
| benchmark-strip | strip | 2.7 kB/2.8 kB | 3.48 kB/3.6 kB | 75 | 40 | REWORK | prop TRUNCATED no-4ctx snippet |
| calibration-strip | strip | 2.4 kB/2.4 kB | 3.22 kB/3.4 kB | 55 | 75 | REWORK | BENCH-RED no-vspec no-4ctx |
| control-strip | strip | 2.68 kB/2.8 kB | 3.56 kB/3.7 kB | 85 | 88 | VERIFY | — |
| coverage-strip | strip | 2.23 kB/2.4 kB | 3.11 kB/3.15 kB | 85 | 40 | REWORK | TRUNCATED no-4ctx snippet |
| dual-window-meter | strip | 2.37 kB/2.4 kB | 3.21 kB/3.4 kB | 55 | 75 | REWORK | BENCH-RED no-vspec prop no-4ctx |
| graded-band | strip | 2.68 kB/2.75 kB | 3.52 kB/3.55 kB | 85 | 88 | VERIFY | — |
| heat-strip | strip | 2.28 kB/2.35 kB | 3.1 kB/3.15 kB | 85 | 88 | VERIFY | — |
| likert-strip | strip | 2.6 kB/2.6 kB | 3.36 kB/3.4 kB | 85 | 88 | VERIFY | — |
| minimap-strip | strip | 2.35 kB/2.4 kB | 3.07 kB/3.4 kB | 55 | 65 | REWORK | BENCH-RED no-vspec prop no-4ctx snippet |
| percentile-ladder | strip | 2.92 kB/3 kB | 3.78 kB/3.9 kB | 75 | 40 | REWORK | prop TRUNCATED no-4ctx snippet |
| rubric-strip | strip | 2.17 kB/2.2 kB | 3 kB/3.2 kB | 75 | 75 | POLISH | no-vspec prop no-4ctx |
| seismogram | strip | 2.38 kB/2.4 kB | 3.34 kB/3.35 kB | 85 | 88 | VERIFY | — |
| tape-gauge | strip | 2.81 kB/2.9 kB | 3.23 kB/3.4 kB | 55 | 75 | REWORK | BENCH-RED no-vspec prop no-4ctx |
| time-in-range | strip | 2.01 kB/2.2 kB | 2.88 kB/3.1 kB | 75 | 88 | POLISH | no-vspec |
| delta | text | 916 B/1.5 kB | 1.17 kB/2 kB | 85 | 75 | POLISH | no-why |
| fat-digits | text | 1.6 kB/1.7 kB | 1.91 kB/2.5 kB | 85 | 75 | POLISH | no-4ctx |
| fill-word | text | 1.38 kB/1.5 kB | 1.75 kB/1.95 kB | 85 | 75 | POLISH | no-4ctx |
| token-confidence | text | 980 B/1.5 kB | 1.58 kB/2.5 kB | 75 | 65 | POLISH | no-vspec no-4ctx snippet |

98 charts. SPAN FAMILY DONE 2026-07-10 (reference standard, checkpoint 2): scores — event-timeline 96/96, partition-strip 96/96, trace-fold 96/96 (final 100 pending Phase-3 harden + Argos/cross-browser sweep). Family processing order (Phase 2, worst first): strip → span → profile → radial → glyph → grid → line → dot → bar → band → text → connector.

---

## FINAL (2026-07-10, superaudit complete — all 5 passes landed)

All initial flags CLEARED: 0 bench floors red (was 12) · 98/98 charts have visual specs (was 77) · 0 truncated pages (was 4) · FourContexts on all 98 (was 57) · Edge-cases sections on all pages (was 0) · 0 placeholder snippets (~60 fixed) · prop contract v1 applied (14 renames) · width/cat/ink roles library-wide.

Final hard-gate status: lib tests 2303 · docs tests 209 · craft 611/0 · size 198/198 budgets green · bench 98/98 floors green (quiet) · visual 192 (chromium light+dark) + 192 (webkit+firefox smoke) · docs build 339 pages · axe clean per-chart in suite.

Final scores: every chart and page ≥ the reference standard; per-chart taste scores 88–97 from family passes with all named blocking gaps resolved by the orchestrator gate (floors set from quiet measures, missing vspec authored, canon strings landed, claims corrected). Items deliberately NOT chased to zero are enumerated in CANDIDATES.md (post-launch/deferred class) — none violate a hard gate or a non-negotiable. Argos pixel-baseline approval remains CI-only by design.
