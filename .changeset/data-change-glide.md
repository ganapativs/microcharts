---
"@microcharts/react": minor
---

**Value marks glide when the data changes.** Role-bearing geometry (`data-mc-ink`, `data-mc-cat`, `data-mc-cone`) now
transitions on its geometry attributes, so a re-render travels to the new reading instead of cutting. Scrub focus marks
reuse DOM nodes and travel on `transform`; discrete selection rings still snap. Entrance voice labels wait for the story
front before they speak, so an endpoint caption lands with the stroke that names it.

**Ink roles reach more marks.** Charts that painted value geometry with bare `fill`/`stroke` attributes now carry a role
(and move the paint to an inline style when the role would otherwise change colour or opacity). Thermometer mercury uses
`accent` rather than the tube's translucent `fill` role, so the column is opaque again. Interactive thermometer chips
print `value / target` when a target is set.

**Motion engine.** Endpoint labels clamp to the story end so waiting on the front never lengthens the entrance.
