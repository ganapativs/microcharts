---
"@microcharts/react": minor
---

Batch 3 (expressive) — `Honeycomb` (`./honeycomb`), static + `/interactive` entries:

- `Honeycomb` — how many of the available slots are taken, as filled cells in an
  area-filling hex grid. The unit is the cell, so the count is genuinely countable
  (total ≤ 60 — above that unit counting stops being countable and the chart steers
  to `Progress`; refusing is the feature). Pointy-top hexes, odd-row offset, near-
  square by default, filled row-major from the top-left so occupancy reads as a sweep.
  The whole grid is exactly **two `<path>` nodes** (filled + empty) regardless of total.
  `total` (capacity), `rows` (number or `auto`; `1` = strip), `empty="outline"|"dim"`.
  A value past the total fills every cell but the accessible name still states the true
  number — occupancy is never silently clipped. The interactive entry announces the
  count on change and reveals value/total on hover; cells are anonymous units, so there
  is no per-cell cursor.

New `EN_HONEYCOMB` summary module (`honeycomb`). Own hex math (`hexPath` +
axial→pixel), chart-local. Node budget 2.
