---
"@microcharts/react": minor
---

Batch 2 wave 2 — `BurnChart` (`./burn-chart`), static + `/interactive` entries:

- `BurnChart` — a dashed **plan** line (full length to the deadline), the solid
  **actual** line to today, a today tick, and a **dotted projection** whose slope
  is a linear fit over the last `max(2, ⌈today/3⌉)` actual points — provisional by
  construction, never a smoothed or optimistic curve. `label="gap"` states the
  signed schedule landing vs the deadline (e.g. `+2 d`), colored by valence with
  the sign in text. `mode="down" | "up"`, `projection={false}` for retrospectives.
  A flattened recent burn never reaches zero: no landing, and the summary says
  "not finishing at the current pace" outright.

New `EN_BURN` summary module (`burn`, `burnNoPlan`, `burnLanding`, `burnFlatlined`,
`burnAt`, `burnAtProjected`, `burnRemain`/`burnDone`).
