import { describe, expect, it } from "vitest";
import {
  CATALOG,
  SIZE,
  SIZE_SPAN,
  BENCH,
  STATIC_SIZES,
  INTERACTIVE_SIZES,
  SIZE_MARKETING,
} from "./docs-facts";
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
    expect(SIZE.interactiveCount).toBe(INTERACTIVE_SIZES.length);
    expect(SIZE.interactiveMin).toBe(Math.min(...INTERACTIVE_SIZES));
    expect(SIZE.interactiveMax).toBe(Math.max(...INTERACTIVE_SIZES));
    expect(SIZE.under3).toBeLessThanOrEqual(SIZE.count);
    // every "over 3 kB" entry is a real, larger-than-3 measured size
    for (const c of SIZE.over3) {
      expect(CHART_GZIP[c.slug]?.static).toBe(c.kB);
      expect(c.kB).toBeGreaterThan(3);
    }
  });

  it("marketing band is interactive-first and covers measured ranges", () => {
    expect(SIZE_MARKETING).toBe("~2–7 kB interactive · ~1–4 kB static");
    expect(SIZE.interactiveMin).toBeGreaterThanOrEqual(1.5);
    expect(SIZE.interactiveMax).toBeLessThanOrEqual(7);
    expect(SIZE.min).toBeGreaterThanOrEqual(0.5);
    expect(SIZE.max).toBeLessThanOrEqual(4.5);
  });

  // performance.mdx prose names these explicitly ("Thirty-two charts sit above the
  // 3 kB reference line … Sparkline is the largest"). If the measured sizes shift,
  // the prose is stale — fail here so it gets revisited.
  it("matches the performance.mdx claim about the 3 kB line", () => {
    expect(SIZE.over3).toHaveLength(33);
    // over3 is largest-first — Sparkline leads.
    expect(SIZE.over3[0]?.slug).toBe("sparkline");
    // The prose quotes how far the largest sits over the line; docs-claims.test.ts
    // derives that figure from SIZE.max, so pin the two to the same chart here
    // rather than repeating the number and letting it rot.
    expect(Math.max(...SIZE.over3.map((c) => c.kB))).toBe(SIZE.max);
    const over3Slugs = SIZE.over3.map((c) => c.slug).sort();
    expect(over3Slugs).toEqual([
      "ab-strips",
      "benchmark-strip",
      "burn-chart",
      "change-point",
      "constellation",
      "control-strip",
      "cycle-plot",
      "dual-sparkline",
      "dumbbell",
      "ensemble-ghosts",
      "error-budget",
      "event-timeline",
      "forecast-cone",
      "graded-band",
      "likert-strip",
      "mini-bar",
      "net-flow",
      "percentile-ladder",
      "percentile-trace",
      "polar-clock",
      "queue-depth",
      "retention-curve",
      "shift-histogram",
      "slope",
      "sparkbar",
      "sparkline",
      "spread-band",
      "stacked-area",
      "station-glyph",
      "tape-gauge",
      "volume-profile",
      "waterfall",
      "win-prob-worm",
    ]);
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
