---
"@microcharts/react": minor
---

Interactive charts now forward `className` and `style` to their wrapper and size the inner SVG from one shared `FILL`
constant, so the SVG always fills the interactive `<span>` — hover math, crosshairs, and focus rings stay locked to the
cursor instead of drifting when the chart is scaled by a consumer. Passing `style` merges (it no longer clobbers the
wrapper's `display`/`position`/`line-height`), and `className` composes with the chart's own class. No change at rest —
static output is byte-identical.

Formatters are also hardened against IEEE float noise: `makeFormatter` snaps its input to 12 significant digits before
handing it to `Intl` or a custom `format` function, so internally-derived values (`value - target` →
`-3.5999999999999943`) render clean without touching real precision.
