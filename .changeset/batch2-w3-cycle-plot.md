---
"@microcharts/react": minor
---

Batch 2 wave 3 — `CyclePlot` (`./cycle-plot`), static + `/interactive` entries:

- `CyclePlot` — a cycle plot (seasonal-subseries chart): what repeats beneath the
  trend, and is any slot drifting? The series is reshaped row-major into `period`
  slots; each slot shows its own raw values across cycles as a muted polyline **in
  time order** (never smoothed, never joined across a slot boundary) plus a
  mean/median tick, and the accent spine connects the slot centers — seasonality
  and drift kept as separate reads. `period` (4–12, required), `slots` (names for
  summaries), `center` (`"mean"`/`"median"`), `trend` (`"line"`/`"none"`), `spine`
  (off for drift-only), `cycleUnit`. Ragged final cycles and per-slot counts are
  carried honestly; `period ≥ length` drops to a spine-only read; nulls are
  excluded from a slot, never interpolated. The interactive entry steps slots with
  ←/→ (mean, cycle count, drift) and individual observations with ↑/↓.

New `EN_CYCLE` summary module (`cycle`, `cycleNoDrift`, `cycleAt`, `cyclePoint`).
