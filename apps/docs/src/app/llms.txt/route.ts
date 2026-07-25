import { SITE, abs } from "@/lib/site";
import { STABLE_CHARTS } from "@/lib/catalog";
import { getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-static";

type Page = (typeof source)["$inferPage"];

/** Absolute URL of a docs page's Markdown mirror, or its HTML page as fallback. */
function mdUrl(slugs: string[]): string {
  const page = source.getPage(slugs);
  if (!page) return abs("/docs");
  return abs(getPageMarkdownUrl(page).url);
}

/**
 * Guide sections, derived from the docs sidebar (`content/docs/meta.json`)
 * rather than hand-listed, so every top-level guide page appears here and new
 * ones show up automatically. Chart pages live in a folder and are listed from
 * the catalog below, so they're skipped here.
 */
function guideSections(): { title: string; pages: Page[] }[] {
  const byUrl = new Map(source.getPages().map((p) => [p.url, p]));
  const sections: { title: string; pages: Page[] }[] = [{ title: "Start Here", pages: [] }];
  for (const node of source.getPageTree().children) {
    if (node.type === "separator") {
      sections.push({ title: typeof node.name === "string" ? node.name : "Guides", pages: [] });
      continue;
    }
    if (node.type !== "page") continue; // folders (charts) are covered by the catalog
    const page = byUrl.get(node.url);
    if (page) sections[sections.length - 1].pages.push(page);
  }
  return sections.filter((s) => s.pages.length > 0);
}

/** Curated LLM docs map. Full corpus lives at `/llms-full.txt`. */
export function GET() {
  const guideBlocks = guideSections()
    .map(
      (s) =>
        `## ${s.title}\n\n${s.pages
          .map(
            (p) =>
              `- [${p.data.title}](${abs(getPageMarkdownUrl(p).url)}): ${p.data.description ?? ""}`,
          )
          .join("\n")}`,
    )
    .join("\n\n");

  const chartLines = STABLE_CHARTS.map(
    (c) => `- [${c.name}](${mdUrl(["charts", c.slug])}): ${c.tagline}`,
  ).join("\n");

  const body = `# microcharts

> ${SITE.description}

Use \`${SITE.pkg}\` for React. Import individual charts from subpaths, for example
\`${SITE.pkg}/sparkline\`. Static entries are hook-free and React Server Component safe.
Interactive entries live under \`/interactive\` and share one interaction contract: hover or
arrow keys make a unit active, click/tap/Enter/Space selects and pins it, Escape clears,
Home/End jump to the ends. Read it with \`onActive(datum)\` and \`onSelect(datum)\`, payload
\`{ index, value, label?, formatted? }\` where \`value\` is the raw number and \`formatted\` is the
chart's ready-to-display string; control the pin with \`selectedIndex\` / \`defaultSelectedIndex\`.
Set \`readout={false}\` to hide the in-chart value chip and render \`datum.formatted\` yourself.
Single-unit scalar charts (Delta, Progress, StatusDot, Bullet, …) take \`onSelect\` only.
Theme with \`--mc-*\` CSS variables, or build a palette from one accent with \`defineTheme\` from
\`${SITE.pkg}/theme\`.

${guideBlocks}

## Charts

${chartLines}

## Machine Interfaces

- [Agent setup prompt](${abs("/agent-setup.md")}): paste-and-run setup for a coding agent — install, wire styles, record conventions.
- MCP server \`@microcharts/mcp\` (\`npx -y @microcharts/mcp\`, stdio): tools \`find_microchart\`, \`get_microchart\`, \`render_microchart\`; resources \`microcharts://catalog\`, \`microcharts://agent-setup\`. Docs: ${mdUrl(["mcp"])}. Prefer calling it over re-reading the catalog when your client can spawn an MCP server.
- [Chart catalog JSON](${abs("/catalog.json")}): names, import paths, props, data shapes.
- [Catalog JSON Schema](${abs("/catalog.schema.json")}): the contract the catalog validates against.
- [Full docs context](${abs("/llms-full.txt")}): complete generated docs text.

## Does Not Support

- No pie, needle-gauge/speedometer, battery, waffle, or violin. Part-to-whole at this size is [SegmentedBar](${mdUrl(["charts", "segmented-bar"])}) (comparative) or [MicroDonut](${mdUrl(["charts", "micro-donut"])}) (capped icon-size mix); measure-vs-target is [Bullet](${mdUrl(["charts", "bullet"])}) or [TapeGauge](${mdUrl(["charts", "tape-gauge"])}).
- No runtime dependencies. Never add one to render a chart.
- Static charts ship no client JavaScript. Interactivity is a separate \`/interactive\` import.
- No per-point event handlers, and no wrapping a chart in your own click target. A chart owns its whole gesture surface; use \`onActive\` / \`onSelect\` on the \`/interactive\` entry.
- \`onPointFocus\` and \`onRunFocus\` were removed. Use \`onActive\` — same signal, one name across the catalog.
- Not every chart is interactive. [WindBarb](${mdUrl(["charts", "wind-barb"])}) is static-only; [MinimapStrip](${mdUrl(["charts", "minimap-strip"])}) is a range slider with \`onWindowChange([lo, hi])\` rather than a unit picker.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
