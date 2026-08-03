import { describe, expect, it } from "vitest";
import { CHART_MODULES } from "./registry";
import { CHART_MODULE_LAZY } from "./modules.generated";
import { buildDocsCode } from "./docs-code";
import { DOCS_CODE } from "./docs-code.generated";
import type { ChartModule } from "./types";

/** The modules a chart page really renders: the live half where there is one
 *  (it owns the playground's interactive snippet), the static half otherwise. */
async function liveModules(): Promise<Record<string, ChartModule>> {
  const live = await Promise.all(
    Object.entries(CHART_MODULE_LAZY).map(async ([slug, load]) => {
      const mod = (await load()).default;
      return [slug, mod] as const;
    }),
  );
  return { ...CHART_MODULES, ...Object.fromEntries(live) };
}

/** `docs-code.generated.ts` is the snapshot the Markdown mirrors read, because
 *  `md-transform.ts` must never import the 106-chart component graph (see
 *  `docs-code.ts`). It is checked in; regenerate with `pnpm gen:docs-code`.
 *  This guard fails if it drifts from the live registry. */
describe("generated chart docs-code snapshot", () => {
  it("matches the live modules exactly (run `pnpm gen:docs-code` if this fails)", async () => {
    expect(DOCS_CODE).toEqual(buildDocsCode(await liveModules()));
  });

  it("covers every chart, with a snippet in each shell", () => {
    const slugs = Object.keys(CHART_MODULES);
    expect(Object.keys(DOCS_CODE).sort()).toEqual([...slugs].sort());
    for (const slug of slugs) {
      const row = DOCS_CODE[slug]!;
      expect(row.playground.length, `${slug} playground`).toBeGreaterThan(0);
      expect(row.playground, `${slug} playground opens with the import`).toContain("import {");
      expect(row.recipes.length, `${slug} recipes`).toBeGreaterThan(0);
      expect(row.contexts.map((c) => c.label)).toEqual([
        "In a sentence",
        "In a table cell",
        "In a KPI card",
        "In a tab header",
      ]);
      for (const c of row.contexts) expect(c.code.length, `${slug} ${c.label}`).toBeGreaterThan(0);
    }
  });

  it("takes the playground snippet from the interactive entry when there is one", () => {
    expect(DOCS_CODE.sparkline!.playground).toContain('@microcharts/react/sparkline/interactive"');
    expect(DOCS_CODE["wind-barb"]!.playground).toContain(
      '@microcharts/react/wind-barb/interactive"',
    );
  });
});
