# Superaudit 2026-07-10 — mission tracker

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
