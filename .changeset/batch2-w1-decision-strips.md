---
"@microcharts/react": minor
---

Batch 2 wave 1 — five decision micrographs, each with a static RSC-safe entry and an
interactive `/interactive` entry:

- `CoverageStrip` (`./coverage-strip`) — presence/absence on a time strip; `null` (no
  measurement) is hollow, `0` (a measured zero) is filled, so absence never masquerades
  as zero. `expected` makes trailing missingness count; `mode="intensity"` shades measured
  cells; `label="percent"`.
- `BenchmarkStrip` (`./benchmark-strip`) — a focal dot against the peers' empirical
  quantile bands; the stated percentile uses a mid-rank rule; small samples fall back to
  min–max. `range`, `median`, `label`, `positive`.
- `PercentileLadder` (`./percentile-ladder`) — p50/p90/p99 as graduated ticks on a
  zero-anchored track; `scale="log"` renders an in-chart `log` tag (never silent);
  `ps`, `label`, `dots`.
- `GradedBand` (`./graded-band`) — nested central intervals graded by opacity, never a bar
  from zero; `levels` (1–3), `value` dot, `softEdge`, `label="median"`.
- `IconArray` (`./icon-array`) — one rate made countable in a fixed N-unit grid with the
  denominator visible; no partial-unit fills (sub-unit rates are flagged); `of` (10/20/100),
  `label`, `shape`, `positive`.

Also: new per-family summary-string modules `EN_COVERAGE`, `EN_QUANTILE`, `EN_FREQ` (each
chart bundles only its own templates) and the corresponding `SummaryStrings` keys.
