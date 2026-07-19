import { readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CHART_MODULES } from "./registry";
import { PREVIEW_LIVE } from "./preview-live.generated";

const chartsDir = dirname(fileURLToPath(import.meta.url));

/** `preview-live.generated.ts` is a per-slug map of lazy `import()` loaders for
 *  each chart's interactive `PreviewLive`, consumed by the gallery stage so its
 *  initial client graph carries no interactive/motion chart code. It is checked
 *  in; regenerate with `pnpm gen:preview-live` when charts change.
 *
 *  The source of truth is the set of `<slug>.live.tsx` halves on disk, NOT the
 *  registry: `registry.ts` deliberately imports the STATIC halves, which carry
 *  no `PreviewLive` (see `ChartModuleStatic`). Asserting against the registry
 *  here would silently pass on an empty map. */
describe("generated preview-live loader map", () => {
  const liveSlugs = readdirSync(chartsDir)
    .filter((f) => f.endsWith(".live.tsx"))
    .map((f) => f.replace(/\.live\.tsx$/, ""))
    .sort();

  it("has exactly the slugs with a live half (run `pnpm gen:preview-live` if this fails)", () => {
    expect(Object.keys(PREVIEW_LIVE).sort()).toEqual(liveSlugs);
  });

  it("every loader is a function", () => {
    for (const loader of Object.values(PREVIEW_LIVE)) {
      expect(typeof loader).toBe("function");
    }
  });

  /** The split's load-bearing invariant: if a static half ever regains a
   *  `PreviewLive`, it has an interactive import again, and every route whose
   *  server graph touches the registry pays for all 106 interactive twins. */
  it("no static module exports a PreviewLive", () => {
    const leaked = Object.entries(CHART_MODULES)
      .filter(([, mod]) => typeof (mod as { PreviewLive?: unknown }).PreviewLive === "function")
      .map(([slug]) => slug);
    expect(leaked).toEqual([]);
  });

  /** Every chart with an interactive entry should have a live half — otherwise
   *  it silently loses its live preview in the gallery and the playground. */
  it("every chart with an interactiveImport has a live half", () => {
    const missing = Object.values(CHART_MODULES)
      .filter((mod) => mod.entry.interactiveImport)
      .map((mod) => mod.entry.slug)
      .filter((slug) => !liveSlugs.includes(slug));
    expect(missing).toEqual([]);
  });
});
