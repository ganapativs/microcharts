# STATUS — execution tracker

> **Single source of truth for what's done.** Mirrors the step IDs in [10-roadmap.md](10-roadmap.md).
> Update this file in the **same commit** as the work it tracks. Roadmap = the plan (stable); STATUS = live progress.
> Last updated: **2026-07-06** (Phase 2 — all five + group + bench) · Env: node 24.18, pnpm 11.10.0 (this repo) · Git: **pushed** to `github.com/ganapativs/microcharts` (**private**), branch `main`. CI green.
> CI matrix is Node **22/24** only (pnpm 11 needs Node ≥22 via `node:sqlite`; Node 20 EOL). Published artifact stays node-20-safe (`engines: >=20`).
>
> **Account-gated setup still pending (one-time, not code):** npmjs.org Trusted Publisher for `@microcharts/react` (release.yml uses OIDC, no token); `ARGOS_TOKEN` repo secret (visual.yml). Both needed before their workflows actually publish/upload.

**Legend:** `[x]` done · `[◐]` partial (see note) · `[ ]` not started

## How the next agent uses this

1. Read this file first — the **Current position** block says where to start.
2. Each step links to its roadmap ID and, if done, the files that satisfy it.
3. When you finish work: tick the box, add a one-line note + file refs, bump *Last updated*, and adjust **Current position**.
4. Tooling/plan divergences are logged in [12-research-audit.md](12-research-audit.md) — not here. This file tracks *state*, not *decisions*.

---

## Current position

**Phases 0 + 1 COMPLETE.** Checkpoint 0 + Checkpoint 1 passed.

**Phase 2 CODE-COMPLETE (all five + group + bench).** 2.1–2.8 built to DoD: five charts, interactive entries (Sparkline/SparkBar), SparkGroup shared scale, bench harness. **175 tests green** (node + browser), `pnpm check` exit 0, all size gates pass, RSC Checkpoint 1 still green. Checkpoint-2 demo shipped as a published Artifact (regenerable via `pnpm demo` → `bench/demo.mjs`).

**Immediate next: ✋ Checkpoint 2 sign-off, then Phase 3 (docs & polish).** Before Phase 3: (a) open a PR so Argos records the first visual baselines (specs live in `tests/visual/`, ARGOS_TOKEN set); (b) decide whether to build the competitor bench matrix (Recharts/Chart.js/MUI X/uPlot/@fnando) now or at launch.

**Phase-2 deferred (documented, not blocking Phase 3):** interactive entries for Delta/Bullet/ActivityGrid (roadmap 2.6 scopes interactive to Sparkline/SparkBar — the other three are static-only for v1); doc *pages* land with Fumadocs in Phase 3 (compiled 4-context examples seeded in `tests/visual/*.spec.ts` + `bench/demo.mjs`); competitor bench matrix (harness + our numbers done; competitor slots are TODO in `bench/run.mjs`).

Pending one-time account setup (unblocks release/visual workflows): npmjs Trusted Publisher for `@microcharts/react`, `ARGOS_TOKEN` secret.

---

## Phase 0 — Foundations

| Step | State | Note |
|---|---|---|
| 0.1 Name & identity | [x] | Brand `microcharts`; `@microcharts/react@0.0.1` placeholder live; orgs owned. Pre-session. |
| 0.2 Repo scaffold | [x] | `package.json` (ESM-only, `dependencies:{}`, exports skeleton), `tsconfig.json` (TS6 strict), `tsdown.config.ts`, `LICENSE` (MIT), `CODE_OF_CONDUCT.md` (Covenant 3.0), `CONTRIBUTING.md`, `.github/` health files, `src/` skeleton, `styles.css`. |
| 0.3 CI skeleton | [x] | `ci.yml` (quality job + React 18/19 × Node 20/22/24 matrix, size-limit, publint, attw, knip); **changesets** init (`.changeset/config.json`, access public, scripts version/release); **Renovate** (`renovate.json`, validated); **release workflow** (`release.yml`, OIDC trusted publishing + provenance). ⏳ one-time: npmjs Trusted Publisher setup. |
| 0.4 Quality scaffolding | [x] | Vitest two-project (node + `@vitest/browser`), fast-check, knip, size-limit, attw; **axe-core harness** (`src/test/a11y.ts`); **Playwright + Argos** visual config (`playwright.config.ts`) + pinned-Docker `visual.yml`. Fixtures (Next RSC + Vite) intentionally deferred to Phase 1 — `fixtures/README.md` (need a component to render). ⏳ one-time: `ARGOS_TOKEN` secret. |
| ✋ Checkpoint 0 | [x] | **Passed.** Private repo pushed; CI green (quality + Node 22/24 × React 18/19); Release workflow green (no-op); publint/attw/`npm publish --dry-run` clean. |

## Phase 1 — Core kernel `[ ]`

| Step | State | Note |
|---|---|---|
| 1.1 `core/{scale,path,stats,bank}.ts` | [x] | + `color.ts`, `types.ts`. Pure, property-tested (fast-check) + full edge matrix — 50 tests green. `describeSeries` exported at root. |
| 1.2 `core/summary.ts` (describeSeries) | [x] | S1 shape (trend %/range/last), degenerate forms, `EN` templates (swappable for i18n), Intl formatting. S2–S4 land with their charts. |
| 1.3 `shared/Chart.tsx` + `styles.css` a11y blocks | [x] | Hook-free `Chart` (role=img + `<title>`/`<desc>` + aria-labelledby, decorative opt-out); `a11y.ts` id/label composition; `styles.css` reconciled to plan token names + dark/forced-colors/prefers-contrast/reduced-motion. 6 component tests. |
| 1.4 Theming (presets, MicroProvider) | [x] | `MicroProvider` (hook-free, RSC-safe): `data-mc-theme` + one-off `--mc-*` tokens. Presets modern/tufte/mono/vivid/dark as CSS token bundles. |
| ✋ Checkpoint 1 | [x] | **Passed.** `fixtures/next` (App Router, `output: export`) renders a hand-assembled `<Sparkline>` (real `Chart` + `describeSeries`) as a Server Component: static HTML carries the SVG + auto-summary, **0 client JS chunks reference the chart** (`verify-rsc.mjs`, wired as CI `rsc` job). |

