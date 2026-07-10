import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STABLE_CHARTS } from "./charts/registry";
import type { ChartCollection } from "./charts/types";

// The gallery sorts charts by collection (core → decision → expressive →
// frontier), registry order within. The sidebar (content/docs/charts/meta.json)
// must present the SAME sequence — two orders for one catalog reads as a bug.

const RANK: Record<ChartCollection, number> = { core: 0, decision: 1, expressive: 2, frontier: 3 };

describe("sidebar order ↔ gallery order parity", () => {
  it("meta.json lists charts in collection-grouped registry order", () => {
    const meta = JSON.parse(
      readFileSync(resolve(process.cwd(), "content/docs/charts/meta.json"), "utf8"),
    ) as { pages: string[] };
    const sidebarCharts = meta.pages.filter((p) => p !== "index" && p !== "annotations");
    const galleryOrder = [...STABLE_CHARTS]
      .sort((a, b) => RANK[a.collection] - RANK[b.collection])
      .map((c) => c.slug);
    expect(sidebarCharts).toEqual(galleryOrder);
  });
});
