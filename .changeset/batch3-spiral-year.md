---
"@microcharts/react": minor
---

Batch 3 (expressive) — `SpiralYear` (`./spiral-year`), static + `/interactive` entries:

- `SpiralYear` — how did the year breathe? A calendar series wound onto an Archimedean
  spiral: angle = position in the year (Jan at 12 o'clock, clockwise), each turn outward =
  the next year. The value is a 5-step (or 3-step) opacity — an ordinal channel — so this
  is a PATTERN instrument, and the docs steer exact reads to `ActivityGrid`/`HeatStrip`.
  `cadence` (day/week, inferred from length), `startDate` (anchors index 0 to a calendar
  angle), `steps={3|5}`, `monthTicks` (12 faint radial ticks, default on), `mark="dot"|"arc"`.
- **Honesty** — the spiral RADIUS encodes time only, never value; an outer mark is a later
  date, not a bigger number. Opacity is 5-step-quantized and ordinal. A `null` leaves a gap
  in the spiral (missing ≠ a step-one mark). Marks are grouped by opacity step into ≤ `steps`
  merged `<path>` nodes, so the node count is O(steps), not O(days).
- The interactive entry finds the nearest mark by 2-D distance, arrows along the spiral
  chronologically, and announces each period and value through a polite live region with a
  matching hover readout.

New `EN_SPIRAL_YEAR` summary module (`spiralYear` / `spiralYearAt`). Built on `core/arc`
(arc marks) + `core/calendar-grid` (`dayOfYear`, `monthStartDays`). Node budget ≤ 7.
