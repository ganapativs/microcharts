# STATUS — execution tracker

> **Single source of truth for what's done.** Mirrors the step IDs in [10-roadmap.md](10-roadmap.md).
> Update this file in the **same commit** as the work it tracks. Roadmap = the plan (stable); STATUS = live progress.
> Last updated: **2026-07-06** · Env: node 24.18, pnpm 11.10.0 (this repo) · Git: **pushed** to `github.com/ganapativs/microcharts` (**private**), branch `main`, 2 commits. CI green.
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

**Phases 0 + 1 COMPLETE.** Checkpoint 0 (green CI pipeline) and Checkpoint 1 (RSC-static, zero-client-JS chart, gated by the `rsc` CI job) both passed. Kernel + summary + Chart shell + theming shipped and tested (62 unit/property/component tests + the RSC gate).

**Immediate next: Phase 2 — the proving five.** Start `2.1 <Sparkline>` (line/smooth/step, fill, band, dots, labels, annotations) to the per-chart Definition of Done (plan/09). The hand-assembled fixture sparkline shows the target composition; the real component encapsulates it over the internal kernel.

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

## Phase 2 — The proving five `[ ]`

| Step | State | Note |
|---|---|---|
| 2.1 `<Sparkline>` | [ ] | + band, dots, labels, annotations. Full DoD ([09](09-testing-quality.md)). |
| 2.2 `<SparkBar>` (+win-loss) | [ ] | |
| 2.3 `<Delta>` | [ ] | |
| 2.4 `<Bullet>` | [ ] | |
| 2.5 `<ActivityGrid>` | [ ] | |
| 2.6 Interactive entries (Sparkline, SparkBar) | [ ] | |
| 2.7 `SparkGroup` shared scale | [ ] | |
| 2.8 Bench suite v1 | [ ] | vs Recharts/Chart.js/MUI X/uPlot/@fnando. |
| ✋ Checkpoint 2 | [ ] | Private 500-row demo; judge feel + budgets. |

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
