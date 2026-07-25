---
"@microcharts/mcp": patch
---

Declare a real JSON Schema type for `render_microchart`'s `data` parameter. It was `z.any()`, which emits `{}` with no
`type` — clients that build a form or a prompt from the schema (Glama's inspector among them) read that as an unknown
field type, and a model learns nothing about what to pass. It is now the union the catalog actually uses: an array for
ordered series, or an object for the few charts whose data is keyed. Scalar charts still omit it. Per-chart shapes are
unchanged and still validated at render time.
