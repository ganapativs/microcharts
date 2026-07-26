---
"@microcharts/mcp": patch
---

Re-snapshot the embedded catalog and stylesheet after the consistency pass in `@microcharts/react`.

The server ships both as committed snapshots, so an unreleased regeneration means npm keeps serving a stale one. What
moved: `ActivityGrid.steps` and `RetentionCurve.compare` are new props an agent can now discover and set; `onActive` now
appears on the scalar entries that only advertised `onSelect`; and the embedded `styles.css` carries the label-contrast
fixes, the achromatic `mono`/`eink` categorical ramp and the forced-colors mappings, so a chart rendered through
`render()` reads the same as one rendered in an app.
