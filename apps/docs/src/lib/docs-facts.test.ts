import { describe, expect, it } from "vitest";
import { CATALOG, SIZE, SIZE_SPAN, BENCH, STATIC_SIZES } from "./docs-facts";
import { STABLE_CHARTS } from "./charts/registry";
import { CHART_GZIP } from "./stats";

// The guide pages quote these; assert they stay derived from reality, not typed.
describe("docs-facts derivations", () => {
  it("catalog total equals the stable registry", () => {
    expect(CATALOG.total).toBe(STABLE_CHARTS.length);
  });

  it("collection counts partition the catalog exactly", () => {
    const { core, decision, expressive, frontier } = CATALOG.collections;
    expect(core + decision + expressive + frontier).toBe(CATALOG.total);
  });

  it("size stats are drawn from the measured gzip of registry charts", () => {
    expect(SIZE.count).toBe(STATIC_SIZES.length);
    expect(SIZE.min).toBe(Math.min(...STATIC_SIZES));
    expect(SIZE.max).toBe(Math.max(...STATIC_SIZES));
    expect(SIZE.under3).toBeLessThanOrEqual(SIZE.count);
    // every "over 3 kB" entry is a real, larger-than-3 measured size
    for (const c of SIZE.over3) {
      expect(CHART_GZIP[c.slug]?.static).toBe(c.kB);
      expect(c.kB).toBeGreaterThan(3);
    }
  });

  // performance.mdx prose names these explicitly ("Nine charts sit above the 3 kB
  // reference line. Sparkline … is the largest; the rest are the value-series charts
  // that can host annotations … plus Station Glyph and Slope"). If the measured sizes
  // shift, the prose is stale — fail here so it gets revisited.
  it("matches the performance.mdx claim about the 3 kB line", () => {
    expect(SIZE.over3).toHaveLength(9);
    // over3 is largest-first — Sparkline leads, the annotation hosts + Station Glyph follow.
    expect(SIZE.over3[0]?.slug).toBe("sparkline");
    const over3Slugs = SIZE.over3.map((c) => c.slug).sort();
    expect(over3Slugs).toEqual(
      [
        "burn-chart",
        "change-point",
        "dual-sparkline",
        "forecast-cone",
        // Station Glyph and Slope crossed the line when their layout math moved into
        // geometry.ts to be shared with the interactive entry — the fix for overlays
        // being hit-tested against a different box than the one rendered.
        "slope",
        "spread-band",
        "sparkline",
        "station-glyph",
        "win-prob-worm",
      ].sort(),
    );
  });

  // The perf-page size table shows the catalog span, not a hand-picked few.
  it("size span is the real smallest / median / largest, drawn from every chart", () => {
    expect(SIZE_SPAN.map((s) => s.role)).toEqual(["smallest", "median", "largest"]);
    expect(SIZE_SPAN[0].kB).toBe(SIZE.min);
    expect(SIZE_SPAN[2].kB).toBe(SIZE.max);
    // median row is the middle of all measured sizes, so the table spans the set
    expect(SIZE_SPAN[1].kB).toBe(SIZE.median);
  });

  it("bench summary covers every stable chart and the scaling scenarios", () => {
    expect(BENCH.count).toBe(CATALOG.total);
    expect(BENCH.scenarios.map((s) => s.count)).toEqual([100, 500, 1000]);
    // belowFloor entries are honestly under their floor
    for (const b of BENCH.belowFloor) expect(b.rowsPerMs).toBeLessThan(b.floor);
  });
});
