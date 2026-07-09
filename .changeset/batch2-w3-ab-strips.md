---
"@microcharts/react": minor
---

Batch 2 wave 3 — `ABStrips` (`./ab-strips`), static + `/interactive` entries:

- `ABStrips` — two graded quantile strips on ONE shared scale (p5–95 outer, p25–75
  inner middle half, median dot; row A muted, row B accent). The visible overlap of
  the middle halves is the answer, and the overlap number is always in the summary —
  an average delta without its spread is how A/B results lie. Never a bare mean bar;
  the delta label never appears without the strips behind it. `labels`, `positive`
  (colors the delta's valence, sign always in text), `label="delta" | "none"`.
  Identical arms → "no clear difference"; disjoint → "clearly separated"; an arm with
  n < 8 falls back to a min–max band. The interactive entry roves rows (↑/↓) and
  quantile edges (←/→).

New `EN_AB` summary module (`ab`, `abSeparated`, `abNoDiff`, `abRow`, `abEdge`).
