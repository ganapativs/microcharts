import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Runs against the static export in out/. Skips (as passing) until a build
// exists so `vitest` is green in a fresh checkout; CI runs it after `next build`.
// Tests run with cwd = apps/docs (the workspace package).
const outDir = resolve(process.cwd(), "out") + "/";
const hasBuild = existsSync(outDir);

// Static export emits `<route>.html` (trailingSlash: false); root stays index.html.
const routes = [
  "index.html",
  "docs.html",
  "docs/quickstart.html",
  "docs/charts/sparkline.html",
  "docs/accessibility.html",
  "docs/performance.html",
  "charts.html",
];

describe.skipIf(!hasBuild)("built docs metadata", () => {
  it.each(routes)("%s has complete, non-conflicting metadata", (route) => {
    const html = readFileSync(outDir + route, "utf8");
    expect(html.match(/<link rel="canonical"/g) ?? []).toHaveLength(1);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
    expect(html).toMatch(/property="og:image"[^>]*content="https:\/\//);
    expect(html).toMatch(/<script type="application\/ld\+json">/);
    expect(html).toMatch(/<h1[^>]*>/);
    expect(html).not.toMatch(/name="robots" content="noindex/);
  });

  it("llms.txt and catalog json are emitted", () => {
    expect(existsSync(outDir + "llms.txt")).toBe(true);
    expect(existsSync(outDir + "catalog.json")).toBe(true);
    // the catalog's `$schema` target must ship alongside it (copied from public/)
    expect(existsSync(outDir + "catalog.schema.json")).toBe(true);
  });
});
