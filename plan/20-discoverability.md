# 20 - Discoverability: SEO, LLM, CLI, Social, Ecosystem

> Status: draft v1 - Added 2026-07-06 (Codex; provenance in [12-research-audit.md](12-research-audit.md)). Purpose: make `@microcharts/react` easy to find, cite, install, understand, and share across search engines, LLM tools, package registries, social feeds, IDE agents, terminals, and docs readers.
> **Execution mapping:** §15 P0 = roadmap step **3.5** (launch gate, tracked in [STATUS.md](STATUS.md)); §14 P1 rides Phase 4 launch week; §15 P2 rides Phase 5b (string renderer / CLI / MCP / registry — see [10-roadmap.md](10-roadmap.md) §5b, [13](13-universal-rendering.md), [14](14-ai-native.md)). This doc stays the single home for discoverability decisions — other docs point here, not copy.

## 0. Executive Decision

Build the docs site as a static-first distribution engine, not only a reference manual.

Launch-critical:

- Crawlable static HTML for every docs, chart, example, comparison, and benchmark page.
- One metadata contract for title, description, canonical URL, Open Graph, Twitter cards, JSON-LD, breadcrumbs, and image selection.
- `/llms.txt`, `/llms-full.txt`, `.md` mirrors, and a machine-readable chart catalog generated from the same source as the React APIs.
- Package registry metadata that points to the docs, not just GitHub.
- Share cards generated from real microcharts so every shared URL advertises the product.
- CI checks for metadata, sitemap, `llms.txt`, broken links, and basic rendered HTML.

Not launch-critical:

- MCP. Ship MCP only after the JSON chart spec and string renderer exist. It should expose real tools such as "validate a spec" and "render SVG", not a thin wrapper around docs search.

The viral angle is not "add hype copy." It is: every page should become a working artifact. Search result, LLM context, npm card, GitHub README, social card, terminal output, and AI answer should all demonstrate the product.

## 1. Evidence Base

| Claim | Source | Concrete implication |
| --- | --- | --- |
| Google processes JavaScript in crawl, render, and index phases, and server-side or pre-rendering is still recommended because it is faster for users and crawlers. | Google Search Central, JavaScript SEO basics: <https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics> | Docs pages must render primary content, links, canonical tags, and metadata in initial HTML. Do not rely on client-only examples for indexable content. |
| Google recommends canonical links in HTML where possible and warns against conflicting multiple canonicals. | Google Search Central, JavaScript SEO basics and canonical docs: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls> | Every page gets exactly one absolute canonical URL from a shared metadata helper. |
| Structured data may be server-rendered or injected with JS, but must be tested with Rich Results Test or rendered HTML inspection. | Google Search Central, structured data with JavaScript: <https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript> | Prefer SSR JSON-LD. Add CI smoke checks that JSON-LD exists and parses. Test key pages manually before launch. |
| Google uses titles, H1s, prominent page text, `og:title`, anchor text, and WebSite structured data to generate title links. | Google Search Central, title links: <https://developers.google.com/search/docs/appearance/title-link> | Page title, visible H1, nav label, and `og:title` should agree instead of drifting. |
| Google may use meta descriptions when they better describe a page; duplicate descriptions are not useful. | Google Search Central, snippets: <https://developers.google.com/search/docs/appearance/snippet> | Every indexable page needs a unique, specific description. |
| Image discovery improves with standard `img` elements, `src` fallbacks, image sitemaps, relevant nearby text, `og:image`, `primaryImageOfPage`, descriptive filenames, and useful alt text. | Google Search Central, image SEO: <https://developers.google.com/search/docs/appearance/google-images> | OG images and exported chart images should have stable URLs, descriptive filenames, alt text, and optional image sitemap entries. |
| `llms.txt` is a proposed root Markdown file with concise context and links to Markdown pages; `.md` mirrors and expanded context files are recommended. | llms.txt proposal: <https://llmstxt.org/index.md> | Ship `/llms.txt`, `/llms-full.txt`, `.md` mirrors, and test them with real LLM questions. |
| Mintlify hosts `/llms.txt`, `/llms-full.txt`, and `.md` docs for LLM ingestion; Anthropic, Cursor, and many hosted docs adopted the pattern. | Mintlify docs/blog: <https://www.mintlify.com/docs/ai/llmstxt>, <https://mintlify.com/blog/simplifying-docs-with-llms-txt> | Early support is credible in developer tooling. `microcharts` should treat this as table stakes by launch. |
| Core Web Vitals "good" thresholds are LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at the 75th percentile. | web.dev Web Vitals: <https://web.dev/articles/vitals> | Docs must keep marketing pages fast; interactive demos load below the fold or progressively. |
| npm search uses package `description` and `keywords`; `homepage` and `repository` aid discovery and tooling. | npm package.json docs: <https://docs.npmjs.com/cli/v9/configuring-npm/package-json/> | `package.json` description, keywords, homepage, and README CTAs are launch surface area. |
| Node recommends `exports` for package public API boundaries and subpaths. | Node packages docs: <https://nodejs.org/docs/latest/api/packages.html> | Every documented import path must match `exports`; docs should teach subpath imports. |
| shadcn registry distributes source/code metadata over HTTP and supports content negotiation for HTML, JSON, and Markdown. | shadcn registry docs: <https://ui.shadcn.com/docs/registry>, <https://ui.shadcn.com/docs/registry/getting-started> | Later, recipes and wrappers can be installable via registry-style URLs without becoming runtime dependencies. |
| D3 and Observable Plot emphasize concise examples, "get started" paths, and rich example galleries. | D3: <https://d3js.org/>, Observable Plot getting started: <https://observablehq.com/plot/getting-started> | `microcharts` should lead with compact runnable examples and an indexable gallery, not abstract feature lists. |
| Facebook/Open Graph guidance recommends explicit OG metadata and image dimensions so crawlers can render cards immediately. | Meta sharing best practices: <https://developers.facebook.com/docs/sharing/best-practices/> | Every shareable page needs `og:image`, dimensions, title, description, and a preview test before launch. |
| MCP discovery is moving toward explicit server discovery and server-card metadata for remote tools. | MCP Go SDK protocol docs and server-card extension: <https://github.com/modelcontextprotocol/go-sdk/blob/main/docs/protocol.md>, <https://github.com/modelcontextprotocol/experimental-ext-server-card> | MCP should be a real tool surface with static metadata, not a generic docs gimmick. |

