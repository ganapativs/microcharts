---
"@microcharts/react": minor
---

Batch 3 (expressive, motion) — `CometTrail` (`./comet-trail`), static + `/interactive` entries:

- `CometTrail` — where is the value now, and where has it just been? The static frame is a
  decaying dot-sparkline with zero JS: a fading trail of recent points + a bright head dot at the
  current value + the now-value numeral. The interactive entry eases the head to each new value
  (WAAPI transform, ~220 ms) and decays the old head into the trail — motion only on data change,
  no idle loop. `trail` (points kept visible, default 12, cap 20), `label="last"` (default).
- **Honesty** — opacity encodes AGE only, never value (the y position does value); `trail` length
  is recency context, so changing it never changes the head read. The dot jumps to truth, eased —
  never interpolated between updates (a stalled stream goes still, which is the signal). Reduced
  motion → instant reposition (the static encoding is already complete); off-viewport paused.
- Arrow-Left steps back through the trail ("3 updates ago: 74."), Arrow-Right returns toward now,
  each announced through a polite live region.

New `EN_COMET_TRAIL` summary module (`cometTrail` / `cometTrailNow` / `cometTrailAt` + `cometTrends`
trend words). Node budget ≤ trail + 2.
