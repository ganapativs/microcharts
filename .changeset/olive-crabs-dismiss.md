---
"@microcharts/react": minor
---

Every interactive chart now lets go of a selection.

**A pin dismisses from outside the chart.** Selecting a unit pins its readout, and that pin survives blur on purpose —
it is what makes a chart useful next to a table or a KPI card. Until now it survived everything else too: re-selecting
the same unit cleared it, and `Escape` cleared it, but only on a chart that still held keyboard focus. A decorative
chart (`summary={false}`, no `title`) never takes focus at all, so it had no exit. The thing a reader tries first —
clicking somewhere else — did nothing, and the mark stayed ringed with every other mark dimmed around it.

While a unit is pinned, and only then, the shared picker binds `pointerdown` and `keydown` on the window. A pointer
press that is not the chart's own drops the selection, `Escape` drops it from anywhere on the page, and both report
`onSelect(null)` — the same callback a re-tap already fired. Nothing changes for an idle chart: no pin, no listeners.
Blur is still not a dismissal, so tabbing from a chart to a panel that reads the pinned value keeps the value. A
controlled chart (`selectedIndex`) reports the dismissal and leaves the selection to your state.

**`Escape` answers on a chart whose data went away.** A live series can empty out under a pin. The keyboard handler
returned early on a chart with nothing to rove between, `Escape` included, which left one state the keyboard could not
leave.

**Sparkline stops announcing a pin that outlived its series.** Shrink `data` under a selected index and the readout
indexed straight past the end, so the live region read "Point 0 of 3: NaN" and the crosshair pointed at an undefined
coordinate. A `selectedIndex` aimed at a gap did the same. Both now read as nothing shown.

Interactive subpaths grow about 50 B gzip for this; statics are untouched, and the 7 kB interactive ceiling still holds.
Sparkline sits at that ceiling, so its share was paid for inside the entry rather than added to it: the wrapper cache is
a plain object, `navOrder` indexes its order array directly, the dismissal stamp reuses the ref the tap/drag test
already kept, and the chart's crosshair helper is inlined into its only caller. It measures 6991 B against a 7000 B
budget.
