# Prop contract audit (agent report, 2026-07-10)

Baseline contract very well kept (~90+ charts): `data, domain: readonly [n,n], width/height, color, format, locale, strings, title, summary, id, className, style, children`; `positive: "up"|"down"`; `variant` = sanctioned style-substitute; `mode` = per-chart big toggle. No option-bags anywhere. `animate` is not a prop by design (client entries + CSS own motion) — CLAUDE.md vocab line misleading.

## Unification items (lib unreleased — rename now)
1. wind-barb `label?: boolean` → `"value"|"none"` string enum (only type break in 60+ label charts).
2. `highlight` dual meaning: majority = index/label addressing (dot-plot, dumbbell, funnel, mini-bar, slope); histogram-strip + rug-strip use it as raw domain VALUE → rename those to `markValue` (or similar).
3. `side` clash: quantile-dots ("above"|"below" threshold) vs volume-profile ("left"|"right" growth) → volume-profile → `align`.
4. Denominator: `of` (icon-array) / `total` (honeycomb, pictogram-row, tree-rings) / `max` (progress, tally-marks) → converge `total` where denominator meant (keep `max` where it's a scale cap? decide: one word).
5. `dots` boolean (percentile-ladder, star-spoke) → string enum matching sparkline family.
6. `empty` cell vocab: garden-grid ("ring"|"blank") vs honeycomb ("outline"|"dim") → shared enum.
7. calendar-strip missing `cell`/`gap` its grid siblings have → add.
8. Emphasis overlap: `highlight` (5) / `emphasis` (event-raster, hypnogram, partition-strip, trace-fold, ensemble-ghosts) / `accent` (confusion-grid, tree-rings) → document one rule; fold where unit is same kind.
9. `range` clash: depth-wedge (number) vs benchmark-strip/music-staff (enum) → depth-wedge → rename.
10. `domain` bare tuples in 8 charts → `readonly [number, number]` everywhere.

## Data shapes
- `Value[]` (null-gap-aware) ~18 charts; plain `number[]` 9 charts (incl. heartbeat-blip where it's TIMESTAMPS — different semantic, same type); inline `(number|null)[]` 3 charts (cycle-plot, polar-clock, spiral-year — should use Value alias).
- Gap-allowed vs not looks per-author, not principled → document rule: single-series charts accept `Value[]` unless nulls are meaningless for the type (justify per chart).
- Two-arm keyed shapes {a,b}/{plan,actual}/{before,after} — keep chart-specific names, add shared structural type.

## Sizing
- `width`/`height` 70+ charts; `size` 13 square-glyph charts (internally consistent — keep); `cell`+`gap` grids; honeycomb `cellR` (rename→`cell`? radius semantics — decide); no-knob charts: calendar-strip (fix, #7), delta/fat-digits/fill-word (`fontSize` — fine, text charts), heat-cell, status-dot, token-confidence, trend-arrow (intrinsic — fine).
- Orientation type redeclared in thermometer + tape-gauge → share one exported type.
