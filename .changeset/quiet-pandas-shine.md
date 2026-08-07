---
"@microcharts/mcp": patch
---

Re-publish the embedded catalog. Every chart entry gains `maxWidth`/`maxHeight` — the box the chart is authored for,
which nothing previously stated — and a `gotchas` array carrying the facts that do not fit a prop description: the caps
that lived only as dev warnings in the library source, which charts print their own sign, which take a raw sample rather
than precomputed quantiles, and how `format` merges with a chart's own defaults. `get_microchart` returns both.
