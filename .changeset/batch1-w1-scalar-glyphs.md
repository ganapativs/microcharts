---
"@microcharts/react": minor
---

Batch 1 wave 1 — four scalar glyph charts, each with a static RSC-safe entry and an
interactive `/interactive` entry:

- `TrendArrow` (`./trend-arrow`) — direction glyph (arrow/triangle/chevron), `flatBand`
  noise floor, `showValue` gutter, `positive` polarity.
- `StatusDot` (`./status-dot`) — five paired shape+color states (ok/warn/error/off/busy),
  `pulse` halo, extensible `states` vocabulary.
- `HeatCell` (`./heat-cell`) — one calibrated color step (shared 5-step ramp), shared
  `shape` cell vocabulary, optional centered value label.
- `Progress` (`./progress`) — zero-anchored bar + direct percent label, `segments`
  stepped mode, honest >100% clamp (label carries the truth), burn-down wording.

Also: `EN` locale dictionary is now composed from per-shape modules (`EN_SERIES` +
`EN_SCALAR`) so each chart bundles only its own summary templates; new `ScalarStrings`
keys `scalarDir`, `flatChange`, `status`, `level`, `progress`, `remaining`, `stepsDone`.
