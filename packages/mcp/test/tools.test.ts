import { describe, expect, it } from "vitest";
import { findChart } from "../src/tools/find";
import { getChart } from "../src/tools/get";

describe("find_microchart", () => {
  it("ranks sparkline for a trend question (stemmed match)", () => {
    const results = findChart("is it trending over time?");
    expect(results.length).toBeGreaterThan(0);
    expect(results.map((r) => r.slug)).toContain("sparkline");
    expect(results[0]?.why).toBeTruthy();
  });

  it("matches the docs 'compar' intent to comparison charts", () => {
    const results = findChart("compare two things");
    expect(results.length).toBeGreaterThan(0);
    // dumbbell / slope / paired-bars are the comparison marks.
    expect(results.some((r) => ["dumbbell", "slope", "paired-bars"].includes(r.slug))).toBe(true);
  });

  it("respects limit and only returns stable slugs", () => {
    const results = findChart("distribution", { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
    for (const r of results) expect(getChart(r.slug)?.status).toBe("stable");
  });

  it("filters by dataShape", () => {
    const results = findChart("trend", { dataShape: "number[]" });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(r.dataShape.toLowerCase()).toContain("number[]");
  });

  it("returns empty for gibberish", () => {
    expect(findChart("zzxqq qwptl")).toEqual([]);
  });
});

describe("get_microchart", () => {
  it("returns full wiring for sparkline", () => {
    const g = getChart("sparkline");
    expect(g).toBeDefined();
    expect(g?.staticImport).toBe("@microcharts/react/sparkline");
    expect(g?.props.some((p) => p.name === "data")).toBe(true);
    expect(g?.sharedProps.length).toBeGreaterThan(0);
    expect(g?.example.code).toContain("Sparkline");
  });

  it("prepends sample-data defs into a runnable example", () => {
    // Pick any chart that references named sample data in its snippet.
    const g = getChart("waterfall");
    expect(g?.example.code).toContain("Waterfall");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getChart("does-not-exist")).toBeUndefined();
  });
});
