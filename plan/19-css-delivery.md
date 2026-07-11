# 19 — Decision: CSS Delivery Architecture

> Status: decided 2026-07-06 · Resolves the under-specified styling-delivery gap flagged in the tooling review.

## Context

Per-component subpath exports + tree-shaking pull one way; a shared token system pulls the other. The library's value is dropping _many_ charts on a page — the styling story must not scale cost with instance count or subpath count.

## Decision

**One shared stylesheet, layered, imported once.**

1. **Single artifact:** `@microcharts/react/styles.css`, imported once by the consumer (documented up front, shadcn-style). Not code-split per chart.
2. **`@layer` cascade** — all rules inside `@layer microcharts` with ordered sub-layers: `microcharts.tokens` → `microcharts.base` → `microcharts.charts` → `microcharts.motion`. Selectors use `:where()` for **zero specificity**, so consumer overrides win with no `!important`.
3. **Theming via `--mc-*` custom properties** set at any scope (root, provider, element). Presets are token bundles. Per-chart CSS rules are minimal; most visual variation flows through tokens. Static charts also use SVG presentation attributes + `currentColor` where it keeps them JS-free.
4. **Budget accounting is explicit:** the **≤2 kB/subpath gate measures JS gzip only.** CSS is one shared artifact measured _separately_ against the ≤10 kB library budget. Keeping CSS out of the JS subpaths is what keeps static charts genuinely zero-JS and subpaths tiny.
5. **RSC-safe:** a plain `import '@microcharts/react/styles.css'` works in Server Components (the bundler links/inlines it) and adds **zero client JS**. Motion/interactive rules live in the same sheet, gated by classes that only client entries toggle.

## Why not per-chart CSS splitting

- Total CSS is small — shared tokens + a handful of media / `forced-colors` / `prefers-contrast` / `prefers-reduced-motion` blocks + thin per-chart rules. Splitting saves negligible bytes.
- Splitting would mean **multiple CSS imports** (or injected `<style>` per chart → FOUC + duplicate tokens) — hostile to "500 charts on a page."
- Adds real rolldown CSS-code-splitting complexity for no user benefit.

## Consequences

- ✅ One import, predictable cascade, font-agnostic, consumer themes by overriding `--mc-*` at any scope.
- ✅ JS subpaths stay tiny (CSS not counted in their gzip); static = zero JS.
- ⚠️ Unused chart **CSS** ships even if that chart's JS is shaken out. Acceptable — the sheet is small and CI-budgeted.
- 🚧 Consumer must not forget the one import. Mitigate with a prominent docs step; optionally a dev-only console note if `--mc-*` tokens resolve empty.
- 🔓 **Escape hatch:** if library CSS ever approaches budget, split by _family_ (`styles/trend.css`, `styles/categorical.css`) — not per chart. Noted, not needed at v1.

## How to apply

- Author one `styles.css` with the `@layer` structure above; no CSS-in-JS, no per-component sheets.
- `size-limit` gets a dedicated CSS entry against the library budget.
- Docs show the single import in the install snippet and every fixture.

## Amendment 2026-07-11 (unified-motion) — the escape hatch, exercised precisely

Audit result at 106 charts: the sheet is ~90 % genuinely universal (tokens, the
`data-mc-ink`/`data-mc-w`/`data-mc-cat` role system shared by 40+ charts, and the
`forced-colors` / `prefers-contrast` / `prefers-reduced-motion` blocks that re-map that
role system — none of which CAN be split per chart). Only ~2.2 kB raw is single-chart.
So the split is surgical, not per-chart-everything:

1. `styles.css` stays the single hand-authored source AND the default import —
   unchanged DX, unchanged budget row. Single-chart blocks inside it are fenced with
   `/* @mc-chart <slug> */ … /* @mc-chart-end */` markers.
2. The build (`scripts/gen-style-splits.mjs`) emits `dist/styles/core.css` (everything
   universal) plus `dist/styles/<slug>.css` per fenced slug, each re-declaring its
   `@layer` wrappers so the cascade is identical. Exported as `./styles/core.css` and
   `./styles/*.css` for byte-minimal consumers: one chart = core + that chart's sheet,
   nothing else. A node test proves core+charts ≡ aggregate.
3. Entrance-motion CSS cost is **zero**: the `animate` system is WAAPI-in-JS
   (`./motion` subpath) and adds no rules to any sheet.

Rules that stay shared stay shared — anything used by 2+ charts lives in core; the
"why not per-chart splitting" section above still governs the 90 %.
