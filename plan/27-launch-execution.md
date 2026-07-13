# 27 — Launch execution runbook (Phase 3.75 Part B → Phase 4)

> **Purpose:** the ordered, copy-paste checklist to take microcharts from "code done" to
> "published + live + discoverable." Everything here is an *execution* step — most need the
> user (npm publish, Cloudflare account, GitHub repo settings, DNS). Code-side prep (README,
> npm metadata, changeset) is already done; see [STATUS.md](STATUS.md) Batch 4 row.
>
> **Domain:** `microcharts.dev` (register on Cloudflare). **Analytics:** Cloudflare Web
> Analytics (privacy-first, zero-dep, no cookie banner — brand-aligned).
>
> **Prereqs that are DONE (2026-07-13):** README rewrite (B.1), `package.json` metadata +
> `homepage` → `microcharts.dev` (B.2 prep), `0.2.0` changeset staged (B.2 prep). `gallery-2`
> WIP was stale (no such dir — gallery already upgraded); B.4/B.5 unblocked.

---

## Order of operations

Do it in this order — each step unblocks the next:

1. **Register `microcharts.dev`** on Cloudflare (or transfer nameservers if registered elsewhere).
2. **Deploy the docs site** to Cloudflare Workers Static Assets + bind the custom domain.
3. **Enable Cloudflare Web Analytics** on the zone.
4. **Publish `@microcharts/react@0.2.0`** to npm (OIDC trusted publishing — already configured).
5. **Repo hygiene** — remove internal docs + fresh-slate squash of history (§7) — **before** going public.
6. **GitHub repo polish** — make public, topics, social preview, description, discussions.
7. **Verify OG + submit to Search Console** (sitemap), once the domain resolves.
8. **Announce** (Phase 4) — Show HN / dev.to / awesome-lists / Product Hunt.

> Step 5 (history squash) is **destructive and one-way**: it rewrites every commit SHA,
> force-pushes `main`, and deletes all other branches + tags. Run it only once `main` is at the
> final public state and all outstanding work (Checkpoint 3, batch gates) is landed. It **must**
> happen before step 6 (making the repo public), or the internal `plan/` history leaks.

Steps 1–3 (site) and 4 (npm) are independent — either can go first. The README and npm
`homepage` already point at `microcharts.dev`, so ideally the site is live before npm publish so
the package page's homepage link resolves. If you publish first, the link 404s until DNS is up —
harmless, but not ideal for a launch-day first impression.

---

## 1 · Register the domain (Cloudflare)

- Cloudflare Dashboard → **Domain Registration → Register Domains** → `microcharts.dev`
  (`.dev` is a Google-operated TLD; it's on the HSTS preload list, so **HTTPS is mandatory** —
  Cloudflare handles the cert automatically, nothing to configure).
- If you buy it elsewhere: add the site to Cloudflare (**Websites → Add a site**), then set the
  registrar's nameservers to the two Cloudflare assigns.
- No manual DNS records needed for the Workers custom-domain binding in step 2 — Cloudflare
  creates them when you attach the domain to the Worker.

---

## 2 · Deploy the docs site

The site is a **Next 16 static export** (`output: 'export'` → `apps/docs/out/`) served by
**Cloudflare Workers Static Assets**. Config already exists: `apps/docs/wrangler.jsonc`
(name `microcharts-docs`, serves `./out`).

### Build must see the library first

The docs consume `@microcharts/react` from `dist/`, so build the library before the docs:

```bash
pnpm build                                   # build the library (repo root)
pnpm --filter @microcharts/docs cf:deploy    # builds docs (out/) + wrangler deploy
```

`cf:deploy` = `pnpm build && wrangler deploy`. First `wrangler` run opens a browser to
authenticate to your Cloudflare account. This publishes to the `*.workers.dev` preview URL.

### Set the production origin

The site reads its origin from `NEXT_PUBLIC_SITE_URL` (falls back to `https://microcharts.dev`).
The fallback is already correct, so no env var is strictly needed. To be explicit, set it in the
build environment (all absolute URLs — canonical, OG, sitemap, llms.txt links — derive from it):

```bash
NEXT_PUBLIC_SITE_URL=https://microcharts.dev pnpm --filter @microcharts/docs cf:deploy
```

### Bind the custom domain

- Cloudflare Dashboard → **Workers & Pages → `microcharts-docs` → Settings → Domains & Routes →
  Add → Custom Domain** → `microcharts.dev` (and `www.microcharts.dev` if you want it, then
  redirect one to the other with a Redirect Rule).
- Cloudflare provisions the cert + DNS automatically. Propagation is usually minutes.

### Verify

- `https://microcharts.dev` loads; light/dark both render; charts are visible.
- `https://microcharts.dev/llms.txt`, `/llms-full.txt`, `/catalog.json` resolve.
- `https://microcharts.dev/sitemap.xml` and `/robots.txt` resolve.

---

## 3 · Cloudflare Web Analytics

