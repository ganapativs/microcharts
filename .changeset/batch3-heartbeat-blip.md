---
"@microcharts/react": minor
---

Batch 3 (expressive, motion) — `HeartbeatBlip` (`./heartbeat-blip`), static + `/interactive` entries:

- `HeartbeatBlip` — is it alive, and how busy? A baseline with an ECG-style spike at each event
  across the recent window (x = how long ago). The static frame shows the spike positions with
  zero JS; the interactive entry sweeps the trace left in real time so the blip frequency IS the
  event rate. `window` (default 60000 ms), `now` (explicit clock — pass from the data layer;
  the static entry never calls `Date.now()`, so SSR stays deterministic), `label="count"`.
- **Honesty (the load-bearing rule)** — every spike is ONE real event; nothing is synthesized on
  a timer. An empty window → a flat baseline that IS the down signal (shape, never color), with a
  "no events" state distinct from no-data. Events after `now` are clamped (clock skew); events
  older than the window drop.
- **Reduced-motion + viewport gating** — the sweep pauses off-screen (shared observer) and never
  runs under `prefers-reduced-motion` (the static strip re-renders on each data change instead —
  same information). A new event blips the endpoint once (WAAPI scale) and announces through a
  polite live region; there is no per-spike navigation (spikes are transient — the summary is the
  record).

New `EN_HEARTBEAT` summary module (`heartbeat` / `heartbeatFlat` + translatable `heartbeatWindow`
/ `heartbeatAgo` duration helpers). Node budget 3.
