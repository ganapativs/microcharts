import { describe, expect, it } from "vitest";
import { CATALOG, SIZE, BENCH, STATIC_SIZES } from "./docs-facts";
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

  it("bench summary covers every stable chart and the scaling scenarios", () => {
    expect(BENCH.count).toBe(CATALOG.total);
    expect(BENCH.scenarios.map((s) => s.count)).toEqual([100, 500, 1000]);
    // belowFloor entries are honestly under their floor
    for (const b of BENCH.belowFloor) expect(b.rowsPerMs).toBeLessThan(b.floor);
  });
});