## 2. Information Architecture That Can Rank

Use one domain and one canonical docs tree:

```txt
https://microcharts.dev/
https://microcharts.dev/docs
https://microcharts.dev/docs/quickstart
https://microcharts.dev/docs/charts/sparkline
https://microcharts.dev/docs/charts/sparkbar
https://microcharts.dev/docs/charts/delta
https://microcharts.dev/docs/charts/bullet
https://microcharts.dev/docs/charts/activity-grid
https://microcharts.dev/docs/recipes/rsc
https://microcharts.dev/docs/recipes/table-cells
https://microcharts.dev/docs/recipes/ai-generated-ui
https://microcharts.dev/docs/accessibility
https://microcharts.dev/docs/performance
https://microcharts.dev/docs/ai
https://microcharts.dev/docs/compare
https://microcharts.dev/docs/compare/react-sparklines
https://microcharts.dev/docs/compare/recharts
https://microcharts.dev/docs/compare/tremor
https://microcharts.dev/gallery
https://microcharts.dev/bench
https://microcharts.dev/examples
```

Action rules:

- Keep docs under the main domain unless the domain strategy forces otherwise. A subfolder concentrates internal links and brand authority better than splitting docs onto a separate host.
- Give every chart type an indexable page, even if it is not in v1 yet. Future chart pages can be "planned" pages with gallery preview, data shape, use cases, and status, but must not imply shipped npm exports.
- Create comparison pages only where `microcharts` has a defensible technical difference: size, zero dependencies, RSC-safe static charts, accessibility summaries, and table-cell use cases.
- Do not create thin SEO pages. Every indexable page must include runnable code, rendered chart, accessibility text, package import path, and "when not to use this" guidance.

Page matrix:

| Page type | Primary search intent | Required content |
| --- | --- | --- |
| Home | "React micro charts", "tiny accessible React charts" | One-sentence thesis, live inline examples, gzip/zero-dep/a11y receipts, install, links to docs/gallery/bench. |
| Quickstart | "install microcharts", "React sparkline install" | Install command, CSS import, first chart, RSC example, interactive example. |
| Chart reference | "React sparkline", "accessible sparkline React" | Import paths, props, data shape, default behavior, a11y summary, examples, edge cases, related charts. |
| Recipes | "sparkline in table cell", "RSC chart React" | Copyable task-specific solutions with minimal code and rendered result. |
| Accessibility | "accessible chart React", "chart aria summary" | Explain auto summaries, `summary={false}`, keyboard patterns, forced colors, reduced motion. |
| Performance | "small React chart library", "zero dependency chart" | Bench methodology, size-limit output, node counts, SSR benchmark, reproducible command. |
| AI | "LLM chart spec", "AI generated charts React" | JSON spec, fenced `microchart` blocks, schema URL, streaming examples. |
| Compare | "microcharts vs recharts", "react-sparklines alternative" | Neutral feature table, bundle/maintenance status, migration notes, when competitor is better. |
| Gallery | "micro chart examples", "small chart types" | All chart cards with text descriptions, stable URLs, static SVG, no client-only rendering. |

