# Deploy the examples to Cloudflare Pages

Each of the 7 apps ships as **static assets** (no server runtime), one **Cloudflare Pages project per app**, so each
gets its own URL. The 6 Vite apps build to `dist/`; the Next app (`pulse-analytics`) uses `output: "export"` and builds
to `out/` — its Server Components still render at build time, so the charts are baked into the HTML as pure SVG (the
RSC/static-first story) with zero server runtime.

## One-time setup

1. A Cloudflare account.
2. Authenticate wrangler **one** of these ways:
   - Interactive: `npx wrangler login`
   - Token (CI): `export CLOUDFLARE_API_TOKEN=…` (scope **Cloudflare Pages: Edit**) and `export CLOUDFLARE_ACCOUNT_ID=…`

Nothing else to install — the deploy script uses `npx wrangler@4`.

## Deploy

From `examples/`:

```bash
./deploy-cloudflare.sh            # build + deploy all 7
./deploy-cloudflare.sh cortex-ai  # build + deploy just one
MC_PAGES_PREFIX=acme ./deploy-cloudflare.sh   # change the project-name prefix
```

For each app the script: installs deps if missing → `npm run build` → ensures the Pages project exists →
`wrangler pages deploy <out|dist>`. Re-running redeploys to the **same** URL.

## URLs (default prefix `microcharts`)

| App                | Project                | URL                                    |
| ------------------ | ---------------------- | -------------------------------------- |
| pulse-analytics    | `microcharts-pulse`    | https://microcharts-pulse.pages.dev    |
| ledger-finance     | `microcharts-ledger`   | https://microcharts-ledger.pages.dev   |
| vitals-health      | `microcharts-vitals`   | https://microcharts-vitals.pages.dev   |
| shipyard-devops    | `microcharts-shipyard` | https://microcharts-shipyard.pages.dev |
| dispatch-editorial | `microcharts-dispatch` | https://microcharts-dispatch.pages.dev |
| atlas-realestate   | `microcharts-atlas`    | https://microcharts-atlas.pages.dev    |
| cortex-ai          | `microcharts-cortex`   | https://microcharts-cortex.pages.dev   |

(`*.pages.dev` subdomains are first-come; if one is taken, set `MC_PAGES_PREFIX` and re-run.)

## Web analytics (how many people visit)

Two layers, both free:

1. **Pages built-in metrics** — automatic, zero setup. Dashboard → the Pages project → _Metrics_: requests, bandwidth,
   status codes, top paths. Always on once deployed. `wrangler` has no toggle for this; it's inherent to Pages.

2. **Cloudflare Web Analytics** — privacy-first, cookieless _visits + page views_. Two ways:
   - **Easiest (recommended, zero code):** Dashboard → the Pages project → _Web Analytics_ → **Enable**. Cloudflare
     auto-injects the beacon on every response. Nothing to set in the repo. Do this per project.
   - **Token in build (already wired in code):** create a Web Analytics site (Dashboard → _Web Analytics_ → _Add a site_
     → hostname = the project's `*.pages.dev` or your custom domain → copy the **token**), then set the env var
     **before** building/deploying that app:
     - Vite apps: `export VITE_CF_BEACON_TOKEN=<token>`
     - Next app (pulse): `export NEXT_PUBLIC_CF_BEACON_TOKEN=<token>` The apps already contain the beacon wiring
       (`src/analytics.ts` / the Next `layout.tsx`) — it injects only when the token is set, and is a no-op otherwise.
       **One token per hostname**, so if you use the beacon path, set a different token per app (the dashboard toggle
       avoids this bookkeeping).

> Note: there is no `wrangler` command to switch Web Analytics on for Pages — it's the dashboard toggle or the beacon
> token above. `wrangler` only ships the assets.

## Notes

- **No SEO by design.** Every app ships `noindex, nofollow` plus a `robots.txt` that disallows all crawlers. These are a
  visual harness / shareable demos — ranking and AI surfaces (`llms.txt`, sitemaps, OG campaigns) live on
  `microcharts.dev` only. Do not add them here.
- **One URL each** is the point — 7 independent projects. To instead host all under one domain at subpaths, each app
  would need a matching `base` (Vite) / `basePath` (Next) — not set here; separate projects are simpler.
- **Custom domains:** add in the Cloudflare dashboard (Pages → project → Custom domains) or
  `npx wrangler pages deployment … ` — e.g. `pulse.example.com` per project.
- **Testing a release candidate:** bump `@microcharts/react` in each app's `package.json` to the RC / target version,
  `npm install`, then re-run the deploy — same as the local suite.
- **CI option:** the same `wrangler pages deploy` calls run in GitHub Actions with the token env vars above, if you
  later want push-to-deploy.
- Build outputs (`dist/`, `out/`, `.next/`) are git-ignored; the script rebuilds fresh each run.
