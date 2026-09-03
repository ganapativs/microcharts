---
"@microcharts/react": patch
---

`<TimeInRange orientation="vertical">` no longer paints its in-zone percent outside the SVG when the strip is thinner
than the label.

The fit gate measures the label's horizontal glyph extent, and the `<text>` is unrotated in both orientations — so that
extent always runs along the SVG X axis. In vertical mode the gate compared it against `z.height` (the along-strip
length) instead of `z.width` (the cross-strip thickness), so a thin vertical strip still painted a label wider than
itself and it escaped the viewBox on both X edges. The gate now bounds the glyph extent against `z.width` regardless of
orientation; a label the strip can no longer seat drops rather than spilling, the same degradation the horizontal mode
already had.
