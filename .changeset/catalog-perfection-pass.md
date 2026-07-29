---
"@microcharts/react": minor
---

Catalog-wide correctness and accessibility pass over all 106 charts.

**Hostile config props no longer reach the accessible name.** A non-finite `width`, `height`, `domain`, `target`,
`open`, `window`, `total`, `step` — the kind a host produces with `Number(field.value)` on an empty input — used to
render a normal-looking chart while the `aria-label` announced "NaN". Every chart now resolves such a prop to its
documented default, and geometry and summary resolve through the same value, so the announced scale is always the scale
that was painted. `tests/craft/robust.mjs` grew a config pass that asserts this across the catalog (1255 chart×scenario
renders).

**A non-finite box is no longer silently destructive.** `viewBox="0 0 NaN 20"` is invalid, so browsers drop the
attribute and the chart renders at the wrong scale with a correct-sounding name attached. `chartSide()` in
`core/types.ts` clamps it, and both `Chart` (the frame) and chart geometry (the marks) call it, so the two cannot drift.

**Theming: a host can now pin light, not just dark.** `[data-mc-theme="dark"]` had no counterpart, so on a dark-OS
machine `prefers-color-scheme` won whatever the host said. Hosts that pin light usually override the palette but not
`--mc-on-fill`, which left light fills carrying dark knockout ink — measured at 3.0–3.8:1 on real pages, under the 4.5:1
text floor. Added `[data-mc-theme="light"]`, plus a guard asserting every token the dark branch overrides is restated in
the light one.

**Forced-colors gaps closed.** `--mc-accent` now maps to `Highlight` (roughly a hundred interactive entries draw focus
rings as a literal `stroke="var(--mc-accent)"`, which no role mapping reached); the accent element-split is repeated
inside the forced-colors block, which lives in a later cascade layer and was overriding it, painting open polylines as
solid wedges; `text[data-mc-on-fill]` and `text[data-mc-ink="label"]` take system colors instead of literal rgba.

**Summaries.** The paired templates (`Dumbbell`, `Slope`) concatenated an empty percent, announcing "From 0 to 5, up ."
whenever the baseline was zero. `round2` returned `±Infinity` for finite inputs past ~1.8e306, so charts announced "∞".
`Sparkline`'s interactive entry never passed `strings` to `describeSeries`, so a localized host still got an English
accessible name.

**WindBarb** could hang: a finite-but-huge `size` made the glyph draw loops iterate ~1e307 times. Bearings are also
wrapped into one turn before the trig, which both fixes `direction={5.7e307}` rendering at NaN coordinates and makes
361° draw the same glyph as 1°.

Per-subpath gzip grew by a mean of 113 B static / 118 B interactive, entirely from these guards; budgets are
re-baselined to match.
