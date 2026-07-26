---
"@microcharts/mcp": patch
---

Re-embed the stylesheet so rendered SVGs carry the updated readout rules. No API or tool-surface change — the server
inlines `styles.css`, so it needs a release whenever that file changes or npm keeps serving the previous snapshot.
