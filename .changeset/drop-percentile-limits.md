---
"@microcharts/react": minor
---

**Breaking:** `<ControlStrip>` no longer accepts `limits`. The band is always ±3σ̂ estimated from the moving range, which
is what `limits="sigma"` (the default) already did.

`limits="percentile"` cut the band from the empirical p0.135/p99.865 of the same sample it then tested, and the R-7
estimator lands strictly inside the observed range — so the series minimum and maximum satisfied the out-of-control test
by construction, on any data whose extremes are not tied. On `[12, 14, 9, 16, 11, 13, 15, 10, 17, 8]` the band came out
`[8.01, 16.99]` and flagged both `17` and `8`; the ±3σ̂ default flags neither. The same `out` array drives the ringed
dots, the crosshair classification, the readout chip and the accessible summary, so every surface reported excursions
that were not there.

Correct percentile limits need a Phase I reference window the chart's data contract does not carry. Rather than ship a
band with near-zero specificity, the option is removed; drop the prop, and the chart renders as it did on the default. A
reference-window API can land later.
