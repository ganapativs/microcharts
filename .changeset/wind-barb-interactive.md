---
"@microcharts/react": minor
---

**WindBarb has an interactive entry.** `@microcharts/react/wind-barb/interactive` completes the catalog at 106 charts
with both a static and an interactive entry. The glyph is one unit, so hover, focus, click, and Enter/Space all report
the same single reading: a floating chip (`readout={false}` suppresses it), `onActive` / `onSelect` with
`{ index: 0, value: magnitude }`, and a polite announcement when the value changes (`live={false}` opts out). `animate`
pops the whole glyph in on mount. `SummaryStrings` gains `windBarbChip` for the chip's terse form —
`southwest 225° · 32` — so the visible text is translatable like every other string.

**PhaseTrace keeps its arrowhead inside the viewBox.** The barbs reach behind the endpoint, so a trace ending at the
plot edge painted them outside the box. They now clamp to the plot box: unchanged when they fit, shortened rather than
redirected when the boundary is closer.

**Interactive Thermometer glides the right rect again.** The data-change transition selected the one rect without an ink
role, which the 0.12.0 ink-role pass turned into the tube. It now selects the accent-inked capsule, so the mercury
travels and the track stays still.

ConfusionGrid takes its column centers from `geometry.ts` instead of re-deriving the grid in the component, and
HeartbeatBlip's static and interactive entries share one `resolveNow` clock. Both are internal: same output, one
definition.
