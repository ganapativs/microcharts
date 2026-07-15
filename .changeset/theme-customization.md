---
"@microcharts/react": minor
---

Deepen the theming surface — all additive, backward-compatible, and identity at their defaults (no visual change to
existing charts):

- **`defineTheme()`** — a new opt-in `@microcharts/react/theme` subpath (zero runtime deps, ~2 kB gzip, tree-shaken when
  unused). Give it one brand accent and it derives a harmonized, colour-blind-safe categorical palette and
  hand-tuned-style dark twins in-house in OKLCH — never moving the positive/negative hues off their CVD-safe split.
  Extend a preset, pin any token, pass an explicit palette, or `extend()` a variant; returns `vars` / `style` /
  `css(selector)` (with a `prefers-color-scheme: dark` block).
- **New tokens** — `--mc-font-numeric` (a dedicated face for figures, tracks `--mc-font` by default),
  `--mc-label-weight`, and `--mc-density` (one scalar that scales stroke weight, label size, and small-multiple gap
  together for compact vs comfortable layouts; the plot box is untouched).
- **`colors` prop** — per-instance series colours on the categorical charts (`SegmentedBar`, `StackedArea`,
  `PartitionStrip`, `Hypnogram`, `MicroDonut`), overriding `--mc-cat-*` just there.
- **`print` and `eink` presets** — output-context token bundles for paper and grayscale e-paper, answering
  `data-mc-theme` / `data-mc-preset` like the rest.

The `MicrochartCommonProps` shared-grammar type is now enforced as a single source of truth: a guard test holds every
chart's shared props to its canonical types.