## 3. Metadata Contract

Implement one metadata helper in the docs app. Every page calls it. No page hand-rolls `<head>`.

```ts
// docs/lib/metadata.ts
import type { Metadata } from "next";

const site = "https://microcharts.dev";
const image = "/og/default.png";

type MetaInput = {
  title: string;
  description: string;
  path: `/${string}`;
  image?: `/${string}`;
  imageAlt?: string;
  noindex?: boolean;
};

export function docsMeta({
  title,
  description,
  path,
  image: pageImage = image,
  imageAlt = "microcharts examples rendered as tiny accessible React charts",
  noindex = false,
}: MetaInput): Metadata {
  const url = new URL(path, site).toString();
  const imageUrl = new URL(pageImage, site).toString();

  return {
    title: `${title} | microcharts`,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "microcharts",
      title,
      description,
      url,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
```

Required tags per indexable page:

- `<title>`: specific, aligned with H1, usually 45-65 chars before suffix.
- `<meta name="description">`: unique, specific, usually 120-160 chars.
- `<link rel="canonical">`: absolute URL, exactly one.
- `og:title`, `og:description`, `og:url`, `og:site_name`, `og:type`, `og:image`, `og:image:width`, `og:image:height`, `og:image:alt`.
- `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- Favicons: SVG, ICO fallback, Apple touch icon, stable URLs.
- `theme-color`: light/dark variants only if docs UI actually uses them.

Acceptance tests:

- Render all docs routes and assert exactly one canonical.
- Assert title, description, H1, and `og:title` are not empty and do not conflict.
- Assert every `og:image` returns 200, is absolute HTTPS in production, and has width/height metadata.
- Assert no indexable page has `noindex`.
- Assert redirects normalize trailing slash and host consistently.

## 4. Structured Data

Use JSON-LD as a retrieval map. Do not overpromise rich results. The goal is machine clarity and search result quality.

Site-wide:

- `WebSite` with `name`, `url`, optional `potentialAction` search once docs search exists.
- `Organization` or `Person` owner, linked from package, GitHub, npm, and docs footer.

Every docs page:

- `BreadcrumbList`.
- `TechArticle` for conceptual docs, recipes, and chart reference pages.

Package/reference pages:

- `SoftwareSourceCode` for source repository, programming language, license, runtime platform, code repository, and package URL.
- `SoftwareApplication` only if there is a real app-like playground/demo page. Do not mark every docs page as an application.

Example generator:

```ts
// docs/lib/jsonld.ts
type Breadcrumb = { name: string; url: string };

export function breadcrumbJsonLd(items: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: { "@id": item.url, name: item.name },
    })),
  };
}

export function techArticleJsonLd(input: {
  url: string;
  headline: string;
  description: string;
  dateModified: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    mainEntityOfPage: input.url,
    headline: input.headline,
    description: input.description,
    dateModified: input.dateModified,
    image: input.image,
    about: ["React", "SVG charts", "accessibility", "data visualization"],
    proficiencyLevel: "Intermediate",
  };
}
```

Rendering rule:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
/>
```

Acceptance tests:

- JSON-LD parses as JSON for every route.
- Breadcrumb positions are contiguous.
- `mainEntityOfPage` equals canonical.
- Rich Results Test manually passes for home, quickstart, one chart page, accessibility page, and benchmark page before launch.

## 5. LLM-Readable Surface

Ship four layers. They serve different tools and should be generated, not manually maintained.

```txt
/llms.txt                 curated map, small enough to inspect
/llms-full.txt            full docs context, generated
/**/*.md                  Markdown mirror for every docs page
/catalog.json machine-readable chart/API catalog
/microcharts.schema.json  JSON chart spec schema from plan/14
```

### 5.1 `/llms.txt`

Required structure:

