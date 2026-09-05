---
"@microcharts/react": patch
---

Interactive entries now resolve the same box as the static twin they compose. Four entries laid their overlay or pointer
map against a box the static never used: `Sparkline` skipped the `chartSide` clamp, so a `width={NaN}` off a collapsed
container ringed a coordinate that was not on the line; `NetFlow` withheld `labelSize` from the label rule, and
`ErrorBudget` skipped the seat test that drops the label gutter, so both mapped the pointer over a width wider than the
one they rendered and the crosshair ran ahead of the cursor; `Waveform` dropped `locale` from the sample-count
formatter, so the accessible name announced the tally in the runtime's locale rather than the caller's.
