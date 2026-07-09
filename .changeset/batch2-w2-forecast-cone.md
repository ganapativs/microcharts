---
"@microcharts/react": minor
---

Batch 2 wave 2 — `ForecastCone` (`./forecast-cone`), static + `/interactive` entries:

- `ForecastCone` — history as a solid line, then a fan of prediction bands (p80
  outer, p50 inner) widening over the horizon with a **dashed** median. The fan's
  entire honesty is visible confidence decay, so three rules are enforced, not
  offered as options: at most 2 bands (a 95% band reads as false tail confidence at
  micro scale), the median is always dashed (an estimate never renders as fact), and
  a cone that fails to widen is flagged (`widening: false`), never auto-inflated. An
  optional `target` line adds a clearance clause (clears / straddles / misses).
  Reversed `[hi, lo]` pairs are swapped; empty history renders a cone-only cell.

New `EN_FORECAST` summary module (`forecast`, `forecastClearance`, `forecastAtHistory`,
`forecastAtForecast`). The interactive entry is region-aware (history value vs forecast
median + interval). The `softEdge`/`curve` cosmetic variants are deferred (plan/12).