```md
# microcharts

> Word-sized accessible React charts. Zero runtime dependencies, static-first SVG, RSC-safe defaults, and optional interactive entries.

Use `@microcharts/react` for React. Import individual charts from subpaths, for example `@microcharts/react/sparkline`. Static entries are hook-free and server-component safe. Interactive entries live under `/interactive`.

## Start Here

- [Quickstart](https://microcharts.dev/docs/quickstart.md): install, CSS import, first static chart, first interactive chart.
- [Chart API grammar](https://microcharts.dev/docs/api.md): shared prop names and data shapes.
- [Accessibility](https://microcharts.dev/docs/accessibility.md): default summaries, decorative opt-out, keyboard and forced-color behavior.

## Charts

- [Sparkline](https://microcharts.dev/docs/charts/sparkline.md): trend over ordered values.
- [SparkBar](https://microcharts.dev/docs/charts/sparkbar.md): compact bars and win-loss rows.
- [Delta](https://microcharts.dev/docs/charts/delta.md): signed change between two values.
- [Bullet](https://microcharts.dev/docs/charts/bullet.md): value against target/range.
- [ActivityGrid](https://microcharts.dev/docs/charts/activity-grid.md): calendar or matrix intensity.

## Machine Interfaces

- [Chart catalog JSON](https://microcharts.dev/catalog.json): chart names, import paths, props, examples, and data shapes.
- [Chart spec JSON Schema](https://microcharts.dev/microcharts.schema.json): schema for AI and URL-rendered charts.

## Optional

- [Full docs context](https://microcharts.dev/llms-full.txt): complete generated docs text.
- [Benchmarks](https://microcharts.dev/bench.md): reproducible size and SSR performance results.
```

Rules:

- Keep `/llms.txt` curated. It is a map, not a dump.
- Keep `/llms-full.txt` generated from canonical docs content.
- Include only URLs that return 200.
- Include `.md` links, not HTML links, when equivalent Markdown exists.
- Add "do not use" notes for common hallucination traps: no pie, no gauge, no runtime dependencies, no default client JS.

### 5.2 Markdown Mirrors

Every docs page should have a Markdown version at the same route plus `.md`.

Implementation options:

- Static generation: emit `.md` files during docs build from MDX/content source.
- Content negotiation: if `Accept: text/markdown`, return Markdown from the same route.
- Both: best developer ergonomics. `.md` is easy to paste; content negotiation is elegant for agents.

Markdown page template:

````md
---
title: Sparkline
description: Render tiny accessible trends in React, including RSC-safe static SVG.
package: "@microcharts/react"
import: "@microcharts/react/sparkline"
status: "v1"
---

# Sparkline

Sparkline renders a compact trend over ordered values. Use it in table cells, sentences, KPI cards, and dense dashboards when exact point values matter less than direction and shape.

## Install

```bash
pnpm add @microcharts/react
```

## Minimal Example

```tsx
import { Sparkline } from "@microcharts/react/sparkline";

<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />;
```

## Accessibility

By default, the chart renders as an image with a deterministic text summary. Use `summary={false}` only when the surrounding text already describes the data.
````

### 5.3 Machine Catalog

Generate `catalog.json` from the same chart registry used by docs navigation and package exports.

```json
{
  "$schema": "https://microcharts.dev/catalog.schema.json",
  "package": "@microcharts/react",
  "version": "1.0.0",
  "charts": [
    {
      "name": "Sparkline",
      "slug": "sparkline",
      "status": "stable",
      "staticImport": "@microcharts/react/sparkline",
      "interactiveImport": "@microcharts/react/sparkline/interactive",
      "dataShape": "number[]",
      "primaryEncoding": "position",
      "bestFor": ["inline trend", "table cell trend", "KPI trend"],
      "avoidFor": ["part-to-whole", "exact category comparison"],
      "props": [
        { "name": "data", "type": "number[]", "required": true },
        { "name": "title", "type": "string", "required": false },
        { "name": "summary", "type": "string | false", "required": false }
      ],
      "examples": [
        {
          "title": "Revenue trend",
          "code": "import { Sparkline } from '@microcharts/react/sparkline';\n<Sparkline data={[3,5,4,8,6,9]} title='Weekly revenue' />"
        }
      ]
    }
  ]
}
```

Acceptance tests:

- Every stable chart in `package.json#exports` appears in catalog.
- Every catalog import path exists in `exports`.
- Every chart docs page links to its catalog entry.
- Every catalog example typechecks as a docs fixture.

### 5.4 LLM Evaluation Harness

Create a small docs evaluation script after the docs site exists.

Test prompts:

- "Use microcharts to render a sparkline in a React Server Component."
- "Make an accessible bullet chart with value and target."
- "Which microcharts component should I use for a calendar contribution grid?"
- "Does microcharts support pie charts?"
- "What import path do I use for an interactive sparkline?"

Scoring:

- Correct package name.
- Correct import path.
- No invented dependency.
- Correct static vs interactive distinction.
- Correct a11y summary behavior.
- Correct "not supported" answer for rejected charts.

Run this manually against Claude, ChatGPT, Cursor, and Perplexity at launch, then quarterly. Do not automate against paid models until there is a clear maintenance owner.

## 6. MCP Stance

MCP is useful only when it exposes operations, not when it merely republishes docs.

