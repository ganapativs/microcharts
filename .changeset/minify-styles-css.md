---
"@microcharts/react": patch
---

Ship a **minified** `styles.css`. `@microcharts/react/styles.css` (and the
per-chart `styles/*.css` escape-hatch files) now resolve to minified copies in
`dist/` — the shared stylesheet drops from ~8.7 kB to ~2.8 kB gzip. The
minifier only strips comments and whitespace (no rule merging), so `@layer`
membership and cascade order are unchanged. The repo-root `styles.css` stays the
unminified source of truth; no API or visual changes.
