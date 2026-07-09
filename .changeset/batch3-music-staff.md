---
"@microcharts/react": minor
---

Batch 3 (expressive) — `MusicStaff` (`./music-staff`), static + `/interactive` entries:

- `MusicStaff` — the shape of a short series read as a melody: each value is a note,
  its **pitch** (vertical position on a five-line staff, quantized to line/space
  positions) is the value, and left-to-right is time. Pitch is the ONLY channel —
  no clefs, stems, beams, or bar lines (every other notation convention would be
  decoration). `range="ledger"` (default, ±2 ledger positions with hairline ticks) or
  `range="staff"` (clamp on-staff for dense cells); `label="last"` prints the final
  value. Two adjacent equal values are spaced along the time axis, never dodged
  vertically (that would change pitch = the data). The interactive entry steps notes
  with ←/→.

Reuses `describeSeries` verbatim for the accessible name (same S1 pipeline as
Sparkline — no new summary template). Static budget 2.32 kB (the describeSeries /
seriesStats machinery) — above the spec's 2 kB target, under the 3 kB hard cap; logged.
Node budget n + 2.
