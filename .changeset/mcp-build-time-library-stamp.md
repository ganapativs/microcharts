---
"@microcharts/mcp": patch
---

**The catalog carries WindBarb's interactive entry.** `get_microchart` and `/catalog.json` now hand a model
`@microcharts/react/wind-barb/interactive` alongside the static import, so the last static-only chart is no longer a
special case.

**The library stamp is set at build time.** It used to be committed into `catalog.generated.json`, written one commit
before `changeset version` bumped the library — so every release published a snapshot naming the previous version and
left the generated file stale on `main` until a follow-up sync PR corrected it. The server now reports the
`@microcharts/react` version it was actually built against, and a chart change reaches npm from the PR that made it.
