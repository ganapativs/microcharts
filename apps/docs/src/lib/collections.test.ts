import { describe, expect, it } from "vitest";
import { COLLECTIONS, COLLECTION_KEYS, getCollection, isChartCollection } from "@/lib/collections";
import { CATALOG } from "@/lib/docs-facts";

describe("chart collections", () => {
  it("covers every catalog shelf exactly once", () => {
    expect(COLLECTION_KEYS).toEqual(["core", "decision", "expressive", "frontier"]);
    expect(COLLECTIONS).toHaveLength(4);
  });

  it("has unique SEO copy per hub", () => {
    const titles = new Set(COLLECTIONS.map((c) => c.title));
    const intros = new Set(COLLECTIONS.map((c) => c.intro));
    expect(titles.size).toBe(4);
    expect(intros.size).toBe(4);
    for (const c of COLLECTIONS) {
      expect(c.description.length).toBeGreaterThan(80);
      expect(c.intro.length).toBeGreaterThan(80);
      expect(c.description).toContain(String(CATALOG.collections[c.key]));
    }
  });

  it("resolves keys", () => {
    expect(isChartCollection("core")).toBe(true);
    expect(isChartCollection("nope")).toBe(false);
    expect(getCollection("decision")?.label).toBe("Decision");
  });
});
