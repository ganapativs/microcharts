---
"@microcharts/react": minor
---

Batch 2 wave 3 — `ParetoStrip` (`./pareto-strip`), static + `/interactive` entries:

- `ParetoStrip` — descending bars + a cumulative-share line on a **fixed 0–100%
  scale** that spans the full height and is never rescaled to steepen the curve.
  Bars up to the threshold crossing are accent (the vital few); the rest are muted
  — the chart's one job is to say where to stop reading. `threshold` (default 80,
  a working reference not a law; `false` turns it off), `max` (categories beyond it
  roll up into `Other`, always rendered last and never re-ranked). Negatives are
  excluded (a composition can't be negative); zero total → "No recorded <metric>".
  The interactive entry steps the bars (share + cumulative) and **T** jumps to the
  crossing.

New `EN_PARETO` summary module (`pareto`, `paretoTop`, `paretoEmpty`, `paretoAt`).
