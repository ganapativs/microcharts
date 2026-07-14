import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { mirrorFor } from "../../scripts/gen-md.ts";

const contentDir = fileURLToPath(new URL("../../content/docs", import.meta.url));

/** Every `.mdx` under content/docs, as a content-relative path sans extension. */
function contentRels(dir: string = contentDir, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) contentRels(p, acc);
    else if (name.endsWith(".mdx")) acc.push(relative(contentDir, p).replace(/\.mdx$/, ""));
  }
  return acc;
}

/**
 * Guards the `.md` mirror mapping (`scripts/gen-md.ts`). A `…/index.mdx` file
 * routes to its parent segment in Fumadocs, so its mirror must too — otherwise
 * the page's `.md` link 404s (regression: `charts/index.mdx` once emitted
 * `/docs/charts/index.md` while the page lived at `/docs/charts`).
 */
describe("markdown mirror mapping", () => {
  it.each([
    ["index", "/docs", "docs.md"],
    ["ai", "/docs/ai", "docs/ai.md"],
    ["charts/index", "/docs/charts", "docs/charts.md"],
    ["charts/sparkline", "/docs/charts/sparkline", "docs/charts/sparkline.md"],
  ])("%s → %s", (rel, url, targetRel) => {
    expect(mirrorFor(rel)).toEqual({
      slug: url === "/docs" ? "" : url.slice("/docs/".length),
      url,
      targetRel,
    });
  });

  it("never routes a real page to a `/index` URL or file", () => {
    const rels = contentRels();
    expect(rels.length).toBeGreaterThan(0);
    for (const rel of rels) {
      const { url, targetRel } = mirrorFor(rel);
      expect(url.endsWith("/index"), `${rel} → ${url}`).toBe(false);
      expect(targetRel.includes("/index."), `${rel} → ${targetRel}`).toBe(false);
    }
  });
});
