# Superaudit 2026-07-10 — mission tracker

> **STATUS: COMPLETE** (2026-07-10). All 98 charts + 98 pages through the 5 gated passes; every hard gate green (tests/craft/size/bench/visual/docs, webkit+firefox smoke). Deliverables: audit/CHANGELOG.md, audit/CANDIDATES.md, audit/AUDIT-TABLE.md (final section), this tracker. Branch `superaudit`, ready for PR + Argos CI baseline review.

Prompt: full audit/rebuild/verify of all ~100 charts + docs pages. 8 dimensions (size, speed, visual, consistency, prop contract, theming, responsiveness, composability) + self-legibility + a11y + delight. Happiness 100/100 per chart + page. Hard gates: size budgets, bench no-regress, visual-regression intended-only, axe zero, tests green.

## Phases
- [x] Phase 0 — inventory, baseline, cluster into families, audit table → `audit/BASELINE.md`, `audit/AUDIT-TABLE.md`, `audit/reports/*`
- [x] Phase 1 — foundation → `audit/FOUNDATION.md` → **CHECKPOINT 1 PASSED 2026-07-10: user approved all (tokens+props both, count=98, page spec w/ 4ctx required, span-first ≤3 concurrency)**
- [◐] Phase 1b — foundation implementation (styles.css width roles + preset single-source/parity test + dead tokens; core Orientation/ON_FILL_INK; CATALOG_TARGET removed; plan/04 §8 + plan/12 + CLAUDE.md amended). Vivid accent pin removed (design call). Docs preset block mirrors lib, parity-tested.
- [ ] Phase 2 — family-by-family. FIRST: span (event-timeline, partition-strip, trace-fold) → CHECKPOINT 2 (reference standard). Then strip→profile→radial→glyph→grid→line→dot→bar→band→text→connector, ≤3 concurrent agents.
- [ ] Phase 3 — harden (edge cases, sizes, backgrounds, a11y, self-legibility, weight consistency)
- [ ] Verify — matrices, harness, cross-browser, page pass
- [ ] Deliverables — changelog, candidates report, sign-off

## Family-agent brief checklist (write once, reuse)
Per chart: prop renames per plan/04 §8 · strokeWidth literals → data-mc-w roles (visual check via craft + docs preview) · bench floor green (optimize geometry/bytes) · visual spec added if missing · edge fixtures green · axe green · four skill passes (Animate w/ emil skills, Delight, Polish, Optimize w/ before→after bytes) · page to guideline (4ctx, Edge cases, literal snippets, locale example if format, claims verified) · registry/catalog sync · compact report back.

## Key repo facts (discovered 2026-07-10)
- 99 chart dirs in `src/charts/` (100 catalog types; sparkbar hosts win-loss). All batches 0–4 merged, CI green at `431f6b3`.
- Docs: `apps/docs` Fumadocs static export; 101 files in `content/docs/charts/`; registry `apps/docs/src/lib/catalog.ts` (verify).
- Harnesses that EXIST — reuse, don't rebuild: `pnpm craft` (tests/craft/matrix.mjs — text overlap/escape audit), `scripts/visual-check.mjs`, `tests/visual/*.spec.ts` (Playwright+Argos), `bench/run.mjs` (+results.json), size-limit (generated from `scripts/size-budgets.json`), axe harness `src/test/a11y.ts`, `pnpm check`.
- Budgets: static ≤3 kB gz (Delta-class ≤1.5), interactive ≤ static+1 kB, kernel ≤5 kB, styles.css ≤12 kB. Sparkline 3.35/4.35 documented exception.
- Non-negotiables in CLAUDE.md are law (zero-dep, static-first, one grammar, a11y default, no Tufte name-drop, honest encodings).

## Working rules for this mission
- Branch: `superaudit` (create at first code change). Minimal diffs; no rewrite of passing charts.
- Emil Kowalski skills NOT yet installed (`npx skills@latest add emilkowalski/skills`) — install before motion pass.
- Sub-agents: family-per-agent end-to-end after foundation approval; compact reports only.
- Update this file + STATUS notes in same commit as work.

