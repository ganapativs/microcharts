---
"@microcharts/react": patch
---

`<TimeInRange orientation="vertical" label="all">` no longer stacks adjacent small zones' percent labels on top of each
other.

In vertical mode the along-strip (Y) fit gate was `labelFitsY(cy, fontSize, height)`, which bounds the label's em-box
against the full viewBox `height`. Two adjacent short zones whose centres sit mid-box both clear that gate, so both
labels paint with their centres only `(h1 + h2) / 2 + g` apart — far less than the font size — and stack on each other.
The chart now gates the vertical along-strip axis with `labelFitsBand(z.height, fontSize)` instead, the per-zone band
check the library already uses elsewhere: a band shorter than the font DROPS its label, so two adjacent short mid-box
zones no longer print on top of each other — the same degradation horizontal already gets from the cross-strip `span`
gate along its own X axis. Cross-strip X containment is unchanged; a band that fits still seats its label inside the
viewBox as a corollary.
