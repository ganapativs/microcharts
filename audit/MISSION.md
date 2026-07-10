# Superaudit 2026-07-10 — mission tracker

Prompt: full audit/rebuild/verify of all ~100 charts + docs pages. 8 dimensions (size, speed, visual, consistency, prop contract, theming, responsiveness, composability) + self-legibility + a11y + delight. Happiness 100/100 per chart + page. Hard gates: size budgets, bench no-regress, visual-regression intended-only, axe zero, tests green.

## Phases
- [ ] Phase 0 — inventory, baseline, cluster into families, audit table → `audit/BASELINE.md`, `audit/AUDIT-TABLE.md`
- [ ] Phase 1 — core-system audit (tokens/prop contract/page guideline) → `audit/FOUNDATION.md` → **CHECKPOINT: human approval before propagation**
- [ ] Phase 2 — family-by-family fix (first family = reference standard → CHECKPOINT)
- [ ] Phase 3 — harden (edge cases, sizes, backgrounds, a11y, self-legibility, weight consistency)
- [ ] Verify — matrices, harness, cross-browser, page pass
- [ ] Deliverables — changelog, candidates report, sign-off

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
