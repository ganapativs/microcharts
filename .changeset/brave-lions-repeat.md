---
"@microcharts/react": minor
---

Labels you can size, marks too small to see, and a hook for a box that changes width.

**`labelSize` raises the label floor.** In-chart labels size themselves from the mark and floor at 7 viewBox units,
which is below the legibility floor of most design systems, and nothing let you lift it. The token that looked like the
lever was not one: 83 charts wrote their own computed size to `--mc-label-size` on their own host, so setting it on a
wrapper worked on charts with no labels and was silently overridden on the 79 that have them. Charts now pin
`--mc-label-px`, `--mc-label-size` is yours, and `labelSize` raises the floor through geometry — which is where the
label's gutter is reserved, so the reserved room moves with the type instead of being outgrown by it. A label the box
cannot seat at the raised floor drops rather than shrinking back under it, so a bigger number can mean fewer labels,
never smaller ones. On 79 of the 81 charts that paint text; FatDigits and FillWord are excluded, because there the text
is the mark and it is sized from the box.

**Sub-unit marks paint again.** Several charts floor a magnitude-encoding rect at 0.5 viewBox units so a small-but-real
value stays visible, and every one of those rects also carried `shapeRendering: crispEdges`. The hint snaps each edge to
the device pixel grid, and a word-sized chart renders at about one unit per pixel, so the floor and the hint cancelled:
measured in Chromium at 1u = 1px, a 30×0.5 rect painted **0.00 ink** with the hint and 7.09 without it.
`<SparkBar data={[1000, 4, 0]} />` drew the 4 and the 0 pixel-identically. Worse, below one unit survival depended on
where the edges fell on the grid — the same bar measured 0.00, 0.00, 16.78 and 17.66 across four sub-pixel offsets, so
it painted nothing at half of them and twice its honest weight at the others. Sub-unit marks now get their anti-aliasing
back. A true zero still paints nothing, which is the other half of the contract. HistogramStrip gained the visibility
floor it never had.

**SparkBar could paint outside its own viewBox.** `y` and `height` were rounded independently, so each could round up by
0.005 and a bar the clamp had seated flush on the frame came back as `y + height = 20.01` in a 20-unit box — and
`.mc-root` is `overflow: visible`, so that is a spill into the page, not a clip. Rounding the two edges and deriving the
extent makes `y + height <= y1` hold by construction. Found by the property test, which was red on main. An audit of the
catalog found no second instance.

**New: `@microcharts/react/fluid`.** `useFluidWidth` measures a container and hands you a number for a chart's `width`.
Static charts are hook-free, listener-free and observer-free by architecture, so this cannot live inside one; it is a
separate entry that nothing else imports, and you pay 403 B only when you use it. It answers the three things every
hand-written version has to decide: what to render before the first measurement, what to do when the box measures 0 (a
collapsed disclosure and an inactive tab both do, and a chart 0 units wide draws nothing, so the last real width holds),
and what to do where `ResizeObserver` does not exist.

**The catalog says how big a chart is meant to be.** 90 charts now carry `maxWidth`/`maxHeight`, and 90 carry a
`gotchas` array — the facts that do not fit a prop description, including every documented cap that previously existed
only as a dev warning in the source. `EventTimeline` at 823×658 draws a 6-unit bar in 658 units of whitespace because it
caps internally, and nothing in the types or the catalog said so.