Decision:

- Do not block launch on MCP.
- Do not ship a production remote MCP server before `microcharts/string` and the JSON chart spec exist.
- Do ship an example MCP server in v1.x if it can render and validate charts with zero ambiguity.

Minimum useful tools:

```json
[
  {
    "name": "list_microchart_types",
    "description": "Return supported chart types, import paths, data shapes, and stability status."
  },
  {
    "name": "validate_microchart_spec",
    "description": "Validate a JSON chart spec and return actionable errors."
  },
  {
    "name": "render_microchart_svg",
    "description": "Render a valid chart spec to a standalone SVG string."
  },
  {
    "name": "get_microchart_examples",
    "description": "Return canonical examples for a chart type and target context."
  }
]
```

MCP deliverables when ready:

```txt
examples/mcp-server/
  package.json
  src/index.ts
  README.md

https://microcharts.dev/mcp/server-card
https://microcharts.dev/.well-known/mcp/catalog.json
```

Rules:

- MCP server must use the same `catalog.json` and `microcharts.schema.json` as the docs.
- MCP server must not require auth for public docs/spec rendering.
- MCP server must not invent chart props. It validates against schema and returns errors.
- MCP server must include server metadata/discovery only after the MCP server-card shape stabilizes enough for real clients.

Why not launch-critical:

- Search engines do not need MCP.
- LLMs can already consume Markdown, `llms.txt`, schema files, npm README, and code examples.
- A premature MCP server creates maintenance surface without adoption proof.
- The high-leverage first step is making content and examples correct everywhere agents already read.

## 7. CLI And Registry Distribution

The package is already the primary distribution path:

```bash
pnpm add @microcharts/react
```

Docs should show equivalent npm/yarn/pnpm/bun commands, but default to the package manager already detected in examples only when the user is in a local project. Public docs can show tabs.

### 7.1 Optional CLI

Add a CLI only when it does real work:

```bash
pnpm dlx @microcharts/cli doctor
pnpm dlx @microcharts/cli add sparkline
pnpm dlx @microcharts/cli render sparkline --data 3,5,4,8 --out trend.svg
pnpm dlx @microcharts/cli catalog
```

CLI commands:

- `doctor`: checks React version, CSS import, duplicate package versions, and import path mistakes.
- `add`: prints or applies a minimal recipe for the selected chart. It must not hide the package API.
- `render`: uses `microcharts/string` to output SVG from CLI for README badges, docs, and terminals.
- `catalog`: prints chart names, import paths, statuses, and data shapes.

Do not ship a CLI that only wraps `pnpm add`. That is noise.

### 7.2 Registry-Style Recipes

Use a shadcn-style registry for recipes and wrappers after v1, not for the core package.

Good registry items:

- `sparkline-table-cell`: table cell wrapper with CSS and direct label recipe.
- `kpi-card`: card layout with Delta + Sparkline.
- `ai-chat-microchart-block`: Markdown code-block renderer for ` ```microchart `.
- `activity-grid-legend`: accessible legend wrapper for ActivityGrid.

Registry item shape:

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "microcharts",
  "homepage": "https://microcharts.dev",
  "items": [
    {
      "name": "sparkline-table-cell",
      "type": "registry:block",
      "title": "Sparkline Table Cell",
      "description": "A compact accessible table-cell trend using @microcharts/react/sparkline.",
      "dependencies": ["@microcharts/react"],
      "files": [
        { "path": "registry/default/sparkline-table-cell.tsx", "type": "registry:component" }
      ]
    }
  ]
}
```

Acceptance:

- Registry items compile in a fixture app.
- Registry examples never copy internals from `src/core`.
- Registry examples preserve zero runtime dependencies except `@microcharts/react`.
- Each registry item has an equivalent docs page and `.md` mirror.

## 8. Open Graph And Share Cards

Every important URL should look good when pasted into Slack, Discord, X, LinkedIn, iMessage, GitHub issues, and AI chats.

Image rule:

- Default size: 1200x630.
- Format: PNG or JPEG. Use PNG for sharp text and SVG-like chart marks.
- File budget: target <300 KB for broad mobile/social reliability; hard cap <1 MB.
- Put text and logos inside the center safe area.
- Use real chart output from `microcharts/string` whenever possible.

Card system:

```txt
/og/default.png
/og/charts/sparkline.png
/og/charts/sparkbar.png
/og/charts/delta.png
/og/recipes/rsc.png
/og/bench.png
/og/compare/react-sparklines.png
```

Dynamic OG template:

