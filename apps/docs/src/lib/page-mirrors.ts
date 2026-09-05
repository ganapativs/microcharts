/**
 * Markdown twins for the pages that are React, not MDX.
 *
 * `scripts/gen-md.ts` mirrors everything under `content/docs`. The home page,
 * the chart index, the examples and the brand page have no MDX behind them, so
 * their twins are built here from the same registries the pages render from —
 * `STABLE_CHARTS`, `COLLECTIONS`, `SHOWCASE`, `CATALOG` — and served by route
 * handlers at `/index.md`, `/charts.md`, `/examples.md` and `/brand.md`.
 *
 * That matters for one specific caller: `Accept: text/markdown` on `/` used to
 * fall through to HTML, because `/` had no twin to serve. Every page route on
 * the site now negotiates.
 */
import { notFound, problemMarkdown } from "./agent-errors";
import { STABLE_CHARTS } from "./catalog";
import { COLLECTIONS } from "./collections";
import { CATALOG, SIZE, SIZE_MARKETING } from "./docs-facts";
import { SHOWCASE } from "./showcase";
import { SITE, abs } from "./site";

/** The block every twin ends with: where to go for the machine-readable set. */
function machineSurfaces(): string {
  return [
    "## Machine-readable surfaces",
    "",
    `- [${abs("/llms.txt")}](${abs("/llms.txt")}) — index of this site, written for agents.`,
    `- [${abs("/llms-full.txt")}](${abs("/llms-full.txt")}) — every documentation page as one file.`,
    `- [${abs("/catalog.json")}](${abs("/catalog.json")}) — all ${CATALOG.total} chart types with props and data shapes.`,
    `- [${abs("/api/charts.json")}](${abs("/api/charts.json")}) — the same catalog as an index, one chart per fetch.`,
    `- [${abs("/openapi.json")}](${abs("/openapi.json")}) — OpenAPI 3.1 description of every endpoint here.`,
    `- [${abs("/agent-setup.md")}](${abs("/agent-setup.md")}) — paste-and-run setup prompt for a coding agent.`,
    "",
    "Any page on this site answers `Accept: text/markdown` with its Markdown twin, and every twin is also fetchable by adding `.md` to the URL.",
  ].join("\n");
}

/** `/` — what the library is, how to install it, where everything else lives. */
export function homeMarkdown(): string {
  return `# ${SITE.name} (${SITE.url})

> ${SITE.description}

microcharts renders charts small enough to sit inside a sentence, a table cell, a KPI card, or a streamed model reply. Each chart type is one import from its own subpath, so a page pays for the marks it uses and nothing else.

## Install

\`\`\`bash
npm i ${SITE.pkg}
\`\`\`

## Render one

\`\`\`tsx
import { Sparkline } from "${SITE.pkg}/sparkline";
import "${SITE.pkg}/styles.css";

export function Revenue() {
  return <Sparkline data={[128, 131, 129, 138, 141, 139, 148, 152]} title="Revenue" />;
}
\`\`\`

Pass \`data\` and you get something correct. After that, \`domain\`, \`color\`, \`title\`, \`format\` and \`label\` mean the same thing on every chart.

## What ships

- **${CATALOG.total} chart types**, one grammar between them. Sparklines, bars, bullets, heat strips, box plots, donuts, hypnograms, and the rest of the catalog.
- **Zero runtime dependencies.** React is the only peer. Scales, paths, easing, color, statistics and summaries are all in-house.
- **${SIZE_MARKETING}**, gzipped, per chart. The median static chart is ${SIZE.median} kB.
- **Accessible by default.** Every chart is \`role="img"\` with a natural-language summary generated from the data. Direction and state are never color alone.
- **Server-component safe.** Default exports are hook-free pure SVG with zero client JavaScript. Interactivity is a separate \`/interactive\` import.

## Read next

- [Quickstart](${abs("/docs/quickstart")}) — install, wire the stylesheet, render the first chart.
- [All charts](${abs("/docs/charts")}) — every type, filed by the question it answers.
- [Chart index](${abs("/charts")}) — the catalog at a glance.
- [When to use it](${abs("/docs/when-to-use")}) — and when a full chart library is the right call.
- [AI-native](${abs("/docs/ai")}) — emitting charts from a model, and the MCP server.
- [Examples](${abs("/examples")}) — seven deployed apps that install the package from npm.

${machineSurfaces()}
`;
}

/** `/charts` — the catalog, by collection. */
export function chartsMarkdown(): string {
  const shelves = COLLECTIONS.map((collection) => {
    const rows = STABLE_CHARTS.filter((c) => c.collection === collection.key)
      .map((c) => `- [${c.name}](${abs(`/docs/charts/${c.slug}.md`)}) — ${c.tagline}`)
      .join("\n");
    return `### ${collection.label}\n\n${collection.blurb}\n\n${rows}`;
  }).join("\n\n");

  return `# Chart index (${abs("/charts")})

All ${CATALOG.total} chart types in \`${SITE.pkg}\`, filed by collection. Each link goes to that chart's documentation as Markdown; drop the \`.md\` for the page.

Import a chart from its own subpath — \`${SITE.pkg}/sparkline\` — and add \`/interactive\` only when you need hover, keyboard, touch or selection.

## Collections

${shelves}

${machineSurfaces()}
`;
}

/** `/examples` — the deployed apps. */
export function examplesMarkdown(): string {
  const apps = SHOWCASE.map(
    (app) =>
      `### ${app.name}\n\n${app.blurb}\n\n${app.story}\n\n- Live: [${app.host}](${app.url})\n- Charts used: ${app.charts.length}\n- Detail page: [${abs(`/examples/${app.slug}`)}](${abs(`/examples/${app.slug}`)})`,
  ).join("\n\n");

  return `# Examples (${abs("/examples")})

${SHOWCASE.length} independent apps, each deployed and each installing \`${SITE.pkg}\` from npm the way you would. Between them they render every chart type in the catalog. The source for all of them sits in the repository beside the running site.

${apps}

${machineSurfaces()}
`;
}

/** `/brand` — the assets and how they may be used. */
export function brandMarkdown(): string {
  return `# Brand (${abs("/brand")})

Logos, wordmarks and color for writing about microcharts. The full set, including PNG exports, is on the [brand page](${abs("/brand")}) and in [microcharts-brand-kit.zip](${abs("/brand/microcharts-brand-kit.zip")}).

## Assets

- [Mark](${abs("/brand/mark.svg")}) — the glyph on its own. Adaptive, light, dark and monochrome cuts sit beside it.
- [Wordmark](${abs("/brand/wordmark.svg")}) — the name set as a drawn path, so it needs no font.
- [Lockup](${abs("/brand/lockup.svg")}) — mark and wordmark together, in the fixed relationship.

## Using them

- Use the mark, the lockup and the name to refer to microcharts: a badge, a slide, a post, an integration listing.
- Keep one cell-width of clear space on every side, and don't render the mark below 16 px.
- Take one of the supplied cuts. Don't recolor, rotate, stretch, or redraw the artwork.
- Don't use it as your own product's mark, or in a way that implies microcharts endorses what you ship.
- The name is lowercase, always: microcharts.
- The package is \`${SITE.pkg}\`, and the site is ${SITE.url}.
- The code is MIT. The artwork is not: the terms above are the summary, and [LICENSE.txt](${abs("/brand/LICENSE.txt")}) is the whole of them.

${machineSurfaces()}
`;
}

/** `/404.md` — the recovery note, as a static file for hosts with no Worker. */
export function notFoundMarkdown(): string {
  return problemMarkdown(notFound({ path: null, origin: SITE.url }));
}
