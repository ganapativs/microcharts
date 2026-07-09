---
"@microcharts/react": minor
---

Batch 3 (expressive) — `CitySkyline` (`./city-skyline`), static + `/interactive` entries:

- `CitySkyline` — how groups compare on size and how activated each is, two variables
  in one row. Building **height** is the primary, zero-anchored, high-precision channel
  (like a MiniBar); the **lit-window fraction** is a secondary low-precision channel
  ("mostly lit / half lit / dark", not a number). Windows are a fixed 2 columns, filled
  bottom-up, quantized to the window count. Omit `lit` everywhere → a plain bar row. NO
  roofline/antenna/width variation — width, roof, and ground are constants (earn every
  mark). The secondary channel drops out before the primary: a tower too short for a
  window row is solid, and its `lit` still shows in the summary and on hover. `labels`,
  `ground`, `label="value"`. The interactive entry roves buildings with ←/→, announcing
  each as "Platform: 46; 70% lit."

New `EN_SKYLINE` summary module (`citySkyline`, `citySkylineAt`, `citySkylineAtLit`).
Node budget 2 per building + 1 (merged windows path per building).
