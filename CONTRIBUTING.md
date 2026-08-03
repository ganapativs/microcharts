# Contributing to microcharts

microcharts is a small, opinionated library with one maintainer. The catalog covers a lot of ground at 106 chart types,
the grammar is shared across all of them, and every prop is public surface that ships forever and costs bytes inside a
CI-gated budget. So the library grows slowly and deliberately, and this guide says how.

Bug reports and bug fixes are the most useful thing you can send.

## What the project takes

Roughly in order of how readily it lands:

| Contribution                                                                                    | Where it stands                                                            |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Bug fixes in existing charts** — wrong rendering, broken a11y, edge-case data, contract drift | Most welcome. Open an issue with a repro, then fix it.                     |
| **Improvements to existing charts** — legibility, containment, summary wording, size reductions | Welcome once an issue agrees the current behavior is a real problem.       |
| **Docs corrections** — a wrong number, a broken link, a snippet that doesn't compile, a typo    | Welcome. Small ones need no issue.                                         |
| **Tests, tooling, CI** — a missing guard for a bug that shipped, a flaky test, a slow job       | Welcome once an issue agrees on the approach.                              |
| **New props, options, or variants on an existing chart**                                        | Case by case. Bring the use case to an issue and we'll work out the shape. |
| **New chart types**                                                                             | Open, but held to a high bar — see below.                                  |

"Improvement" means a fix to something the library gets wrong today, not an addition. Refactors that only move code
around, style rewrites, dependency swaps, and mass find-and-replace changes usually aren't worth the review and the size
re-baseline, so raise them in an issue before spending time on one.

## Discuss in an issue first

**Every PR needs an issue, and the issue needs an explicit yes from the maintainer before you open the PR.** Not a
formality: the issue is where the shape gets decided, and deciding it in a diff wastes your time far more than it wastes
anyone else's.

Two exceptions, both narrow:

- A docs typo, broken link, or a factually wrong number you can point at.
- A bug you filed yourself, with a repro, where the fix is small and obvious.

A PR that arrives with no agreed issue gets sent back to the issue stage rather than reviewed, however good the code is.
The scope decision comes before the implementation, and it's your time that gets wasted when it doesn't.

Use the issue forms:

