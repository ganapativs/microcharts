---
"@microcharts/react": minor
---

Batch 3 (expressive) — `PolarClock` (`./polar-clock`), static + `/interactive` entries:

- `PolarClock` — the shape of a day or week cycle: when is it busy? Each value in a
  cyclic series is a radial bar at its fixed cycle angle, growing outward from an inner
  baseline (length ∝ value). 0 sits at 12 o'clock and the cycle runs clockwise. Works
  for any n (24 hourly, 7 daily, or arbitrary). `now` accents the current segment
  (position + color, never color alone), `start` rotates which index sits at 12 o'clock,
  `labels` adds hairline cardinal ticks, `label="max"` prints the peak value in a gutter,
  `formatSegment` labels segments (hour formatting for n=24, weekday names for n=7).
- **`mode="opacity"`** switches the channel to fixed-length sectors whose 5-step fill
  carries the value — a radial `ActivityGrid` for very small sizes — a deliberate,
  documented change of encoding.
- **Honesty** — the channel is radial LENGTH from the inner baseline, never sector area;
  a nonzero inner radius curbs the outer-area distortion and the docs ask you to compare
  lengths, not wedges. Bars are always zero-anchored; a `null` segment leaves a gap
  (missing ≠ zero).
- The interactive entry maps the cursor angle to a segment (lifting it to the accent),
  arrows through segments circularly, and announces each segment's label and value through
  a polite live region with a matching hover readout.

New `EN_POLAR_CLOCK` summary module (`polarClock` / `polarClockFlat` / `polarClockAt` +
`weekdays` i18n array). Built on `core/arc` (`annulusSector`). Node budget 3.
