---
"@microcharts/react": minor
---

A value of exactly `0` now paints no ink. `SparkBar` floored every finite bar at 0.5 viewBox units, so a series with
real zeros — a 12-month count where most months are zero — drew a row of sub-pixel hairlines that read as a dot-leader
at word size and claimed "small nonzero" about exact zeros. Bar length encodes magnitude, and zero magnitude is zero
length: the slot keeps its place on the pitch and stays empty. The 0.5 floor still applies to every nonzero value, so a
count too small to resolve keeps its minimum mark rather than vanishing.

This brings `SparkBar` in line with `MiniBar`, `PairedBars` and `Funnel`, which already exempted zero from their floors.
`Waveform` had the same defect in a different place: its `bars` carried an honest `height: 0` for a silent bucket while
the emitted path floored it to a 0.4-unit tick, so silence read as a dotted rule. Silence now contributes no subpath,
which also shortens `d` on sparse audio.

Zero and no-data stay distinct where it counts. A `null` still occupies no slot, the generated summary counts a zero in
the range and skips a gap, and the interactive readout reads a zero as `0` where it reads a gap as "no data" — so hosts
no longer have to pass `null` for a known zero to get a readable chart. In `winloss` mode a `0` is still a tie and keeps
its dash on the mid-line, because there the sign is a state rather than a magnitude.

`SparkBar`'s bar-mode plot floor sitting flush with the viewBox bottom is now documented and pinned by a test. It has
always been deliberate — the zero bottom padding is what stands the bars on the text baseline inline — but nothing
asserted it, and hosts drawing their own rule need to know it lands on the bar feet.
