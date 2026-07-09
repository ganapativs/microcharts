---
"@microcharts/react": minor
---

Batch 2 wave 3 — `ChangePoint` (`./change-point`), static + `/interactive` entries:

- `ChangePoint` — when did the behavior change level? Regime shading (neutral
  identity, not valence) + per-regime mean hairlines + the series line + a break
  marker, so a spike is read against the regime it broke. The detector is a
  **documented heuristic, not statistics**: a two-segment mean-shift via binary
  segmentation, accepted only when the split cuts the pooled sum-of-squares by
  more than `BREAK_SS_RATIO` (0.2) **and** the mean gap clears `BREAK_EFFECT_SIZE`
  (0.8) × the pooled SD — both are named exports, property-tested (no break on
  constant / low-noise series, exact index on a clean step, never more than
  `max`). `breaks` (`"auto"` or explicit indices — the recommended production
  path, detection off), `max` (1–3), `means`, `label="delta"`. Gradual ramps are
  honestly found to have no level shift (named limitation → Sparkline). The
  interactive entry steps points with ←/→ (value + regime) and cycles breaks with
  Tab (each announcing the mean shift).

New `EN_CHANGE_POINT` summary module (`changePoint`, `changePointNone`,
`changePointAt`, `changePointBreak`).
