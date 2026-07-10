# Docs page structure audit (agent report, 2026-07-10)

Corpus: 99 chart mdx (98 chart pages + annotations reference page). Shared components: LiveDemo (sizeOf→chart-sizes.json), Usage, Playground, InteractiveDemo, Sizing, FourContexts, PropTable. No edge-case/empty-state component exists.

## De-facto template (no page reorders; some drop sections)
frontmatter → intro → hero LiveDemo → ## Install (Usage) → ## Try it (Playground) → ## Interactive (InteractiveDemo) → ## When to use it (Good/Avoid) → ## Sizing → ## Variants (2–5 LiveDemo) → ## Four homes (FourContexts) → ## Why this default → ## Accessibility → ## Props (PropTable)

## Gaps
1. **TRUNCATED PAGES (bug):** benchmark-strip, coverage-strip, icon-array, percentile-ladder — end mid-template after Variants; missing Four homes / Why this default / Accessibility / Props. Incomplete authoring pass.
2. **FourContexts missing on 42 pages** (57/99 have it). Not a clean rule — some batch2 have it, most batch3/4 glyph/strip charts don't. List in agent transcript; recompute with grep when fixing.
3. **## Why this default missing on 10:** 4 truncated + 6 original-five-era pages (activity-grid, bullet, delta, sparkbar, sparkline).
4. **Edge/empty-state section: 0/99 pages** — only folded into prose. Mission requires state/edge examples where relevant.
5. **16 pages use undefined placeholder identifiers in `code={...}` display snippets** (`data`, `tokens`, `weeks`, `years`, `moves`, `stages`, `steps`, `peers`, `cm`, `latencies`): activity-grid, benchmark-strip, confusion-grid, horizon, funnel, music-staff, dumbbell, coverage-strip, percentile-ladder, garden-grid, sparkline, minimap-strip, tree-rings, waterfall, token-confidence, annotations. Contradicts live-demo.tsx JSDoc "code shown is the literal source". Fix = literal inline data.
6. Intentional deviations (keep): motion charts (breathing-dot, comet-trail, heartbeat-blip, orbit-status) use "## Motion, and reduced motion" instead of Sizing; token-confidence text-is-chart; wind-barb renames Interactive → "## Reading the barb".

## Claims risk
- sparkline maxPoints=200 decimation claim — verify vs source.
- gzip sizes machine-generated (chart-sizes.json, CI-checked) — low risk.
- stats.ts hand-narrated SSR numbers (ssr 500→5.8ms, 1000→11.6ms) — spot-check vs bench/results.json (baseline run 2026-07-10: 500→5.7ms, 1000→37.2ms — **1000-row claim off 3×, check**).

## Content quality
No thin/generic copy in 13 sampled (312–542 words, chart-specific detail throughout). Old-five pages complete but predate later conventions.
