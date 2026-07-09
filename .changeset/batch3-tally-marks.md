---
"@microcharts/react": minor
---

Batch 3 (expressive) — `TallyMarks` (`./tally-marks`), static + `/interactive` entries:

- `TallyMarks` — counts the way a human counts: four-and-strike clusters of five,
  then the remainder, all in ONE merged stroke path (node budget 2 with the overflow
  numeral). The count reads back exactly up to `max`; past it the marks stop growing
  and a `+N` numeral tells the truth, so a cell never blows out its width — marks are
  never resized to fit. `pen="ruled" | "drawn"` (seeded, SSR-stable jitter for the
  editorial voice — perturbs stroke rendering only, never the count) and
  `overflow="numeral" | "clamp"` (clamp drops the numeral; the accessible name still
  carries the true count). The interactive entry announces the new total through a
  polite region and draws newly added marks in with a brief, reduced-motion-gated
  stroke-dashoffset sweep; a count has no sub-parts, so focus reads the summary and
  there is no cursor to move.

New `EN_TALLY` summary module (`tally`). Naming note: the spec named the pen variant
`style`, but every chart already exposes `style?: CSSProperties`; the knob ships as
`pen` to keep that passthrough intact (recorded in plan/12).
