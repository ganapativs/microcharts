---
"@microcharts/react": minor
---

Batch 3 (expressive) — `Thermometer` (`./thermometer`), static + `/interactive` entries:

- `Thermometer` — where a value sits on a calibrated ticked tube, and how close to
  a goal. The fill anchors at `domain[0]` (never re-zeroed, never log — the ticks
  calibrate the read, which is what buys the high precision); the fill rect width
  equals the tube inner width so no clipPath/id is needed. An optional `target` draws
  a line across the tube (distinct shape from the side ticks, never color-alone). The
  bulb is instrument chrome (always full), never data. `orientation="vertical"
  |"horizontal"`, `bulb`, `ticks` (count or explicit values), `label="value"`,
  `domain` (default `[0,100]` — a stated range, never auto-fit). A value beyond the
  domain clamps the fill but the accessible name reports the true number. The
  interactive entry reveals the value on hover/focus and glides the fill with a
  reduced-motion-gated transition.

New `EN_THERMOMETER` module (`thermometer`, `thermometerTarget`) + a fill-transition
CSS rule. Static 2.22 kB (needs `makeFormatter` + `scaleLinear`) — above the spec's
2 kB target, well under the 3 kB hard cap; logged for the batch gate.
