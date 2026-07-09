---
"@microcharts/react": minor
---

Batch 3 (expressive, motion) — `BreathingDot` (`./breathing-dot`), static + `/interactive` entries:

- `BreathingDot` — how loaded is the system right now, ambiently? The static frame is a real
  chart with zero JS: a core dot colored by threshold band (calm / elevated / strained) plus a
  level ring whose distance from the core encodes the level. The interactive entry adds a WAAPI
  pulse whose rate and amplitude are snapped to the three bands — **motion IS the encoding**
  (the allowed idle-loop exception, because the loop parameter is the datum). `thresholds`
  (default `[0.5, 0.8]`), `label="value"` (percent numeral escape hatch).
- **Reduced-motion + viewport gating** — the pulse never runs under `prefers-reduced-motion`
  (reduced-motion readers get exactly the static frame; the ring offset already carries the
  level) and pauses when the dot scrolls off-screen (a shared `IntersectionObserver`). Band
  color is always doubled (ring offset statically, pulse rate in motion), never color-alone.
- **Honesty** — an unknown value (`null` / `NaN`) makes the dot gray, drops the ring, and never
  pulses: an unknown system must not look calm. The live region announces band changes only,
  never per tick.

New `EN_BREATHING_DOT` summary module (`breathingDot` / `breathingDotUnknown` + `loadBands`) and
a shared `src/shared/motion.ts` (`usePrefersReducedMotion`, `useInViewport` with one shared
observer) that the batch's motion charts reuse. Node budget 3.