Because the site is proxied through Cloudflare on a Cloudflare-managed zone, you get analytics
**with zero code**:

- Dashboard → **Analytics & Logs → Web Analytics** → the zone is auto-listed once the domain is
  active. Enable it. No beacon script, no cookie banner, no consent flow, nothing to add to the
  site. (This is the recommended path — it keeps the zero-dep, no-third-party-JS promise intact.)
- If you ever move the site off Cloudflare's proxy, switch to the **beacon** method: Web
  Analytics → Add a site → copy the `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'></script>` snippet into the docs root layout
  (`apps/docs/src/app/layout.tsx`, in `<head>` or end of `<body>`). Only do this if the
  automatic method isn't available — a script tag is a (tiny) regression on the no-JS stance.

No Google Analytics (adds a cookie/consent banner + third-party script — cut against the brand).

---

## 4 · Publish `@microcharts/react@0.2.0`

Trusted publishing (OIDC) is **already configured and proven** — `0.1.0` was published this way
(run 29033491214). No npm token needed; provenance is automatic.

```bash
pnpm changeset version    # consumes .changeset/full-catalog-0-2-0.md → bumps 0.1.0 → 0.2.0,
                          # writes CHANGELOG.md. Review the diff.
pnpm build                # rebuild dist against the bumped version
git add -A && git commit -m "release: @microcharts/react@0.2.0"
```

Then release via the existing workflow:

- Push to `main`. The **Changesets release workflow** (`.github/workflows/release.yml`) opens a
  "Version Packages" PR or, if versions are already applied, runs `changeset publish` on merge —
  publishing to npm over OIDC with provenance. Confirm the run is green and the version shows on
  npm.
- Pre-flight the artifact locally first: `pnpm publint && pnpm attw` (both wired into CI, but
  cheap to run by hand), and `npm publish --dry-run` inside the package to eyeball the file list.

**Do NOT publish until you've decided the site is ready** — the npm `homepage` points at
`microcharts.dev`.

---

## 5 · GitHub repo polish

The repo is currently **private** at `github.com/ganapativs/microcharts`. For launch:

- **Make it public** (Settings → General → Danger Zone → Change visibility). Do a final glance
  for anything that shouldn't be public (there are no secrets in the tree; CI uses OIDC + repo
  secrets, not committed tokens).
- **About panel** (repo homepage, gear icon top-right):
  - Description: `Word-sized charts for React, made for LLMs and humans. 106 chart types, zero runtime dependencies, accessible by default, RSC-safe.`
  - Website: `https://microcharts.dev`
  - **Topics:** `react` `charts` `dataviz` `data-visualization` `sparkline` `svg`
    `accessibility` `a11y` `react-server-components` `rsc` `zero-dependency` `typescript`
    `llm` `ai` `microcharts` `components`
- **Social preview image** (Settings → General → Social preview → upload a 1280×640 PNG). The
  docs already generate an on-brand OG image — reuse it: grab
  `https://microcharts.dev/og/default.png` (or the source in `apps/docs/src/app/og/`) and upload.
- **Discussions:** Settings → Features → enable **Discussions**. Seed categories: `Announcements`
  (post the launch), `Q&A`, `Show and tell` (people sharing charts they built), `Ideas` (new
  chart-type requests — point them at the admission bar in CLAUDE.md / plan/05).
- **Releases:** the changeset publish tags a release; make sure the `0.2.0` release notes read
  well (the changeset body becomes the CHANGELOG entry).

---

## 6 · OG verification + Search Console

Once `microcharts.dev` resolves:

- **OG render check:** paste `https://microcharts.dev` into a link-preview validator (e.g.
  opengraph.dev, or just paste into Slack/X/iMessage and watch the unfurl). Confirm the card
  shows the on-brand OG image, title, and description. Spot-check a chart page too — each route
  has a per-page OG (`fumadocs-ui/og`).
- **Google Search Console** (search.google.com/search-console):
  1. Add a property — use the **Domain** property type (`microcharts.dev`); it verifies via a
     DNS TXT record, which you add in Cloudflare DNS (one record, Cloudflare makes this trivial).
  2. Submit the sitemap: **Sitemaps → Add** → `https://microcharts.dev/sitemap.xml`.
  3. `robots.txt` already allows crawling and references the sitemap.
- **Bing Webmaster Tools** (optional, cheap): same domain verify, import the sitemap. Bing feeds
  a chunk of AI crawlers — worth it for an AI-native library.

`metadata.test.ts` already gates canonical/title/description/og:image/JSON-LD on the built HTML,
so the metadata is correct by construction — this step is just registering + confirming the unfurl.

---

## 7 · Repo hygiene — remove internal docs + fresh-slate squash

**Decision (2026-07-13, user):** the `plan/` docs are an internal artifact and must not appear in
the public repo **or its git history**. Method = **fresh-slate squash** (collapse all history into
one clean initial commit — no `git-filter-repo` needed, bulletproof: nothing internal survives).
CLAUDE.md is **slimmed for public**, not deleted (keep non-negotiables / architecture / contributor
guidance; strip `plan/` references, positioning, cut-ledger, and competitor notes).

