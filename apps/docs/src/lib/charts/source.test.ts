import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARTS, STABLE_CHARTS } from "@/lib/charts/entries";
import { chartSourcePath, chartSourceUrl } from "@/lib/charts/source";

// Every chart page links to its implementation folder. The link is derived from
// the slug, so a chart whose folder is named anything else ships a 404 that no
// build step would notice.
const repoRoot = resolve(process.cwd(), "../..");

describe("chart source links", () => {
  it("covers the whole catalog", () => {
    expect(STABLE_CHARTS.length).toBeGreaterThan(100);
  });

  it.each(STABLE_CHARTS.map((c) => c.slug))("%s has a source folder", (slug) => {
    expect(existsSync(resolve(repoRoot, chartSourcePath(slug), "index.tsx"))).toBe(true);
  });

  it("points at the folder on the default branch", () => {
    expect(chartSourceUrl("coverage-strip")).toBe(
      "https://github.com/ganapativs/microcharts/tree/main/src/charts/coverage-strip",
    );
  });

  it("has no planned chart without a folder", () => {
    const missing = CHARTS.filter(
      (c) => !existsSync(resolve(repoRoot, chartSourcePath(c.slug), "index.tsx")),
    ).map((c) => c.slug);
    expect(missing).toEqual([]);
  });
});
