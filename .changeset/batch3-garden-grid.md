---
"@microcharts/react": minor
---

Batch 3 (expressive) — `GardenGrid` (`./garden-grid`), static + `/interactive` entries:

- `GardenGrid` — ActivityGrid's grayscale sibling: it encodes a calendar-shaped
  activity rhythm as quantized dot **area** (single ink) instead of color, so it
  survives print and monochrome. The radius is √-quantized (`r = rMax·√(k/S)`) so
  perceived area steps evenly — a linear radius map would exaggerate the highs
  quadratically. A zero cell is a hairline **ring** (present, quiet); a `null` cell is
  nothing (missing ≠ zero). `rows` (default 7; `1` = strip), `steps={3|5}`,
  `empty="ring"|"blank"`. The interactive entry walks the grid in 2-D with the arrow
  keys (or hover), announcing each cell's ordinal **step** — "3 of 12: 8, step 2 of
  5." — never a false-precise value.

New `EN_GARDEN` summary module (`gardenGrid`, `gardenCell`). Node budget 1 per cell
(cap 400, dev-warned).