```tsx
// docs/app/og/[...slug]/route.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "microcharts";
  const subtitle = url.searchParams.get("subtitle") ?? "Word-sized accessible React charts";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#faf9f5",
          color: "#171717",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: "-0.02em" }}>microcharts</div>
        <div>
          <div style={{ maxWidth: 820, fontSize: 74, lineHeight: 0.95, letterSpacing: "-0.055em" }}>
            {title}
          </div>
          <div style={{ marginTop: 28, maxWidth: 720, fontSize: 30, color: "#525252" }}>
            {subtitle}
          </div>
        </div>
        <div style={{ fontSize: 26 }}>Zero deps - RSC-safe - Accessible by default</div>
      </div>
    ),
    size,
  );
}
```

Later, replace the placeholder stripe with real `microcharts/string` SVG output embedded into the image once the string renderer lands.

Acceptance:

- All OG image URLs return 200.
- All social images are absolute HTTPS URLs in production metadata.
- `og:image:alt` describes the image.
- Facebook Sharing Debugger, LinkedIn Post Inspector, Slack, Discord, and X preview are checked for home, quickstart, one chart, and benchmark page.
- When an OG image changes, use versioned URLs or query strings to avoid stale social caches.

## 9. Search Content Strategy

Target high-intent developer queries with pages that solve the query completely.

P0 pages:

| Page | Target queries | Proof/content |
| --- | --- | --- |
| `/docs/charts/sparkline` | `react sparkline`, `accessible sparkline react`, `tiny sparkline react` | Install, static import, interactive import, SVG output, a11y summary, table-cell recipe. |
| `/docs/accessibility` | `accessible react charts`, `aria chart summary`, `accessible svg chart` | Exact naming behavior, examples, forced-colors, reduced-motion, keyboard pattern. |
| `/docs/performance` | `small react chart library`, `zero dependency react chart`, `rsc chart react` | Size-limit receipts, SSR bench, bundle comparison, node count. |
| `/docs/recipes/rsc` | `react server component chart`, `RSC sparkline`, `zero client js chart` | RSC example, no hooks/listeners, hydration notes. |
| `/docs/compare/react-sparklines` | `react-sparklines alternative`, `react sparkline library maintained` | Neutral migration, maintenance state, size/a11y differences. |

P1 pages:

- `Microcharts in table cells`
- `Microcharts in KPI cards`
- `AI-generated charts with JSON specs`
- `Copy charts as SVG/PNG`
- `Accessible chart summaries for screen readers`
- `Tiny charts in Markdown and READMEs`

Editorial launch pieces:

1. "Tiny charts should be readable by screen readers"
   - Shows the accessibility summary feature with examples.
2. "A React chart can be server-rendered and still feel alive"
   - Shows static-first architecture plus optional interactive entries.
3. "The microchart catalog: 96 tiny decisions, not 96 decorations"
   - Uses the gallery as the hero artifact.
4. "We replaced dashboard chrome with word-sized charts"
   - Product/design essay with concrete UI examples.

Rules for content:

- First paragraph answers the query directly.
- Every page has at least one copyable, compiled example.
- Every claim about size/performance links to a reproducible command or generated artifact.
- Every chart page says when not to use that chart.
- No theory name-dropping in public docs. Explain practical behavior.

## 10. Package, npm, And GitHub Discoverability

Package metadata updates before public launch:

```json
{
  "description": "Word-sized accessible React charts. Zero dependencies, tiny SVG, RSC-safe.",
  "keywords": [
    "accessible",
    "activity-grid",
    "bullet-chart",
    "chart",
    "charts",
    "dataviz",
    "inline-chart",
    "microchart",
    "react",
    "react-server-components",
    "rsc",
    "sparkline",
    "svg",
    "tiny-chart",
    "zero-dependency"
  ],
  "homepage": "https://microcharts.dev?utm_source=npm&utm_medium=registry&utm_campaign=package",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ganapativs/microcharts.git"
  }
}
```

README requirements:

- First screen: one sentence, install, one example, rendered image.
- Badges: CI, npm version, gzip size, zero deps, a11y, license. Avoid badge clutter.
- "Why microcharts" bullets with receipts only: zero deps, RSC-safe static entries, accessible summaries, per-chart subpaths.
- Import path table.
- Link to docs with UTM.
- Link to `/llms.txt` and `/catalog.json`.
- Dogfood chart-as-URL badge once `microcharts/string` exists.

GitHub requirements:

- Repo topics: `react`, `charts`, `sparkline`, `svg`, `accessibility`, `dataviz`, `rsc`, `zero-dependency`, `typescript`.
- GitHub Pages or domain link points to docs.
- Discussions categories: Q&A, Show and tell, Chart requests.
- Issue templates require data shape and intended chart context.
- Releases include screenshots/OG images for major features.

