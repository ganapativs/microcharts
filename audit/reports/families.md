# Family clustering + catalog audit (agent report, 2026-07-10)

98 charts (src/charts dirs = registry modules = docs pages, 1:1 clean).

**RESOLVED count question:** plan/05 core "36" counts TYPES; rows 1–4 = Sparkline, Band sparkline, SparkBar, Win-loss = 4 types in 2 components (band/win-loss are prop variants). So 100 types = 98 components = 98 pages. Nothing unshipped. ACTION: reconcile `CATALOG_TARGET=100` in registry.ts + any "100 charts" copy so counts are honest and consistent (either count types w/ variant entries, or say 98 components everywhere).

## 12 families (sub-agent ownership units for Phase 2)
- **strip (15):** ab-strips, benchmark-strip, calibration-strip, control-strip, coverage-strip, dual-window-meter, graded-band, heat-strip, likert-strip, minimap-strip, percentile-ladder, rubric-strip, seismogram, tape-gauge, time-in-range
- **line (13):** bump-strip, burn-chart, change-point, cycle-plot, dual-sparkline, ensemble-ghosts, hypnogram, music-staff, phase-trace, retention-curve, slope, sparkline, waveform
- **bar (11):** error-budget, eta-bar, histogram-strip, mini-bar, net-flow, paired-bars, progress, rate-volume, segmented-bar, shift-histogram, sparkbar
- **dot (11):** bubble-row, comet-trail, constellation, dot-plot, icon-array, micro-scatter, pictogram-row, quadrant-dot, quantile-dots, rug-strip, sprout-row
- **glyph (10):** breathing-dot, dice-pips, heartbeat-blip, hourglass, station-glyph, status-dot, tally-marks, thermometer, trend-arrow, wind-barb
- **profile (9):** bullet, city-skyline, depth-wedge, funnel, micro-box, ohlc, pareto-strip, volume-profile, waterfall
- **radial (8):** micro-donut, moon-phase, orbit-status, polar-clock, progress-ring, spiral-year, star-spoke, tree-rings
- **grid (7):** activity-grid, calendar-strip, confusion-grid, event-raster, garden-grid, heat-cell, honeycomb
- **band (4):** folded-day-band, forecast-cone, horizon, stacked-area
- **text (4):** delta, fat-digits, fill-word, token-confidence
- **connector (3):** balance-beam, data-diff, dumbbell
- **span (3):** event-timeline, partition-strip, trace-fold

## Near-duplicate candidates (FLAG ONLY — approval at checkpoint; cut ledger plan/15 says don't resurrect/delete without evidence)
1. sparkline / dual-sparkline — dual arguably a prop variant.
2. progress / progress-ring / fill-word — 3 geometries, one "% complete" story.
3. heat-cell / heat-strip / activity-grid — intentional siblings (documented), still redundant read.
4. quantile-dots / icon-array — countable-dots vs icons.
5. breathing-dot / heartbeat-blip — both "is it alive" pulse glyphs.
6. control-strip / dual-window-meter / time-in-range — "inside acceptable band?" trio.
7. dumbbell / balance-beam — two-value connector comparison.
8. micro-donut / segmented-bar / partition-strip — part-to-whole trio.
9. dice-pips / tally-marks / pictogram-row — small-count glyph systems.
