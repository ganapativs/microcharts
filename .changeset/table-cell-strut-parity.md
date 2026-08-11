---
"@microcharts/react": patch
---

A table cell holding only a Delta or TokenConfidence keeps its font strut in both entries.

The chart-only-cell rule in `styles.css` removes the line-height strut so a lone SVG mark seats the row. Its selectors
matched the two HTML-text charts through their live wrappers (`data-mc-host`, the `-live` class) and never their static
twins, so a server-rendered row lost 2px the moment the interactive entry hydrated. Text charts are excluded from the
strut removal now — their marks are text, so the strut is load-bearing — and a hydrating cell no longer moves.
