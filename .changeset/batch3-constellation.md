---
"@microcharts/react": minor
---

Batch 3 (expressive) — `Constellation` (`./constellation`), static + `/interactive` entries:

- `Constellation` — when the rare events happened, and how big. Each event is a dot
  placed by time (x) and value (y); an optional magnitude drives an **area-true** dot
  size (`r ∝ √m`). A hairline chronology line connects the events in time order. Built
  for _rare_ events (a dozen or fewer); dense streams steer to `Seismogram` /
  `EventTimeline`. `connect` (default `true`; off for a pure scatter), `label="max"`
  (numeral beside the largest event), `xFormat` (formats time for the summary — e.g. a
  month name), `domain` / `xDomain`.
- **Honesty** — dot size is area-true, a deliberately low-precision channel, so the
  number lives in the summary and the hover readout, never in a size you must measure.
  When no event carries a value, the vertical position is **deterministic seeded jitter
  that encodes nothing** (SSR/hydration-stable via `core/jitter`); the connector's slope
  is then meaningless and the summary never reads vertical position. Time is sacred — the
  x position is never jittered, so simultaneous events share an x.
- The interactive entry steps through the events chronologically (←/→), announcing each
  event's time, value, and magnitude through a polite live region, with a matching hover
  readout and a focus ring on the active event.

New `EN_CONSTELLATION` summary module (`constellation` / `constellationOne` /
`constellationAt`). Node budget n+1.
