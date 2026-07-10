# Family-agent brief (canonical — every family follows this exactly)

Reference standard = span family (commits `f29a4a2` + `753bc51`): study `src/charts/trace-fold/`, `src/charts/partition-strip/`, `tests/visual/trace-fold.spec.ts`, `apps/docs/content/docs/charts/trace-fold.mdx` BEFORE touching your family. Law docs: CLAUDE.md non-negotiables, plan/04 §8 (contract rulings), audit/FOUNDATION.md. Minimal diffs — do NOT rewrite charts that already clear the bar.

## Per chart (static + client entries)
1. **Prop contract** (plan/04 §8): apply any rulings touching your chart (renames, enum labels, readonly domains, shared types from core). Update its tests, docs page, registry file (`apps/docs/src/lib/charts/<slug>.tsx` — props table, example.code, playground spec) in the SAME pass.
2. **Width roles**: literal secondary `strokeWidth` → `data-mc-w="support|tick|hair"` (⅔/½/⅓ of `--mc-stroke-width`; at default 1.5 → 1.0/0.75/0.5). Map 0.9/0.8→tick or support by eye; 0.6/0.4→hair. Keep a literal ONLY for justified geometric strokes (one-line comment). Focus rings/overlays in client entries take roles too.
3. **Fill roles**: inline `fill="var(--mc-cat-N)"` → `data-mc-cat={n}` (1-based). Inline accent/neutral/stroke fills → existing ink roles where exact (`accent`, `neutral`, `bar`, `point`…). NEVER use `data-mc-ink="band"` except for true background bands (it also exempts rects from the craft text-on-mark check — misuse hides real collisions). Line-shaped accent marks: `data-mc-ink="accent"` now strokes via element-split rule.
4. **SSR hot path** (only if the chart renders >10 elements): drop per-item `<g>` wrappers (flat siblings via flatMap + keys), replace per-item inline `style` objects with plain SVG attributes or CSS roles. KEEP as attributes: `fontSize`, `textAnchor`, `dominantBaseline`, all coordinates — the craft gate computes text extents from raw attributes.
5. **Label seat-gate**: any in-mark/adjacent label must fit BOTH axes: width (`len × fontSize × 0.6 + 2`) AND height (`rowH ≥ fontSize + 0.8`) — drop out cleanly otherwise. `labelFont` (core/labels.ts) is the only font source.
6. **Bench**: if flagged BELOW FLOOR in audit/BASELINE.md, optimize markup FIRST (as above). If still short, propose a recalibrated floor in your report with the element-count rationale (React SSR ceiling ≈300 elements/ms; floor ≈75% of expected quiet measure) — do NOT edit bench/scenarios.mjs yourself.
7. **Motion (Emil ruling — binding)**: static entries never animate. Interactive: hover/focus feedback instant; the shared readout chip already has its enter transition — do not add per-chart entrances unless the chart is an explicitly motion-typed chart (breathing-dot etc.), and then only transform/opacity, ≤200ms strong ease-out `cubic-bezier(0.23,1,0.32,1)`, reduced-motion gated, exit ≤ enter. No keyframes on rapidly-retriggered state (use transitions).
8. **Canon guard**: client composes the static (never re-implements SVG), one pointer listener + pure math, no hardcoded English outside `EN_*` strings, `makeFormatter` only, no `new Intl.*` in components, integer-ish 2-dp coords, nothing paints outside the viewBox.

## Per page (`apps/docs/content/docs/charts/<slug>.mdx`)
Guideline order: intro → hero LiveDemo → Install → Try it → Interactive → When to use it → Sizing (motion charts: "Motion, and reduced motion") → Variants (every meaningful prop shown once) → **Edge cases** (1–3 LiveDemos of true documented edge behavior — verify against geometry, cite nothing you didn't check) → **Four homes** (`<FourContexts slug="…" />`) → Why this default → Accessibility (REAL describeSeries/summary output) → Props.
- Add missing sections; keep good prose (minimal diffs). No Tufte/theory name-drops. Voice: crisp, specific, quietly compelling — zero hype.
- ALL snippets fully literal inline data (both rendered JSX and `code=` strings, and the registry `example.code`). No undefined identifiers.
- `format`-bearing charts: one locale variant (e.g. de-DE), output string verified via makeFormatter.
- Verify every numeric/behavioral claim against src; fix or delete.

## Verification you run (safe concurrently)
- `pnpm vitest run src/charts/<each-chart>` after each chart (node + browser projects).
- Add/extend `tests/visual/<slug>.spec.ts` for charts missing one (copy trace-fold.spec.ts pattern: sentence/cell/kpi/tab + variants + presets, registry dataset). Do NOT run playwright.
- Do NOT run: pnpm build, size, bench, craft, docs build (orchestrator runs these between waves — dist races).
- Shared files (styles.css, bench/scenarios.mjs, tests/craft/matrix.mjs, src/core/*, CLAUDE.md, plan/*): do NOT edit. If your family needs a chart-scoped CSS rule, a craft ALLOWED entry, or a core addition — put the exact proposed diff in your report.

## Report back (compact, no dumps)
Per chart: contract changes applied · roles migrated (count) · bench action (none/optimized/floor-proposal+rationale) · vspec added? · tests status. Per page: sections added, snippet fixes, claims fixed, locale added. Family-level: proposed shared-file diffs (exact), near-duplicate observations (flag only), self-score /100 per chart + page with the ONE biggest remaining gap each. Keep under 120 lines.