**Nothing here is done yet — this runs at launch, after `main` is final.** Deleting `plan/` now
would strand the remaining Checkpoint 3 / batch-gate work that references it.

### What goes vs. stays

| Path | Action |
|---|---|
| `plan/` (all docs incl. STATUS, VISUAL-AUDIT, chart-gallery.html, this file) | **delete** |
| `CLAUDE.md` | **replace** with the slimmed public version |
| `plan/` citation comments in `scripts/*.mjs`, `scripts/size-budgets.json` | optional: scrub the `(plan/NN §N)` mentions (cosmetic; nothing reads them) |
| all non-`main` branches (7 remote: batch-4-frontier, docs-chart-page-polish, feat/*, superaudit, unified-motion) | **delete** — each carries `plan/` in its own history |
| tags / GitHub releases | squash drops them; re-tag `v0.2.0` on the new initial commit after |

### Prepare the slimmed CLAUDE.md first (staging, ahead of launch)

Draft the public CLAUDE.md as `CLAUDE.public.md` while the internal one is still in use. Keep:
non-negotiables (zero-dep, budgets, static-first, grammar, a11y, honest encodings), the
architecture map, theming contract, the component canon, and the working-rules/commit-style
section. Strip: every `plan/NN` reference, the roadmap/STATUS pointers, brand positioning prose,
the cut ledger, and competitor/strategy notes. Swap it in during the squash below.

### Squash procedure (one-way — read twice, run once)

```bash
# 0. main is at the exact tree you want public. All branches merged/closed. Clean working tree.
git checkout main && git pull

# 1. Remove internal docs; swap in the slimmed CLAUDE.md
git rm -r plan/
cp CLAUDE.public.md CLAUDE.md && rm CLAUDE.public.md
git add -A && git commit -m "chore: remove internal planning docs; slim CLAUDE.md for public"

# 2. Collapse ALL history into a single commit via an orphan branch
git checkout --orphan _public
git add -A
git commit -m "microcharts 0.2.0 — initial public release"

# 3. Make it the new main
git branch -D main
git branch -m _public main

# 4. Force-push main; delete every stale remote branch
git push --force origin main
for b in batch-4-frontier docs-chart-page-polish feat/four-homes-contexts \
         feat/home-elements superaudit unified-motion; do
  git push origin --delete "$b"
done

# 5. Re-tag the release on the fresh history, then verify
git tag v0.2.0 && git push origin v0.2.0
git log --oneline                 # → exactly one commit
git log --all -- plan/            # → empty (plan/ nowhere in history)
git branch -a                     # → only main (+ its remote)
```

**Caveats:** rewriting history breaks any open PRs and any existing clones (there are none but
yours — single-author repo). Do this on your machine, not in CI. Because it's one commit, GitHub's
"since 20XX" and contribution graph reset — expected and fine for a fresh public repo.

## 8 · Announce (Phase 4)

Pre-flight is [plan/20 §14](20-discoverability.md) P0. Then, per [plan/10](10-roadmap.md) Phase 4:

- **Show HN** — lead with the AI-native angle + zero-dep + the falsifiable size/bench numbers.
- **dev.to** post — the "made for LLMs and humans" story; embed live charts.
- **awesome-react / awesome-dataviz** PRs.
- **Product Hunt** — schedule; use the OG image + gallery screenshots.
- Deferred **bench competitor matrix** lands here (comparison pages need measured data —
  plan/20 §9).

Analytics cadence per plan/20 §13.

---

## Quick reference — what needs the user vs. what's automated

| Step | Who | Notes |
|---|---|---|
| README rewrite (B.1) | ✅ done | `README.md` |
| npm metadata (B.2 prep) | ✅ done | `package.json` desc/keywords/homepage |
| `0.2.0` changeset (B.2 prep) | ✅ done | `.changeset/full-catalog-0-2-0.md` |
| Register `microcharts.dev` | **user** | Cloudflare account + payment |
| Deploy docs to Cloudflare | **user** | `cf:deploy`, first run authenticates |
| Bind custom domain | **user** | Cloudflare dashboard |
| Enable Web Analytics | **user** | zero-code, one click |
| `changeset version` + publish | **user** | OIDC configured; runs on push to `main` |
| Draft slimmed `CLAUDE.public.md` | agent | when ready — strip plan refs + strategy (§7) |
| Remove `plan/` + fresh-slate squash | **user** | §7 — destructive, one-way, before going public |
| Make repo public | **user** | GitHub settings — only AFTER the squash |
| Topics / social / discussions | **user** | GitHub settings (values above) |
| Search Console + sitemap | **user** | DNS TXT verify + submit sitemap |
| Checkpoint 3 cold-dev (B.6) | **user + agent** | API freeze for 1.0 |
| VoiceOver/NVDA pass (B.7) | **user** | manual SR testing |
| Argos full-suite approval (B.7) | **user** | CI baselines on the PR |
