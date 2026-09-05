---
"@microcharts/react": patch
---

Eight charts painted a label outside the box that reserved room for it, or on top of another mark. `.mc-root` is
`overflow: visible`, so each of these lands in the page rather than clipping.

`FillWord` sized its viewBox from the 0.62 em/char digits estimate while the word renders at its natural width —
`SNOWPACK` ran 4 units onto the sentence beside it, and the caps-aware extent the chart already computes now sets the
box. `StarSpoke` measured caller-supplied metric names on the same digits rate instead of the published prose bound.
`IconArray` reserved five characters for its percent label, which is `"100%"` — a `format` asking for fractional digits
ran past the edge; the reserve is now measured off the caller's own formatter. `WindBarb` painted a label taller than
its box when `labelSize` raised the floor above it, where the prop's contract (and its sibling `TrendArrow`) says the
label drops. `Dumbbell` bounded the from-value against the viewBox origin rather than the row-name gutter, so a `from`
on the domain minimum overprinted the row name. `SproutRow` grew its plants through the stage numeral's own line.
`BalanceBeam` gated its numerals on the box width alone, so a tilted beam stacked them on each other. `BreathingDot` cut
its reserved gutter for a four-character `"100%"`, so in locales that write `"100 %"` the line resized when the feed
dropped out.
