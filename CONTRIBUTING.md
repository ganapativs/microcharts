# Contributing to microcharts

Thanks for your interest. microcharts is a small, opinionated library — the bar for what ships is high, and that is
deliberate. This guide keeps contributions fast to review and consistent with the plan.

## Ground rules (non-negotiable)

These are CI-enforced and reviewers will not waive them:

1. **Zero runtime dependencies.** `dependencies` stays `{}`. React is a peer. Scales, paths, stats, color, summaries —
   all in-house.
2. **Budgets are gates.** ≤ 2 kB gzip per chart subpath (Sparkline ≤ 1 kB), ≤ 10 kB whole library, ≤ 6 SVG nodes for a
   typical chart.
3. **Static-first.** Default exports are hook-free, listener-free, pure SVG — RSC-safe and SSR-static.
   Interactivity/animation live only in `client.tsx` entries. Never blur that line.
4. **Accessible by default.** Every chart is `role="img"` with a `<title>`, named by its auto-generated summary; an
   explicit `id` opts into `<title>/<desc>` + `aria-labelledby`, and `summary={false}` makes it decorative.
5. **One grammar.** Same prop name = same meaning on every chart. New data shape = new component, not an option bag.

The full rationale lives in [`CLAUDE.md`](./CLAUDE.md) — the working contract for this repo, and the place to read
before working in an area. If code and contract disagree, raise it in an issue; don't silently diverge.

## Setup

```bash
pnpm install
pnpm check      # typecheck + lint + format + test + knip
pnpm build      # tsdown → dist/
```

Node ≥ 20, pnpm (see `packageManager` in `package.json`).

## Workflow

1. Open an issue first for anything non-trivial — especially **new chart types**, which must clear the admission bar
   (unique data story, honest encoding, readable at ≤ 200×60 px, no training needed). See "Not shipped (by design)" in
   `CLAUDE.md`.
2. Branch from `main`. Keep PRs focused.
3. Run `pnpm check` before pushing (git hooks run a subset automatically).

## Commit style — Conventional Commits

Format: `type(scope): subject` — subject ≤ 50 chars, imperative mood. Add a body only when the _why_ isn't obvious.
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore`.

```
feat(sparkline): add band variant
fix(scale): clamp domain when all values equal
```

Releases are automated via [changesets](https://github.com/changesets/changesets): run `pnpm changeset` and describe the
change for the changelog.

## Definition of Done — per chart

A chart is not done until (the full bar lives in `CLAUDE.md`, "Quality bar"):

- [ ] Static + interactive entries, shared grammar props
- [ ] Shared edge-case fixture suite green (empty, single point, all-equal, nulls, all-null, negatives, NaN/±Infinity —
      documented behavior)
- [ ] Property tests for its math
- [ ] axe clean; auto-summary correct for its data shape
- [ ] Visual baselines approved (light/dark × presets)
- [ ] Size-budget entry; bench scenario
- [ ] Doc page with the 4 contexts (sentence / cell / KPI card / tab)
- [ ] Same PR updates: catalog row + gallery renderer + spec schema + summary template + this checklist

## Reporting bugs

Use the issue templates. For rendering bugs, include the `data`, props, React version, and the produced SVG if you can.
Edge-case data bugs (nulls, NaN, degenerate series) are especially welcome — hardening against them is a goal.

By contributing you agree your work is licensed under the project's [MIT license](./LICENSE).