- [Bug — library](https://github.com/ganapativs/microcharts/issues/new?template=01-bug-library.yml)
- [Bug — MCP server](https://github.com/ganapativs/microcharts/issues/new?template=02-bug-mcp.yml)
- [Bug — docs](https://github.com/ganapativs/microcharts/issues/new?template=03-bug-docs.yml)
- [Accessibility](https://github.com/ganapativs/microcharts/issues/new?template=04-accessibility.yml)
- [New chart type](https://github.com/ganapativs/microcharts/issues/new?template=05-chart-proposal.yml)
- [Feature / capability](https://github.com/ganapativs/microcharts/issues/new?template=06-feature-request.yml)

Open-ended questions ("which chart should I use?", a half-formed idea) belong in
[Discussions](https://github.com/ganapativs/microcharts/discussions).

## New features start with the use case

A new prop is not a small change here. It joins a grammar shared by 106 charts, so it has to mean the same thing on all
of them or it breaks the one property that lets a model write charts it has never seen. It ships forever under semver.
It adds bytes to a subpath whose gzip ceiling is measured and enforced. It multiplies the edge-case matrix every chart
is tested against.

So the useful thing to bring to the issue is the use case, not the API. Lead with what you're trying to do and where the
library gets in your way. Often it turns out to be reachable already — an existing prop used differently, a
`<Threshold>` or `<Marker>` annotation, a `--mc-*` token, a `defineTheme` accent, or a few lines in your own app. When
it isn't, the issue is where the shape gets worked out, and a prop that carries its weight across the whole catalog can
land.

A few things are out by design rather than by omission: option-bag props, per-chart escape hatches, arbitrary
`data-*`/`aria-*`/`ref` passthrough, and axes, legends, or gridlines.

## New chart types are open, at a high bar

The catalog is not closed. It is also broad, so we refrain from adding a type unless there's a real question it answers
that the existing 106 can't — microcharts prefers uncommon questions over uncommon shapes. A proposal has to clear the
admission bar and be worth its permanent cost in tests, docs, bytes, and visual baselines:

- Reads at ≤ 200×60 px, and degrades sensibly below that.
- Answers a practical decision no existing chart answers well.
- Has one honest primary encoding channel, lie factor = 1.
- Readable without training — no legend, no axes, no key.

Say which existing chart you'd reach for today and what it loses. That one paragraph decides most proposals, in either
direction, and it's worth writing carefully.

Pie, needle gauges, battery, waffle, and violin are excluded on purpose: each fails at micro scale or on the
honest-encoding bar, and each has a strictly better in-catalog replacement (Bullet for gauges, SegmentedBar for pie,
MicroBox for violin). See "Not shipped (by design)" in [`CLAUDE.md`](./CLAUDE.md).

Once a proposal is agreed, the chart lands in **one PR** with everything in the Definition of Done below.

## Ground rules (CI-enforced)

Reviewers do not waive these:

1. **Zero runtime dependencies.** `dependencies` stays `{}`, forever. React is the only peer. Scales, paths, stats,
   color, easing, formatting, and summaries are all in-house. Any new _dev_ dependency has to be actively maintained.
2. **Budgets are gates.** Each of the 216 measured subpaths carries its own gzip ceiling in `scripts/size-budgets.json`;
   `pnpm size` enforces every one. `styles.css` has a single 12 kB ceiling for the whole library. A **new** chart is
   held to ≤ 3 kB static and static + 3.25 kB interactive. **No interactive subpath crosses 7 kB** — that wall is hard
   and no sign-off raises it; the static ceiling is 4.35 kB. The interactive allowance looks wide because size-limit
   bundles every subpath standalone and so charges each one the whole shared picker kernel — see `$ceilings` in
   `scripts/size-budgets.json`.
3. **No silent growth.** Separately from the ceilings, every PR is diffed against its base branch:
   `scripts/size-snapshot.json` records the measured bytes of all 216 subpaths, and **more than 1% growth on any subpath
   fails**. Regenerate with `pnpm build && pnpm size:snapshot`, and label the PR `size-increase-approved` when the
   increase is deliberate and agreed.
4. **Static-first.** Default exports are hook-free, listener-free, observer-free pure SVG — RSC-safe and SSR-static.
   Interactivity and animation live only in `'use client'` entries, and an interactive entry **composes** its static
   twin rather than re-implementing the SVG.
5. **Accessible by default.** Every chart is `role="img"` with a `<title>`, named by its generated summary; an explicit
   `id` opts into `<title>/<desc>` + `aria-labelledby`, and `summary={false}` makes it decorative. Direction and state
   are never color-alone. Every user-visible string goes through `SummaryStrings`.
6. **One grammar.** The same prop name means the same thing on every chart. A new data shape is a new component, not an
   option bag.
7. **Generated files are never hand-edited.** `pnpm gen:all` regenerates all of them in order; `pnpm gen:check` is a
   pre-push hook and a CI step, so a stale generated file cannot reach `main`.

The full rationale lives in [`CLAUDE.md`](./CLAUDE.md) — the working contract for this repo, and what to read before
touching an area. If code and contract disagree, say so in an issue rather than diverging quietly.

## Setup

```bash
pnpm install
pnpm check      # typecheck + lint + format:check + test + knip
pnpm build      # tsdown → dist/
```

Node ≥ 20, pnpm from `packageManager` in `package.json` (`corepack enable pnpm`).

The extra gates, all of which run in CI:

```bash
pnpm craft && pnpm robust && pnpm floor
pnpm size          # per-subpath gzip budgets, needs a build first
pnpm gen:check     # every generated file still matches its generator
```

Docs consume the built library, so build it before running or building the site (`pnpm build:site` does both).

## Workflow

1. Find or open the issue. Wait for the go-ahead.
2. Branch from `main`. One concern per PR.
3. Run `pnpm check`, `pnpm build`, `pnpm craft && pnpm robust && pnpm floor`, and `pnpm size` before pushing. Git hooks
   run a subset automatically.
4. Run `pnpm gen:check` if you touched anything generated, and `pnpm format:md` if you touched Markdown.
5. Add a changeset (`pnpm changeset`) unless the change is docs- or CI-only. Select `@microcharts/mcp` as well when the
   diff touches `packages/mcp` — a chart edit regenerates the embedded catalog, and without that second selection npm
   keeps serving the old snapshot. Both packages then publish from this one PR.
6. Fill in the PR template, including the linked issue.

## Commit style — Conventional Commits

Format: `type(scope): subject` — subject ≤ 50 chars, imperative mood. Add a body only when the _why_ isn't obvious.
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci`, `chore`.

```
fix(scale): clamp domain when all values equal
docs(theming): correct the density token default
```

Releases are automated with [changesets](https://github.com/changesets/changesets): `pnpm changeset`, then describe the
change as a consumer of the package would read it.

## Definition of Done — per chart

For an agreed new chart, or a change that reshapes an existing one (the full bar is in `CLAUDE.md`, "Quality bar"):

- [ ] Static + interactive entries, shared grammar props; the interactive entry composes the static one
- [ ] `geometry.ts` pure and React-free, with property tests for its math
- [ ] Edge-case fixtures green: empty · single point · all-equal · nulls · all-null · negatives · NaN/±Infinity
- [ ] Nothing paints outside the viewBox — containment test included
- [ ] An inline `seat` emitted from geometry (`floor` vs `center` chosen deliberately, plot box not data bbox)
- [ ] axe clean; generated summary correct for the data shape; readout chip matches what it announces
- [ ] Visual baselines approved (light/dark × presets)
- [ ] Same PR updates `package.json#exports`, the `tsdown` entries, `scripts/size-budgets.json` (regenerated), the
      catalog and gallery rows, the summary template, the doc page, and a bench scenario
- [ ] Same PR carries changesets for both `@microcharts/react` and `@microcharts/mcp` (the new chart lands in the MCP
      server's embedded catalog, and only a changeset publishes it)

## Reporting bugs

This is where outside help pays off most, because you run stacks and data the maintainer doesn't.

Use the issue forms, and for a rendering bug include the `data`, the props, your React version, and the produced SVG if
you can get it. Edge-case data bugs — nulls, NaN, ±Infinity, all-equal values, degenerate series, hostile config values
— are especially welcome; hardening against them is a standing goal.

Never open a public issue for a security problem. Report it privately through [SECURITY.md](./SECURITY.md).

By contributing you agree your work is licensed under the project's [MIT license](./LICENSE).
