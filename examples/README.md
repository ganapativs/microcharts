# microcharts examples — visual test suite

Seven **independent** real-world apps that each install `@microcharts/react` **from npm** (`0.18.1`) and integrate it
via the [quickstart agent prompt](https://microcharts.dev/docs/quickstart). They are a **manual** visual harness: before
shipping a major change, bump the dependency to the target version (or RC), reinstall, launch all seven, and eyeball
that rendering, theming, interactivity, and the RSC/static path still behave — then take it live.

Between them the seven apps exercise **every one of the 106 chart types** in the catalog, in believable product contexts
(not a gallery) — so a rendering or API regression on any chart surfaces here.

Not part of CI. Not part of the pnpm workspace (`pnpm-workspace.yaml` globs are `.`, `apps/*`, `fixtures/*` —
`examples/` is excluded on purpose). Each app has its own `package.json` and its own `node_modules`; lockfiles are
gitignored so installs stay local to the machine. Public deploys are **`noindex`** (see [DEPLOY.md](DEPLOY.md)) — SEO /
`llms.txt` stay on the docs site.

## The apps

| #   | App                    | Stack                 | Port | What it stress-tests                                                                                                                 |
| --- | ---------------------- | --------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **pulse-analytics**    | Next.js 15 App Router | 4001 | Product analytics — interactive by default on every route; `/live` is the streaming ops island                                       |
| 2   | **ledger-finance**     | Vite + React 19       | 4002 | Interactive (hover/keyboard) + `animate` + **dark** preset, OHLC candlesticks                                                        |
| 3   | **vitals-health**      | Vite + React 19       | 4003 | Categorical `colors[]` — progress rings, macro donut, sleep hypnogram; inline stats                                                  |
| 4   | **shipyard-devops**    | Vite + React 19       | 4004 | **mono** preset, status semantics, bullet / error-budget / burn-chart, dense tables                                                  |
| 5   | **dispatch-editorial** | Vite + React 19       | 4005 | **editorial** preset, static prose-inline marks, interactive figures, `--mc-font` serif-body trap, annotations                       |
| 6   | **atlas-realestate**   | Vite + React 19       | 4006 | **vivid** preset, histogram / quadrant-dot / dumbbell / slope / percentile-ladder, dense tables                                      |
| 7   | **cortex-ai**          | Vite + React 19       | 4007 | LLM/agent eval + observability — token-confidence, calibration-strip, confusion-grid, rubric-strip, trace-fold, waveform, star-spoke |

Together they cover: **all 106 chart types**, static vs interactive entries, all five theme presets + dark +
**print/eink**, categorical palettes, inline-in-text and inline-in-table, annotations (`Threshold` / `Marker` /
`TargetZone` / `Callout`), `animate`, `format`/`domain` scaling, **picker callbacks** (`onActive` / `onSelect` /
`selectedIndex`), **`readout={false}` + `datum.formatted`**, **`SparkGroup`**, **`defineTheme` + `MicroProvider`**, and
responsive reflow (tested at 375 / 768 / 1280). Each app is a multi-section product with light+dark support.

## Feature matrix (0.18.1 coverage)

| Surface                         | pulse                        | ledger | vitals  | shipyard | dispatch             | atlas     | cortex |
| ------------------------------- | ---------------------------- | ------ | ------- | -------- | -------------------- | --------- | ------ |
| Interactive + `animate`         | ● all routes                 | ●      | ●       | ●        | ● figures            | ●         | ●      |
| Static (intentional)            |                              |        | △ prose |          | ● prose inline       |           |        |
| `onActive` / `onSelect` / pin   | ●                            | ●      | ●       | ●        | △                    | ●         | ●      |
| `readout={false}` + `formatted` | `/live` KPI wiring           | ●      | ●       | ●        | △                    | ●         | ●      |
| Inline `.mc-inline`             | tables                       | ●      | ●       |          | ●                    |           |        |
| Annotations                     | Threshold+TargetZone+Callout |        |         |          | ●                    |           |        |
| `SparkGroup`                    | engagement                   |        |         |          |                      | compare   |        |
| `defineTheme` / `MicroProvider` |                              | dark   |         | mono     |                      | vivid+ink | cobalt |
| Theme presets                   | modern                       | dark   | modern  | mono     | editorial+print+eink | vivid     | modern |
| Categorical `colors[]`          | ●                            | ●      | ●       |          | ●                    | ●         | ●      |
| `onWindowChange` (minimap)      |                              |        |         | ●        |                      |           |        |

● primary · △ present but not the stress story

## Run

```bash
cd examples/<app>
npm install                                        # resolves @microcharts/react@0.18.1 from npm
npm run dev                                        # fixed port — see table
```

Or launch any of them from the editor via the `ex-*` entries in `.claude/launch.json`.

To point the suite at a newer release or RC, bump `@microcharts/react` in each app's `package.json` (e.g. `"0.18.2"` or
`"0.13.0-rc.1"`) and re-run `npm install`.

## Deploy (Cloudflare Pages — one URL per app)

All 7 build to static assets (Vite → `dist/`, Next `output: "export"` → `out/`), so each deploys as its own Cloudflare
Pages project with its own `*.pages.dev` URL. After `npx wrangler login` (or a `CLOUDFLARE_API_TOKEN`), from
`examples/`:

```bash
./deploy-cloudflare.sh            # build + deploy all 7
./deploy-cloudflare.sh cortex-ai  # or just one
```

See [DEPLOY.md](DEPLOY.md) for prerequisites, the URL map, and custom-domain notes.

## Endpoints (once servers are up)

- pulse-analytics → http://localhost:4001 (`/`, `/revenue`, `/engagement`, `/experiments`, `/accounts`, `/live`)
- ledger-finance → http://localhost:4002
- vitals-health → http://localhost:4003
- shipyard-devops → http://localhost:4004
- dispatch-editorial → http://localhost:4005
- atlas-realestate → http://localhost:4006
- cortex-ai → http://localhost:4007

Every one of the 106 chart types appears in at least one app.