Acceptance:

- `npm view @microcharts/react` shows docs homepage, repository, keywords, license, provenance.
- `publint` and `attw` are green.
- `npm pack --dry-run` contains README, license, dist, styles only.
- GitHub repo social preview image matches docs OG.

## 11. Technical SEO Gates

Build-time checks:

```ts
// docs/tests/metadata.test.ts
import { describe, expect, it } from "vitest";

const routes = [
  "/",
  "/docs",
  "/docs/quickstart",
  "/docs/charts/sparkline",
  "/docs/accessibility",
  "/docs/performance",
];

describe("docs metadata", () => {
  it.each(routes)("has complete metadata for %s", async route => {
    const html = await renderRoute(route);
    expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toMatch(/<meta property="og:image" content="https:\/\//);
    expect(html).toMatch(/<script type="application\/ld\+json">/);
    expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
  });
});
```

The `renderRoute` helper can be implemented with the actual docs build output once the docs app exists. Until then, keep this as a required test shape.

CI checklist:

- Build docs statically.
- Validate all internal links.
- Validate sitemap URLs return 200.
- Validate `robots.txt` references sitemap and does not block docs assets.
- Validate `/llms.txt`, `/llms-full.txt`, `.md` pages, catalog JSON, and schema JSON return 200.
- Validate metadata for every indexable page.
- Validate image paths in metadata return 200.
- Validate JSON-LD parses.
- Run axe on key routes.
- Run Lighthouse or Playwright performance smoke for home/docs/gallery.

`robots.txt`:

```txt
User-agent: *
Allow: /

Sitemap: https://microcharts.dev/sitemap.xml
Sitemap: https://microcharts.dev/image-sitemap.xml
```

Sitemap rules:

- Include only canonical indexable URLs.
- Exclude local playground state URLs unless they are curated examples.
- Include lastmod from source content or git commit time.
- Keep image sitemap for gallery and OG/chart images that should be discoverable.

Performance gates:

- Home route JS budget should stay close to static docs, not the whole gallery.
- Defer interactive playground JS below the fold.
- Gallery cards use static SVG by default.
- Core Web Vitals targets: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at p75.
- Lab smoke should fail if the home page ships a large client bundle for static content.

## 12. Accessibility For LLM And SEO Content

The docs site should teach and demonstrate accessible charts in a way machines can copy.

Rules:

- Every rendered chart example has nearby plain text explaining what the chart says.
- SVG examples keep `role="img"` and accessible names visible in code.
- Image examples use meaningful alt text or empty alt only for decoration.
- Do not use screenshots as the only way to show API output. Pair screenshots with code and text.
- Every chart page includes the default generated summary example.

Example docs block:

````md
The chart is announced as: "Weekly revenue. Trending up 200%. Range 3 to 9. Last value 9." (Docs must quote the REAL `describeSeries` output — docs-as-tests, never hand-written summaries that drift from the component.)

```tsx
<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />
```
````

Why this matters:

- Screen reader users get equivalent information.
- Search crawlers and LLM retrievers get the chart meaning without needing computer vision.
- Snippets and AI answers can quote the same summary that the component uses.

## 13. Analytics And Feedback Loop

Use privacy-light instrumentation. Do not add heavy analytics that hurts the performance story.

Required accounts/tools:

- Google Search Console.
- Bing Webmaster Tools.
- npm package stats.
- GitHub traffic and stars.
- Docs analytics with page path, referrer, UTM, and outbound clicks.
- Social preview debug tools during launch.

Metrics:

- Organic clicks and impressions by query.
- Indexed pages count vs sitemap pages count.
- Top docs pages by organic entry.
- npm downloads by version.
- GitHub stars/watchers/forks.
- README to docs CTR via UTM.
- Docs to npm/GitHub outbound CTR.
- `llms.txt`, `.md`, catalog, schema request counts.
- 404s from docs, package links, and old routes.
- Search terms with no docs result.

Review cadence:

- Daily for first launch week.
- Weekly for first month.
- Monthly after stable release.

Action rules:

- If a page gets impressions but low CTR, rewrite title/description and OG title.
- If a query gets impressions but wrong landing page, add internal links from the ranking page to the intended page.
- If LLM tools frequently fetch `/llms-full.txt`, prioritize keeping it compact and current.
- If agents invent props, add explicit negative examples and schema descriptions.
- If users search unsupported charts, route to documented replacements instead of adding charts reactively.

## 14. Launch Momentum Plan

The launch should have multiple artifacts that each stand alone.

P0 before public announcement:

