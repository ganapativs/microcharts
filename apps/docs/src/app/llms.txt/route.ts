import { SITE, abs } from "@/lib/site";
import { STABLE_CHARTS } from "@/lib/catalog";
import { getPageMarkdownUrl, source } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-static";

/** Absolute URL of a docs page's Markdown mirror, or its HTML page as fallback. */
function mdUrl(slugs: string[]): string {
  const page = source.getPage(slugs);
  if (!page) return abs("/docs");
  return abs(getPageMarkdownUrl(page).url);
}

/**
 * Curated LLM map (plan/20 §5.1) — a map, not a dump. Links resolve to Markdown
 * mirrors (200), plus explicit "does not support" notes to head off
 * hallucinations. `/llms-full.txt` carries the full generated context.
 */
export function GET() {
  const chartLines = STABLE_CHARTS.map(
    (c) => `- [${c.name}](${mdUrl(["charts", c.slug])}): ${c.tagline}`,
  ).join("\n");

  const body = `# microcharts

> ${SITE.description}

Use \`${SITE.pkg}\` for React. Import individual charts from subpaths, for example
\`${SITE.pkg}/sparkline\`. Static entries are hook-free and React Server Component safe.
Interactive entries live under \`/interactive\`.

## Start Here

- [Introduction](${mdUrl([])}): what microcharts is and why.
- [Quickstart](${mdUrl(["quickstart"])}): install, CSS import, first static and interactive chart.
- [Accessibility](${mdUrl(["accessibility"])}): data-generated summaries, keyboard, forced colors.

## Charts

${chartLines}

## Machine Interfaces

- [Chart catalog JSON](${abs("/microcharts.catalog.json")}): names, import paths, props, data shapes.
- [Full docs context](${abs("/llms-full.txt")}): complete generated docs text.

## Does Not Support

- No pie, gauge, donut, or radial charts — they read too slowly at this size. Use Bullet or Delta.
- No runtime dependencies. Never add one to render a chart.
- Static charts ship no client JavaScript. Interactivity is a separate \`/interactive\` import.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
