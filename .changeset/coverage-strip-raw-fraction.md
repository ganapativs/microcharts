---
"@microcharts/react": patch
---

`CoverageStrip` now rounds the coverage percent the same way its k-of-n siblings do. The summary aria-label and the
`label="percent"` gutter text fed `Intl` a `round2`-pre-rounded fraction, so a true half like 57.5% (`23/40`) collapsed
to `0.57` via IEEE-754 `Math.round` before `Intl` saw it, announcing and painting "57%" where `Progress` announces "58%"
for the same ratio. The formatter now receives the raw `measured / expected` fraction and lets `Intl` do the rounding,
matching `progress`.
