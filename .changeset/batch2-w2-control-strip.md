---
"@microcharts/react": minor
---

Batch 2 wave 2 — `ControlStrip` (`./control-strip`), static + `/interactive` entries:

- `ControlStrip` — a Shewhart individuals control chart: the band is center ± 3σ̂
  where **σ̂ = mean moving range ÷ 1.128** (the individuals estimator, stated —
  sample SD is not used, it inflates limits under drift). In-control points are bare
  vertices; only out-of-control points are marked (ringed, negative). `limits="sigma"
  | "percentile"` (empirical p0.135/p99.865 for skew), `baseline` for a golden-period
  center, `rules="we"` for the enumerated Western Electric subset (WE-1/2/4, no rule
  fires silently), `dots="all"` for sparse series. Fewer than 10 points → dashed band
  + "limits provisional"; zero moving range → band collapses to the center hairline.

New `EN_CONTROL` summary module (`control`, `controlInControl`, `controlProvisional`,
`controlAt`).
