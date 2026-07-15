import { describe, expect, it } from "vitest";
import { CHART_MODULES } from "./registry";
import { PREVIEW_LIVE } from "./preview-live.generated";

/** `preview-live.generated.ts` is a per-slug map of lazy `import()` loaders for
 *  each chart's interactive `PreviewLive`, consumed by the gallery stage so its
 *  initial client graph carries no interactive/motion chart code. It is checked
 *  in; regenerate with `pnpm gen:preview-live` when charts change. This guard
 *  fails if the map drifts from the live registry. */
describe("generated preview-live loader map", () => {
  it("has exactly the slugs whose module exports a PreviewLive (run `pnpm gen:preview-live` if this fails)", () => {
    const expected = Object.entries(CHART_MODULES)
      .filter(([, mod]) => typeof mod.PreviewLive === "function")
      .map(([slug]) => slug)
      .sort();
    expect(Object.keys(PREVIEW_LIVE).sort()).toEqual(expected);
  });

  it("every loader is a function", () => {
    for (const loader of Object.values(PREVIEW_LIVE)) {
      expect(typeof loader).toBe("function");
    }
  });
});
