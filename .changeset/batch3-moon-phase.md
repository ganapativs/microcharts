---
"@microcharts/react": minor
---

Batch 3 (expressive) — `MoonPhase` (`./moon-phase`), static + `/interactive` entries:

- `MoonPhase` — the illuminated area of a disc encodes a 0–1 fraction, area-true and
  readable across cultures. The lit **area equals the value exactly** via a closed-form
  terminator (a semi-ellipse with `rx = r·|2f−1|`; lit area = right semicircle ±
  semi-ellipse = `f·πr²`), never the phase-angle approximation that under-lights
  mid-cycle. `mode="progress"` is monotonic (0 new → 0.5 half → 1 full — the sprint/
  quota story); `mode="cycle"` maps the real lunar sequence (0 new → 0.5 full → 1 new,
  waxing then waning) — a data-semantic switch, never a preset. Waxing lights from the
  right. The interactive entry cross-fades the lit region on change (an opacity swap,
  never a `d:` path interpolation — no Safari), reveals the percent on hover/focus, and
  announces through a polite region.

New `EN_MOON` summary module (`moonPhase`, `moonPhaseCycle`). Node budget 3 (disc +
lit region + outline). No `makeFormatter` — the percent is computed inline.
