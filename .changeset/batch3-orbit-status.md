---
"@microcharts/react": minor
---

Batch 3 (expressive, motion) — `OrbitStatus` (`./orbit-status`), static + `/interactive` entries.
**Completes the 22-chart Batch 3 (expressive) catalog.**

- `OrbitStatus` — how slow and how busy is this dependency right now? A service dot with an orbit
  whose RADIUS = latency and whose DASH DENSITY = call rate (quantized to 5 steps, "denser dashes =
  more calls") + a satellite. The static frame carries BOTH variables with zero JS; the interactive
  entry mirrors the rate as the satellite's angular SPEED (the same 5 steps, so static and motion
  decode identically) — **motion IS the encoding** (idle-loop exception, loop rate = the datum).
  `latencyDomain` / `rateDomain` (insisted on — a lone radius is meaningless), `alert` (latency
  threshold: satellite doubles + summary flags), `label="latency"` (ms numeral escape hatch).
- **Honesty** — both channels are quantized 5-step ordinals; radius and speed come from the same
  domains in both frames (no drift). The satellite's angular POSITION encodes nothing — only its
  speed does (documented). `rate` 0 → a solid, dash-free orbit; unknown latency/rate → gray, no
  satellite, and no spin (an unknown dependency must not look healthy). The alert state is doubled
  by the satellite size + the summary, never color-alone.
- Reduced-motion → the static frame (dash density already carries rate); off-viewport paused
  (shared observer); the live region announces threshold crossings only.

New `EN_ORBIT_STATUS` summary module (`orbitStatus` / `orbitAlert` / `orbitUnknown`, units in-template).
Built on `core/arc` (`evenDashes` / `polarPoint`). Node budget 3.