1. Home page with five live v1 charts and one sentence value prop.
2. Quickstart with RSC-safe static chart and interactive chart.
3. Sparkline, SparkBar, Delta, Bullet, ActivityGrid docs pages.
4. Accessibility page with generated summaries and forced-color examples.
5. Performance page with reproducible size and SSR benchmark commands.
6. Gallery page with all planned chart types clearly marked by status.
7. `/llms.txt`, `/llms-full.txt`, `.md` mirrors, catalog JSON, schema JSON.
8. OG images for home, chart pages, accessibility, performance, and gallery.
9. README with rendered examples and links to docs.
10. Search Console and sitemap submitted.

P1 launch week:

1. Show HN post focused on one falsifiable claim: "RSC-safe accessible React microcharts with zero runtime dependencies."
2. GitHub discussion post: "Show us where tiny charts belong."
3. Blog post: accessibility summaries as the differentiator.
4. Blog post: performance and zero-dependency benchmark.
5. Social thread with each post linking to a live example page, not screenshots only.
6. Submit `llms.txt` to public directories once stable.
7. Ask early users to share screenshots of table cells, KPI cards, docs, and AI UIs.

P2 after first traction:

1. Add chart-as-URL badge endpoint.
2. Add `microcharts/string`.
3. Add CLI `render` and `catalog`.
4. Add example MCP server.
5. Add registry recipes for common UI contexts.
6. Publish comparison pages with measured data.

## 15. Actionable Backlog

### P0 - Launch Blockers

- Create docs app with static/SSR rendering and no client-only primary content.
- Implement shared `docsMeta()` helper and use it on every route.
- Implement JSON-LD helpers for breadcrumbs, TechArticle, and source/package pages.
- Generate `sitemap.xml`, `image-sitemap.xml`, and `robots.txt`.
- Generate `/llms.txt`, `/llms-full.txt`, and `.md` mirrors.
- Generate `catalog.json` from chart registry and validate against exports.
- Publish `microcharts.schema.json` for the plan/14 chart spec once implemented.
- Add metadata/link/JSON-LD tests for built docs routes.
- Create OG image template and at least route-specific images for launch pages.
- Update package metadata to point `homepage` to docs domain before stable public release.
- Add README links to docs, `llms.txt`, schema, and catalog.

### P1 - First Month

- Add comparison pages for `react-sparklines`, Recharts, and Tremor only after measured data is available.
- Add benchmark page with raw output artifacts and reproduction commands.
- Add docs search analytics and no-result tracking.
- Add LLM eval prompts and manual quarterly scorecard.
- Add curated AI prompt snippet for generating valid `microchart` fenced blocks.
- Add public examples for AI chat renderers, MDX, and README badges.

### P2 - v1.x Distribution

- Add `microcharts/string`.
- Add chart-as-URL endpoint template.
- Add CLI `render`, `catalog`, and `doctor`.
- Add shadcn-style registry recipes for wrappers, not core chart internals.
- Add example MCP server with validate/render/list/example tools.
- Add MCP server-card/catalog metadata if remote MCP is hosted.

### P3 - Only If Traction Supports It

- Figma/vector paste plugin.
- Web Component wrapper.
- Hosted chart image service.
- Public gallery submission/community presets.
- Docs localization.

## 16. Anti-Patterns To Avoid

- Do not ship MCP as a docs-search wrapper.
- Do not ship a CLI that only installs the package.
- Do not put all demos behind client-side JavaScript.
- Do not make generic SEO pages with no runnable examples.
- Do not use social images that are only logo/title cards. Show the product.
- Do not create comparison pages without measured, reproducible facts.
- Do not let docs examples drift from compiled fixtures.
- Do not hand-maintain `llms-full.txt`, catalog, schema examples, sitemap, or OG route lists.
- Do not add runtime dependencies to the React package for docs/distribution features.
- Do not let planned chart pages look shipped before exports exist.

## 17. Definition Of Done

The discoverability layer is done for launch when:

- Search crawler: every important page has static HTML, unique metadata, canonical URL, sitemap entry, JSON-LD, and no broken internal links.
- LLM crawler: `/llms.txt`, `/llms-full.txt`, `.md` mirrors, catalog JSON, and schema JSON all return 200 and are generated from canonical sources.
- Developer registry: npm metadata, README, GitHub topics, docs links, and package exports tell the same story.
- Social unfurlers: home, quickstart, chart, accessibility, performance, and gallery pages render useful cards with product visuals.
- Accessibility: every visual example has a text equivalent that humans, screen readers, search engines, and LLMs can consume.
- Performance: docs pages hit Core Web Vitals targets in lab smoke and are ready for field monitoring.
- Hype factor: launch artifacts demonstrate a working product, measured claims, and unusual use cases instead of slogans.
