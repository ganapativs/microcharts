import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { CHART_MODULE_LAZY } from "./modules.generated";
import { CHART_MODULES } from "./registry";

/**
 * These guards protect the docs site's biggest measured performance property:
 * NO `'use client'` module may reach `lib/charts/registry`. The registry
 * statically imports all 106 chart modules, and each of those imports its
 * chart's static AND interactive entry — so a single client-side registry
 * import costs a route ~311 kB gzip of chart code it will never render.
 *
 * Client code resolves modules through `CHART_MODULE_LAZY` (one chunk per
 * chart). If that map drifts from the registry, a chart silently disappears
 * from a page — hence these.
 */
describe("lazy chart module map", () => {
  it("covers exactly the registry's slugs", () => {
    expect(Object.keys(CHART_MODULE_LAZY).sort()).toEqual(Object.keys(CHART_MODULES).sort());
  });

  it("gives every slug its own distinct loader", () => {
    const loaders = new Set(Object.values(CHART_MODULE_LAZY));
    expect(loaders.size).toBe(Object.keys(CHART_MODULE_LAZY).length);
  });

  it("resolves a slug to that chart's module", async () => {
    const mod = await CHART_MODULE_LAZY.sparkline!();
    expect(mod.default.entry.slug).toBe("sparkline");
  });
});

/** Every source file under src/, recursively. */
function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, acc);
    else if ([".ts", ".tsx"].includes(extname(e.name)) && !e.name.includes(".test.")) acc.push(p);
  }
  return acc;
}

describe("the registry never crosses the client boundary", () => {
  // This is the guard that keeps every fix above from silently regressing. A
  // single `import { getModule } from "@/lib/charts/registry"` in a 'use client'
  // file puts all 106 chart modules — each with its interactive twin — into that
  // route's bundle. Measured cost when this last regressed: ~311 kB gzip on the
  // homepage and on all 106 chart doc pages.
  const src = join(import.meta.dirname, "..", "..");

  it("is imported only by server components", () => {
    const offenders = sourceFiles(src)
      .map((path) => ({ path, text: readFileSync(path, "utf8") }))
      .filter(({ text }) => /^["']use client["']/m.test(text))
      .filter(({ text }) =>
        /from\s+["'](@\/lib\/charts\/registry|\.\/registry|\.\.\/charts\/registry)["']/.test(text),
      )
      .map(({ path }) => relative(src, path));

    expect(
      offenders,
      `client files must resolve modules via CHART_MODULE_LAZY (use-chart-module) ` +
        `or a narrow hand-written map, never the full registry`,
    ).toEqual([]);
  });
});
