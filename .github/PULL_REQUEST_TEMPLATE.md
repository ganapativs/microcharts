<!-- Keep PRs focused: one concern each. Delete sections that don't apply. -->

## What & why

<!-- One or two sentences. Lead with the user-visible effect, not the diff. -->

Closes #

<!-- Every PR starts as an issue that already has a yes. The only exceptions are a docs typo / broken
     link / wrong number, and a small obvious fix for a bug you filed yourself with a repro. Without one
     the PR goes back to the issue stage rather than review — see CONTRIBUTING.md. -->

- [ ] The linked issue was agreed before I wrote this — or this is one of the two documented exceptions

## Type

- [ ] Fix — behaviour was wrong
- [ ] Feature — new capability or prop
- [ ] New chart type
- [ ] Docs / examples
- [ ] Refactor / perf / internal
- [ ] Build, CI, or tooling
- [ ] Breaking change <!-- if ticked, fill in Migration below -->

## Surfaces touched

- [ ] `src/` — the library (`@microcharts/react`)
- [ ] `packages/mcp` — MCP server / AI-SDK tools
- [ ] `apps/docs` — docs site
- [ ] `examples/`
- [ ] `scripts/`, `tests/`, `bench/`, CI

## Gates

<!-- These mirror the CI jobs. Run them locally; a red box here is a red PR. -->

- [ ] `pnpm check` (typecheck · lint · format:check · test · knip)
- [ ] `pnpm build` succeeds
- [ ] `pnpm craft && pnpm robust && pnpm floor`
- [ ] `pnpm size` — every subpath inside its budget
- [ ] Tests added or updated for the change (node/jsdom for math + static SVG, browser project for interactive)
- [ ] Zero new runtime dependencies (`dependencies` still `{}`); any new dev dep is actively maintained
- [ ] Conventional Commit subject ≤ 50 chars
- [ ] `pnpm changeset` added — or this is docs/CI-only and needs no release

## Contract check

<!-- The non-negotiables from CLAUDE.md. Tick what applies; explain any deliberate exception. -->

- [ ] Static entries stay hook-free, listener-free, observer-free, RSC-safe — interactivity only in `'use client'`
      entries
- [ ] Interactive entry **composes** the static component; geometry is shared, not re-implemented
- [ ] One grammar — reused prop names keep their existing meaning across charts
- [ ] Nothing paints outside the viewBox (containment test covers it)
- [ ] Accessible name / summary correct; direction and state are never colour-alone
- [ ] Any user-visible string goes through `SummaryStrings` — no hardcoded English outside `EN`
- [ ] Formatting goes through `makeFormatter`; no `new Intl.NumberFormat` in a component
- [ ] ES2022 floor respected (no `toSorted` / `toReversed` / friends)

<details>
<summary><b>New or changed chart</b> — per-chart Definition of Done</summary>

- [ ] Static + interactive entries, shared grammar props
- [ ] `geometry.ts` pure and React-free; property tests for its math
- [ ] Edge-case fixtures green: empty · single point · all-equal · nulls · all-null · negatives · NaN/±Infinity
- [ ] Inline `seat` emitted from geometry (`floor` vs `center` chosen deliberately, plot box not data bbox)
- [ ] axe clean; auto-summary correct for the data shape
- [ ] Visual baselines approved (light/dark × presets)
- [ ] Same PR updates: `package.json#exports` · `tsdown` entries · `scripts/size-budgets.json` (regenerated, never
      hand-edited) · catalog + gallery rows · summary template · doc page · bench scenario

</details>

<details>
<summary><b>Size budget moved</b></summary>

<!-- Only if a budget went up. size-limit measures each subpath standalone, so shared-kernel work
     can add bytes to many entries at once. State the before/after and why the growth is earned. -->

- [ ] `scripts/size-budgets.json` re-baselined and `.size-limit.json` regenerated (`pnpm size:gen`)
- [ ] `pnpm size:sync` run so docs/README numbers match the build
- Before → after:
- Why it's justified:

</details>

<details>
<summary><b>MCP change</b></summary>

- [ ] Tool schemas and descriptions still match the shipped library (catalog regenerated if exports changed)
- [ ] `pnpm --filter @microcharts/mcp test` passes; `publint` + `attw` clean
- [ ] README and docs MCP pages updated; the docs-surface guard test passes

</details>

<details>
<summary><b>Docs change</b></summary>

- [ ] Every example is a real compiled component (docs-as-tests) — no snippets that don't build
- [ ] Quoted `describeSeries` output is the actual generated string
- [ ] Numbers come from the generated facts, not typed by hand
- [ ] `/llms.txt`, `/llms-full.txt`, `/catalog.json` still in sync with `package.json#exports`
- [ ] Markdown formatted (`pnpm format:md`)

</details>

<details>
<summary><b>Breaking change</b> — migration</summary>

<!-- What breaks, who it affects, and the exact before/after a consumer must write. -->

</details>

## Screenshots / evidence

<!-- Visual change: before and after, light and dark. Argos will diff the baselines too.
     Perf claim: paste the bench output — no hand-waved numbers. -->
