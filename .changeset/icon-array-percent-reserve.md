---
"@microcharts/react": patch
---

`<IconArray label="percent">` reserves its label gutter from the widest string the caller's `format` can produce over
the grid's own values (k/n), not from `pct(1)`. "100%" is the widest percent, but a `format` that replaces the style
(`{ style: "decimal" }`, `{ style: "unit" }`) renders its narrowest form at 1 ("1", "1 km") and "0.05 km" at k=1, so the
reserve under-measured and the label painted past the viewBox at narrow widths.

Interactive charts no longer re-announce a live-region sentence that did not change. `useAnnounceOnChange` keyed on the
raw value, so a move that leaves the spoken text identical (`0 → -0`, `3.4 → 3.2` under a rounding chart) spoke the same
sentence again. The region now speaks only when the sentence itself changes.
