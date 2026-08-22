import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildOpenApi } from "./openapi.ts";
import { STABLE_CHARTS } from "./catalog.ts";
import { SITE } from "./site.ts";

/**
 * The agent-facing surface, checked against a real export.
 *
 * Everything else in this directory tests a builder in isolation. This file
 * tests that what the builders describe actually shipped: every path the
 * OpenAPI document advertises resolves to a file in `out/`, every Markdown twin
 * exists beside the page it mirrors, and the documents on disk are the ones the
 * current source produces.
 *
 * Skipped without a build, like `metadata.test.ts` — `pnpm build` first.
 */
const out = fileURLToPath(new URL("../../out", import.meta.url));
const hasBuild = existsSync(out);
const read = (rel: string) => readFileSync(join(out, rel), "utf8");
const exists = (rel: string) => existsSync(join(out, rel));

/** Resolve a URL path the way Cloudflare's asset store does. */
function resolves(path: string): boolean {
  const clean = path === "/" ? "/index.html" : path;
  return exists(clean) || exists(`${clean}.html`) || exists(`${clean}/index.html`);
}

describe.skipIf(!hasBuild)("the built agent surface", () => {
  it("publishes the OpenAPI document the source describes", () => {
    expect(JSON.parse(read("openapi.json"))).toEqual(buildOpenApi());
  });

  it("ships every path the OpenAPI document advertises", () => {
    const doc = buildOpenApi();
    const missing = Object.keys(doc.paths)
      .map((path) => path.replace("{slug}", STABLE_CHARTS[0].slug))
      .filter((path) => !resolves(path));
    expect(missing).toEqual([]);
  });

  it.each([
    "index.md",
    "charts.md",
    "examples.md",
    "brand.md",
    "contact.md",
    "privacy.md",
    "404.md",
    "docs.md",
    "docs/ai.md",
  ])("mirrors %s", (file) => {
    expect(exists(file), file).toBe(true);
    expect(read(file).startsWith("# "), file).toBe(true);
  });

  it("gives every mirrored page an HTML twin at the same route", () => {
    for (const page of ["index", "charts", "examples", "brand", "contact", "privacy"]) {
      expect(exists(`${page}.html`), page).toBe(true);
    }
  });

  it("slices the catalog into one document per chart", () => {
    const index = JSON.parse(read("api/charts.json"));
    expect(index.count).toBe(STABLE_CHARTS.length);
    expect(index.charts.length).toBe(STABLE_CHARTS.length);

    for (const chart of STABLE_CHARTS) {
      const file = `api/charts/${chart.slug}.json`;
      expect(exists(file), file).toBe(true);
    }
  });

  it("keeps a per-chart document small enough to be worth fetching", () => {
    const one = statSync(join(out, `api/charts/${STABLE_CHARTS[0].slug}.json`)).size;
    const whole = statSync(join(out, "catalog.json")).size;
    expect(one).toBeLessThan(whole / 10);
  });

  it("carries the chart's own props, not just a pointer", () => {
    const doc = JSON.parse(read("api/charts/sparkline.json"));
    expect(doc.chart.slug).toBe("sparkline");
    expect(doc.chart.props.length).toBeGreaterThan(0);
    expect(doc.sharedProps.length).toBeGreaterThan(0);
    expect(doc.howToRead).toBeTruthy();
  });

  it("serves the MCP server card at the well-known path", () => {
    const card = JSON.parse(read(".well-known/mcp/server-card.json"));
    expect(card.name).toBe("io.github.ganapativs/microcharts");
    expect(card.packages[0].transport.type).toBe("stdio");
    // The bytes are the published registry manifest, not a copy of it.
    const manifest = readFileSync(
      fileURLToPath(new URL("../../../../packages/mcp/server.json", import.meta.url)),
      "utf8",
    );
    expect(read(".well-known/mcp/server-card.json")).toBe(manifest);
  });

  it("lists the trust pages in the sitemap", () => {
    const sitemap = read("sitemap.xml");
    for (const path of ["/contact", "/privacy"]) {
      expect(sitemap, path).toContain(`<loc>${SITE.url}${path}</loc>`);
    }
  });

  it("gives the trust pages enough text to be worth checking", () => {
    for (const page of ["contact", "privacy"]) {
      const text = read(`${page}.html`)
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<style[\s\S]*?<\/style>/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      expect(text.length, page).toBeGreaterThan(500);
    }
  });

  it("advertises the Markdown twin in the head of every mirrored page", () => {
    for (const [page, mirror] of [
      ["index", "/index.md"],
      ["charts", "/charts.md"],
      ["contact", "/contact.md"],
      ["privacy", "/privacy.md"],
    ]) {
      expect(read(`${page}.html`), page).toContain(`${SITE.url}${mirror}`);
    }
  });

  it("names the new surfaces in llms.txt", () => {
    const llms = read("llms.txt");
    for (const path of ["/openapi.json", "/api/charts.json", "/404.md", "/contact.md"]) {
      expect(llms, path).toContain(`${SITE.url}${path}`);
    }
  });

  it("resolves every site URL llms.txt points at", () => {
    const llms = read("llms.txt");
    const origin = SITE.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const paths = [...llms.matchAll(new RegExp(origin + "([^)\\s`]*)", "g"))]
      .map((m) => m[1].replace(/[.,;:]+$/, ""))
      .filter((p) => p.length > 0 && !p.includes("<slug>"));
    const missing = [...new Set(paths)].filter((p) => !resolves(p));
    expect(missing).toEqual([]);
  });
});
