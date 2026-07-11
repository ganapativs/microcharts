import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { docsImageRoute, docsRoute } from "./shared";
import { expandComponents } from "./md-transform";

// https://fumadocs.dev/docs/headless/source-api
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [],
});

export function getPageImage(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "image.png"];
  return {
    segments,
    url: `${docsImageRoute}/${segments.join("/")}`,
  };
}

/**
 * Public Markdown-mirror URL for a docs page — the AI-native convention of
 * appending `.md` to the human URL (`/docs/ai` → `/docs/ai.md`). This is what we
 * advertise in llms.txt, the page's `<link rel="alternate">`, and the copy/open
 * affordances. It is served in dev by a rewrite and in the static build by
 * `scripts/gen-md-mirrors.mjs`, both pointing at the internal content route.
 */
export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]) {
  const slugs = page.slugs;
  return {
    url: slugs.length ? `${docsRoute}/${slugs.join("/")}.md` : `${docsRoute}.md`,
  };
}

/** Segments for the internal content route (`/llms.mdx/docs/<slug>/content.md`),
 *  the source the `.md` mirror is rewritten from / generated from. */
export function markdownRouteSegments(page: (typeof source)["$inferPage"]) {
  return [...page.slugs, "content.md"];
}

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = await page.data.getText("processed");
  return `# ${page.data.title} (${page.url})\n\n${expandComponents(processed)}`;
}
