---
"@microcharts/react": patch
---

Internal: the inline seat now reads the plot box from geometry everywhere, instead of components spelling the padding
out again as a literal. No rendered output changes — every seat resolves to the number it already resolved to — but the
two copies can no longer drift apart.

`CitySkyline` was the worst case: both entries computed the ground line themselves, and the interactive one used `2`
where the static one used `PAD`, so moving the pad would have shifted the buildings and left the focus rings behind.
That band is now one exported function both entries call. `BurnChart`, `CyclePlot` and `QuantileDots` re-derived
`height - geo.pad` for the seat and again for the value scale; they export `y0`/`y1` now. `SegmentedBar` and
`PartitionStrip` each carried their inset in two places. Nine charts spelled `height - 2` in their no-data branch,
duplicating a `pad = opts.pad ?? 2` default that lives in the geometry; that default is exported and shared now.

A source guard (`src/test/seat-source-of-truth.test.ts`) fails any `seat={{...}}` that insets the box with a bare
numeric literal, so the next one is caught in CI rather than by a consumer whose divider no longer lines up.