## Log
- 2026-07-10: mission start. Phase 0 begun.
- 2026-07-10: Phase 0+1 done, checkpoint 1 approved (all asks). Foundation committed.
- 2026-07-10: **Span family (reference standard) chart work done**: trace-fold + partition-strip SSR markup 2.3× smaller via ink/cat/width roles (band-role misuse removed, craft ALLOWED entries added for by-design in-bar labels), bench floors recalibrated w/ written rationale (≈300 el/ms React SSR ceiling; floors = 75% of quiet measure) — both now pass; label seat-gate added (labels drop out when row can't hold floor font — fixes inline smudge); event-timeline stroke literals → muted/accent + width roles (incl. element-split accent stroke rule); client focus rings → width roles; shared readout-chip 140ms ease-out enter (@starting-style, reduced-motion gated) — library-wide. Visual specs added for trace-fold + partition-strip (pattern: four contexts + variants + presets, registry datasets). Full check suite 2298 green, craft 611/0, size green (PS 2.0/2.3, TF 2.11/2.4 kB).
- Emil motion ruling for the library (record for all families): static entries NEVER animate (frequency rule + static-first law); motion = interactive entries + shared chip/live patterns; hover/focus feedback instant; entrances only via @starting-style/transition, ≤200ms strong ease-out, exits instant/faster.
- 2026-07-10: **WAVE 1 DONE + GATED** (strip f236254, profile f35bfe5, radial 85d3561 + shared gate commit): 32 charts. All gates green post-wave: 2300 lib tests, craft 611/0, size 0 exceeded (4 budgets bumped ≤50 B for deliberate fixes), quiet bench — all wave-1 charts pass (floors recalibrated w/ rationale: calibration 15→8, DWM 30→17, rubric 25→15, star-spoke 60→26, bullet 30→20, ohlc 8→6), 172 visual tests, docs 209 + 339-page build. Perf wins: volume-profile 12.6→32 (double-binning bug), tree-rings 9.9→44 (O(1) nodes), depth-wedge →58, tape-gauge →40, minimap →12.9. Core: funnel "1 stages" plural fix, likertAt string (canon), valence element-split stroke rules. Remaining bench reds belong to W2–W4 families: token-confidence, wind-barb, confusion-grid, phase-trace, cycle-plot, hourglass, breathing-dot, balance-beam.
- 2026-07-10: **WAVE 2 DONE + GATED** (65ad0e1, 122 files): glyph+grid+line, 30 charts. Key: 3 contract renames (events/total/label-enum), confusion-grid solid-ring + clamped-summary bugs, 3 more band-role misuses fixed, 2 canon English violations fixed via new EN strings, 2 fabricated a11y claims fixed, 7 vspecs added, floors recalibrated from QUIET measures only (agents' fail readings were load-contaminated — always re-measure quiet before lowering). Remaining bench red: token-confidence (wave 4).
- 2026-07-10: **WAVE 3 DONE + GATED** (c05828e, 118 files): dot+bar+band, 26 charts. Key: icon-array page re-authored from truncation; forecast-cone dead `widening` feature wired; ~30 more placeholder snippets found+fixed; **oxfmt was corrupting mdx template literals (`*`/`_` escaped) — `*.mdx` now in .prettierignore, 5 pages repaired**; netFlow plural fix; quadrant-dot floor 15. Bench red: token-confidence only.
- 2026-07-10: **WAVE 4 LAUNCHED**: text (4) + connector (3) — final 7 charts, one agent.
- Post-wave-4 queue (Phase 3 harden + deliverables): webkit/firefox smoke (playwright projects behind env flag), RTL check (delta + readout chips), final quiet bench + full gates, compile candidates report + changelog + final audit table scores, STATUS.md + plan/12 entries, memory update, final happiness scoring + sign-off. Argos baseline approval = CI-only (documented constraint).
- 2026-07-10: **CHECKPOINT 2 PASSED** (user approved span standard + scale-out). `audit/FAMILY-BRIEF.md` = canonical agent instructions. Wave plan (≤3 concurrent, agents NEVER touch shared files or run build/bench/size/craft — orchestrator gates between waves): W1 strip+profile+radial (RUNNING) · W2 glyph+grid+line · W3 dot+bar+band · W4 text+connector. Orchestrator gate per wave: pnpm check, build, craft, size, quiet bench, playwright visual specs, docs test+build, apply agent-proposed shared-file diffs, spot-check pages in preview, commit per family.
