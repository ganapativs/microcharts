import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { benchmarkStripGeometry, empiricalPercentile } from "./geometry.js";

const base = { width: 80, height: 12 };
const PEERS = Array.from({ length: 40 }, (_, i) => i + 1); // 1..40

describe("empiricalPercentile (mid-rank rule)", () => {
  it("ties don't bias: value equal to some peers lands at the mid-rank", () => {
    expect(empiricalPercentile([10, 20, 30, 40, 50], 30)).toBe(50);
  });
  it("below the field → near 0, above → near 100", () => {
    expect(empiricalPercentile([10, 20, 30], 5)).toBe(0);
    expect(empiricalPercentile([10, 20, 30], 99)).toBe(100);
  });
});

describe("benchmarkStripGeometry", () => {
  it("nested bands: inner (p25–75) sits inside outer (p5–95)", () => {
    const geo = benchmarkStripGeometry({ ...base, data: PEERS, value: 20 })!;
    expect(geo.inner.x).toBeGreaterThanOrEqual(geo.outer.x - 0.01);
    expect(geo.inner.x + geo.inner.width).toBeLessThanOrEqual(geo.outer.x + geo.outer.width + 0.01);
    expect(geo.smallN).toBe(false);
    expect(geo.percentile).toBe(49);
  });

  it("n < 8 forces the min–max fallback (tail quantiles would be fiction)", () => {
    const geo = benchmarkStripGeometry({ ...base, data: [1, 2, 3, 4, 5], value: 3 })!;
    expect(geo.smallN).toBe(true);
    expect(geo.edges[0]!.name).toBe("min");
    expect(geo.edges[4]!.name).toBe("max");
  });

  it("all peers equal → bands collapse, flat flagged", () => {
    const geo = benchmarkStripGeometry({ ...base, data: [7, 7, 7, 7, 7, 7, 7, 7], value: 7 })!;
    expect(geo.flat).toBe(true);
    expect(geo.outer.width).toBeCloseTo(0, 1);
  });

  it("focal beyond the rendered domain clamps to the pad edge and flags direction", () => {
    const geo = benchmarkStripGeometry({ ...base, data: PEERS, value: 999, domain: [0, 50] })!;
    expect(geo.dot.clamped).toBe(1);
    expect(geo.percentile).toBe(100);
  });

  it("a high→low domain still paints both bands (negative rect width is an SVG error)", () => {
    const geo = benchmarkStripGeometry({ ...base, data: PEERS, value: 20, domain: [40, 0] })!;
    expect(geo.outer.width).toBeGreaterThan(0);
    expect(geo.inner.width).toBeGreaterThan(0);
    // still nested, just mirrored: the strip reads high→low
    expect(geo.inner.x).toBeGreaterThanOrEqual(geo.outer.x - 0.01);
    expect(geo.inner.x + geo.inner.width).toBeLessThanOrEqual(geo.outer.x + geo.outer.width + 0.01);
  });

  it("empty / non-finite value → null (degenerate, caller renders no-data)", () => {
    expect(benchmarkStripGeometry({ ...base, data: [], value: 5 })).toBeNull();
    expect(benchmarkStripGeometry({ ...base, data: PEERS, value: Number.NaN })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { minLength: 1, maxLength: 60 }),
    fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
  ])("containment: every mark stays inside the strip", (data, value) => {
    const geo = benchmarkStripGeometry({ ...base, data, value, gutterCh: 4, fontSize: 6 });
    if (!geo) return;
    for (const e of geo.edges) {
      expect(e.x).toBeGreaterThanOrEqual(-0.01);
      expect(e.x).toBeLessThanOrEqual(80.01);
    }
    expect(geo.dot.x).toBeGreaterThanOrEqual(-0.01);
    expect(geo.dot.x).toBeLessThanOrEqual(80.01);
    expect(geo.percentile).toBeGreaterThanOrEqual(0);
    expect(geo.percentile).toBeLessThanOrEqual(100);
    expect(geo.outer.width).toBeGreaterThanOrEqual(0);
    expect(geo.inner.width).toBeGreaterThanOrEqual(0);
  });
});
