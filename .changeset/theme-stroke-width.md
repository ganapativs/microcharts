---
"@microcharts/react": minor
---

`defineTheme()` gains a **`strokeWidth`** token — pin the base data stroke weight (`--mc-stroke-width`) alongside the
other geometry/type tokens. A number is stringified as-is (not twinned into the dark variant). Additive and identity at
its default.