## Phase 2 — The proving five `[◐]`

| Step | State | Note |
|---|---|---|
| 2.1 `<Sparkline>` | [◐] | **Code-complete.** `src/charts/sparkline/{geometry,index,client}.tsx` — line/smooth/step, fill (zero-anchored), band, dots (auto/minmax/none), label, annotations, color, format. Static RSC + `/interactive` (keyboard+pointer nav, live region). Subpath exports + tsdown/knip entries. Tests: geometry edge+property, static attribute+axe+summary, browser interaction (94 total green). Size gate raised to 3 kB static / 4 kB interactive (2.67/3.03 actual — see plan/07 + audit; user-approved). Visual spec `tests/visual/sparkline.spec.ts` (4 contexts + variants over the built dist); `visual.yml` → `pull_request`. **Remaining:** Argos baseline (first PR), doc page (Phase 3), bench (2.8). |
| 2.2 `<SparkBar>` (+win-loss) | [x] | `src/charts/sparkbar/` static+interactive+geometry. bar/winloss, zero-anchor, sign color, label. 22 tests. Static 2.21 kB / interactive 2.56 kB. |
| 2.3 `<Delta>` | [x] | `src/charts/delta/index.tsx` — accessible inline HTML (glyph+value), double-encoded direction, polarity, `from→to`, format. 8 tests. 0.78 kB. Static-only per 2.6 scope. |
| 2.4 `<Bullet>` | [x] | `src/charts/bullet/` — measure + target tick + qualitative bands, auto-fit domain. 14 tests. 1.44 kB. Static-only. |
| 2.5 `<ActivityGrid>` | [x] | `src/charts/activity-grid/` — grid/strip, discrete levels, total/peak summary. 14 tests. 1.56 kB. Static-only. |
| 2.6 Interactive entries (Sparkline, SparkBar) | [x] | Both `client.tsx`: keyboard (arrows/Home/End/Esc) + pointer nav, roving-focus overlay, polite live readout. Browser-project tests green. |
| 2.7 `SparkGroup` shared scale | [x] | `src/shared/SparkGroup.tsx` — hook-free/Context-free (RSC-safe) `cloneElement` domain+size injection; child explicit props win. 5 tests. |
| 2.8 Bench suite v1 | [◐] | `bench/run.mjs` — reproducible core+SSR throughput (500 rows → SVG in 5.3 ms) + `results.json`. **Competitor matrix (Recharts/Chart.js/MUI X/uPlot/@fnando) is a TODO** — separate isolated-workspace harness, tracked for launch. |
| ✋ Checkpoint 2 | [◐] | Demo built + published as an Artifact (`bench/demo.mjs`, `pnpm demo`): 4 contexts, all five + variants, 60-row shared-scale table, size/perf receipts, light/dark. **Awaiting human feel/budget sign-off.** |

## Phase 3 — Docs & polish `[ ]`

| Step | State | Note |
|---|---|---|
| 3.1 Docs site | [ ] | **Fumadocs** (React-native) + live-prop demos; **Storybook 10** workshop. (Reversed from Starlight/Ladle — see audit.) |
| 3.2 A11y page, theming guide, chooser, design notes | [ ] | |
| 3.3 llms.txt, README pitch + comparison table | [◐] | README is a pre-release stub; pitch/comparison not written. |
| 3.4 v0.x releases via changesets | [ ] | Blocked on 0.3 changesets init. |
| ✋ Checkpoint 3 | [ ] | Cold-dev testing; API freeze for 1.0. |

## Phase 4 — Launch `[ ]`
Not started. `1.0.0` → Show HN → dev.to → awesome-lists → PH.

## Phase 5+ — Catalog / universal rendering / AI-native / decision / frontier / expressive `[ ]`
Not started. Post-launch, demand-ordered. See [10-roadmap.md](10-roadmap.md) §5–5c, [13](13-universal-rendering.md)/[14](14-ai-native.md)/[15](15-expressive-charts.md)/[16](16-decision-micrographs.md)/[17](17-frontier-charts.md).

---

## Session decisions folded into the plan (2026-07-06)

Tooling shifts + new decision docs added this session (full provenance in [12-research-audit.md](12-research-audit.md)):
- Docs **Starlight → Fumadocs**; workshop **Ladle → Storybook 10**; **+@vitest/browser** project; **+knip** gate; oxfmt kept.
- New: [18-text-labeling.md](18-text-labeling.md) (numeric-anchor labels), [19-css-delivery.md](19-css-delivery.md) (one layered `styles.css`).
- Env: pnpm 11 per-repo via corepack (`packageManager` field); repo settings in `pnpm-workspace.yaml`.
- 0.3/0.4 devDeps added: `@changesets/cli`, `axe-core`, `@axe-core/playwright`, `@playwright/test`, `@argos-ci/playwright`. New config: `.changeset/`, `renovate.json`, `release.yml`, `visual.yml`, `playwright.config.ts`, `src/test/a11y.ts`, `fixtures/`.
