# STATUS — execution tracker

> **Single source of truth for what's done.** Mirrors the step IDs in [10-roadmap.md](10-roadmap.md).
> Update this file in the **same commit** as the work it tracks. Roadmap = the plan (stable); STATUS = live progress.
> Last updated: **2026-07-06** (Phase 2 complete · plan/20 discoverability integrated → new step 3.5) · Env: node 24.18, pnpm 11.10.0 (this repo) · Git: **pushed** to `github.com/ganapativs/microcharts` (**private**), branch `main`. CI green.
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

**Phases 0 + 1 + 2 COMPLETE.** Checkpoints 0, 1, 2 all passed. Phase 2 shipped the five charts each with static + `/interactive` entries, SparkGroup shared scale, and the bench harness — 167 tests, `pnpm check`/size/publint/attw/visual/RSC all green.

**Phase 3 largely done (2026-07-07):** `apps/docs` Fumadocs site is built, browser-verified, `pnpm --filter @microcharts/docs build` (static export, 54 pages) + docs tests green; discoverability P0 (3.5) wired from the first route (plan/20 metadata contract, JSON-LD, llms/catalog, OG, sitemap/robots). **Remaining in Phase 3:** Storybook 10 workshop (3.1, deferred — docs `LiveDemo` covers previews), README pitch + npm homepage→docs (3.3/plan/20 §10), changesets releases (3.4), then Checkpoint 3 (cold-dev testing). Argos visual baselines recorded (build #1, 2026-07-06); the Delta glyph fix will legitimately update the Delta baseline on the next run.

**Phase-2 deferred (documented, not blocking Phase 3):** doc *pages* land with Fumadocs in Phase 3 (compiled 4-context examples seeded in `tests/visual/*.spec.ts` + `bench/demo.mjs`); bench **competitor matrix** deferred to launch prep (not competing pre-1.0).

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

## Phase 2 — The proving five `[x]`

| Step | State | Note |
|---|---|---|
| 2.1 `<Sparkline>` | [◐] | **Code-complete.** `src/charts/sparkline/{geometry,index,client}.tsx` — line/smooth/step, fill (zero-anchored), band, dots (auto/minmax/none), label, annotations, color, format. Static RSC + `/interactive` (keyboard+pointer nav, live region). Subpath exports + tsdown/knip entries. Tests: geometry edge+property, static attribute+axe+summary, browser interaction (94 total green). Size gate raised to 3 kB static / 4 kB interactive (2.67/3.03 actual — see plan/07 + audit; user-approved). Visual spec `tests/visual/sparkline.spec.ts` (4 contexts + variants over the built dist); `visual.yml` → `pull_request`. **Remaining:** Argos baseline (first PR), doc page (Phase 3), bench (2.8). |
| 2.2 `<SparkBar>` (+win-loss) | [x] | `src/charts/sparkbar/` static+interactive+geometry. bar/winloss, zero-anchor, sign color, label. 22 tests. Static 2.21 kB / interactive 2.56 kB. |
| 2.3 `<Delta>` | [x] | `src/charts/delta/index.tsx` (+ `client.tsx`) — accessible inline HTML (glyph+value), double-encoded direction, polarity, `from→to`, format, non-finite guard. Static 0.81 kB / interactive 1.07 kB. |
| 2.4 `<Bullet>` | [x] | `src/charts/bullet/` static + `client.tsx` — measure + target tick + qualitative bands, auto-fit domain. Static 1.44 kB / interactive 1.9 kB. |
| 2.5 `<ActivityGrid>` | [x] | `src/charts/activity-grid/` static + `client.tsx` — grid/strip, discrete levels, total/peak summary. Static 1.56 kB / interactive 2.01 kB. |
| 2.6 Interactive entries (**all five**) | [x] | Every chart ships `client.tsx` (2026-07-06: widened from Sparkline/SparkBar-only per user). Sparkline/SparkBar: point/bar keyboard+pointer nav + live readout. Delta: `live` announce + pulse on change. Bullet: value/target readout on hover/focus. ActivityGrid: cell hover + 2-D arrow-key nav + live readout. Browser-project tests green. |
| 2.7 `SparkGroup` shared scale | [x] | `src/shared/SparkGroup.tsx` — hook-free/Context-free (RSC-safe) `cloneElement` domain+size injection; child explicit props win. 5 tests. |
| 2.8 Bench suite v1 | [x] | `bench/run.mjs` — reproducible core+SSR throughput (500 rows → SVG in 5.3 ms) + `results.json`. **Competitor matrix explicitly deferred to launch prep** (not competing pre-1.0 — user call 2026-07-06); the harness slot stays documented in `bench/run.mjs` + plan/07 §3. |
| ✋ Checkpoint 2 | [x] | **Passed 2026-07-06.** Demo published as an Artifact (`bench/demo.mjs`, `pnpm demo`): 4 contexts, all five + variants, 60-row shared-scale table, size/perf receipts, light/dark. Budgets verified programmatically (all size gates green, 500-row SSR 5.3 ms ≪ 50 ms); user directed phase close. Design iteration continues in Phase 3 docs work. |

## Phase 3 — Docs & polish `[ ]`

| Step | State | Note |
|---|---|---|
| 3.1 Docs site | [x] | **Fumadocs 16.10 + Next 16 (static export)** at `apps/docs` — independently deployable to Cloudflare Workers Static Assets (`wrangler.jsonc`), Vercel, or any CDN. Custom "editorial instrument" design (Instrument Serif + Hanken Grotesk + JetBrains Mono, matte light/dark palette, does NOT feel like stock Fumadocs). Landing (hero + falsifiable bench number + live interactive charts), gallery, live-prop `LiveDemo` (Preview/Code toggle, Shiki). Static Orama search. Browser-verified light/dark + mobile. |
| 3.2 A11y page, theming guide, chooser, design notes | [x] | `content/docs/{accessibility,theming,chooser,design-notes,performance,ai}.mdx` + 5 chart pages + quickstart. Summaries quote REAL `describeSeries` output. Design notes keep principles silent (no Tufte name-drop). |
| 3.3 LLM + registry surface (plan/20 §5/§10) | [x] | Curated `/llms.txt` (with "does not support" notes, links resolve to `.md` mirrors), `/llms-full.txt`, markdown mirrors (`/llms.mdx/docs/.../content.md`), generated `/microcharts.catalog.json` (validated against `package.json#exports` by `catalog.test.ts`). npm keywords/homepage still the pre-release stub (README pitch pending). |
| 3.4 v0.x releases via changesets | [ ] | Blocked on 0.3 changesets init. |
| 3.5 Discoverability P0 gate (plan/20 §15/§17) | [x] | `docsMeta()` on every route, JSON-LD (WebSite/SoftwareSourceCode/Breadcrumb/TechArticle), `sitemap.xml`/`robots.txt`, per-page OG (`fumadocs-ui/og`) + on-brand default `/og/default.png`, static-export-safe. `metadata.test.ts` asserts canonical/title/description/og:image/JSON-LD/h1/noindex on the built HTML (plan/20 §11). Domain swappable via `NEXT_PUBLIC_SITE_URL` (`lib/site.ts`) — `microcharts.dev` still unregistered. |
| ✋ Checkpoint 3 | [ ] | Cold-dev testing; API freeze for 1.0. **+ plan/20 §17 discoverability DoD green.** |

**Phase-2 bugfix folded in (2026-07-07):** Delta's "up" glyph pointed **down** (both up/down paths shared the same 3 vertices) — a violation of the honest double-encoding non-negotiable, caught while building the docs. Fixed `src/charts/delta/index.tsx` GLYPH.up → `M5 3 L9 9 L1 9 Z`; added a semantic direction regression test. Delta's Argos baseline will change (correctly) on next visual run.

**Design overhaul (3.1, 2026-07-07, second feedback round):** reworked the whole visual system per user feedback (fonts read AI, dark blue boring, no accent control, generic mark, boring hero, playground bugs, Fumadocs feel). Now: **Fraunces + Instrument Sans + JetBrains Mono**; single `--accent` token + **global accent picker** (6 non-AI presets, persisted, retunes chrome + charts + shader); new **Brandmark** (favicon/apple/OG); zero-dep WebGL **HeroShader** (theme/accent-aware signal-field); fixed Playground (Shiki-highlighted code, no overflow/overlap); **interactive demo on every chart page**; de-Fumadocs prose/titles (Fraunces), fixed the mobile docs header overlap (RouteTransition broke the sticky grid + breadcrumb collision); marketing route-fade transitions. Full spec in memory `docs-site-design-system` / `docs-site-architecture`; CLAUDE.md docs section updated. All browser-verified light+dark × mobile/desktop; `pnpm --filter @microcharts/docs build` green.

**Workshop decision (3.1):** shipped an **in-docs interactive Playground** (prop controls → live chart + live code readout, `src/components/charts/playground.tsx`) instead of a standalone **Storybook 10** — per the user's "Fumadocs supports components / maybe don't need Storybook" steer, keeping the workshop inside the already-deployable docs with zero extra deps. Standalone Storybook 10 (visual-test workshop + theme/viewport matrix) remains available as a plan item if a dedicated tool is later wanted; the library's axe DoD is already met by unit tests (`src/test/a11y.ts`).

## Phase 4 — Launch `[ ]`
Not started. `1.0.0` → Show HN → dev.to → awesome-lists → PH. **Pre-flight = plan/20 §14 P0 checklist; launch-week P1 items ride 4.2–4.5; analytics cadence per §13. Deferred bench competitor matrix lands here (comparison pages need measured data — plan/20 §9).**

## Phase 5+ — Catalog / universal rendering / AI-native / decision / frontier / expressive `[ ]`
Not started. Post-launch, demand-ordered. See [10-roadmap.md](10-roadmap.md) §5–5c, [13](13-universal-rendering.md)/[14](14-ai-native.md)/[15](15-expressive-charts.md)/[16](16-decision-micrographs.md)/[17](17-frontier-charts.md).

---

## Session decisions folded into the plan (2026-07-06)

Tooling shifts + new decision docs added this session (full provenance in [12-research-audit.md](12-research-audit.md)):
- Docs **Starlight → Fumadocs**; workshop **Ladle → Storybook 10**; **+@vitest/browser** project; **+knip** gate; oxfmt kept.
- New: [18-text-labeling.md](18-text-labeling.md) (numeric-anchor labels), [19-css-delivery.md](19-css-delivery.md) (one layered `styles.css`).
- Env: pnpm 11 per-repo via corepack (`packageManager` field); repo settings in `pnpm-workspace.yaml`.
- 0.3/0.4 devDeps added: `@changesets/cli`, `axe-core`, `@axe-core/playwright`, `@playwright/test`, `@argos-ci/playwright`. New config: `.changeset/`, `renovate.json`, `release.yml`, `visual.yml`, `playwright.config.ts`, `src/test/a11y.ts`, `fixtures/`.
