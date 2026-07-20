import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { quantileDotsGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// a right-skewed wait-time sample (minutes)
const WAITS = Array.from({ length: 200 }, (_, i) => Math.round(4 + (i % 40) * 0.4 + (i % 7) * 1.5));

describe("quantileDotsGeometry", () => {
  it("lays out `count` dots (default 20) stacked bottom-up", () => {
    const geo = quantileDotsGeometry({ ...base, data: WAITS })!;
    expect(geo.dots).toHaveLength(20);
    expect(geo.count).toBe(20);
  });

  it("count prop changes the dot total (capped at 25)", () => {
    expect(quantileDotsGeometry({ ...base, data: WAITS, count: 15 })!.dots).toHaveLength(15);
    expect(quantileDotsGeometry({ ...base, data: WAITS, count: 50 })!.dots).toHaveLength(25);
  });

  it("threshold counts dots PAST the line on the true quantile value", () => {
    const geo = quantileDotsGeometry({ ...base, data: WAITS, threshold: 15, side: "above" })!;
    expect(geo.threshold).not.toBeNull();
    // past count matches the dots flagged
    expect(geo.dots.filter((d) => d.past).length).toBe(geo.past);
    expect(geo.past).toBeGreaterThan(0);
  });

  it("side='below' counts the other side", () => {
    const above = quantileDotsGeometry({ ...base, data: WAITS, threshold: 15, side: "above" })!;
    const below = quantileDotsGeometry({ ...base, data: WAITS, threshold: 15, side: "below" })!;
    expect(above.past + below.past).toBeLessThanOrEqual(20);
    expect(below.past).toBeGreaterThan(0);
  });

  it("threshold beyond the range → 0 past (or all)", () => {
    const hi = quantileDotsGeometry({ ...base, data: WAITS, threshold: 9999, side: "above" })!;
    expect(hi.past).toBe(0);
    const lo = quantileDotsGeometry({ ...base, data: WAITS, threshold: -9999, side: "above" })!;
    expect(lo.past).toBe(20);
  });

  it("all-equal sample → one column of `count` dots (certainty)", () => {
    const geo = quantileDotsGeometry({ ...base, data: [7, 7, 7, 7, 7], count: 12 })!;
    expect(geo.dots).toHaveLength(12);
    // all dots share one x column
    const xs = new Set(geo.dots.map((d) => d.x));
    expect(xs.size).toBe(1);
  });

  it("an overflowing stack spreads over the plot — never piles on one y", () => {
    // 20 dots at the 1.25 radius floor need 50px of stack in a 16px plot; the
    // row step tightens instead of clamping every overflow row to the top.
    const geo = quantileDotsGeometry({ ...base, data: [7, 7, 7, 7, 7], count: 20 })!;
    const ys = new Set(geo.dots.map((d) => d.y));
    expect(ys.size).toBe(20);
    // and it still spans the plot, bottom-up
    expect(Math.max(...geo.dots.map((d) => d.y))).toBeCloseTo(20 - 2 - geo.dots[0]!.r, 1);
    expect(Math.min(...geo.dots.map((d) => d.y))).toBeCloseTo(2 + geo.dots[0]!.r, 1);
  });

  it("radius never below the floor (1.25)", () => {
    const geo = quantileDotsGeometry({ ...base, data: WAITS, count: 25 })!;
    for (const d of geo.dots) expect(d.r).toBeGreaterThanOrEqual(1.25);
  });

  it("empty → null", () => {
    expect(quantileDotsGeometry({ ...base, data: [] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e3, max: 1e3 }), { minLength: 1, maxLength: 80 }),
  ])("containment: dots inside the plot", (data) => {
    const geo = quantileDotsGeometry({ ...base, data, gutterCh: 5, fontSize: 8 });
    if (!geo) return;
    for (const d of geo.dots) {
      expect(d.x - d.r).toBeGreaterThanOrEqual(-0.02);
      expect(d.x + d.r).toBeLessThanOrEqual(80.02);
      expect(d.y - d.r).toBeGreaterThanOrEqual(-0.02);
      expect(d.y + d.r).toBeLessThanOrEqual(20.02);
    }
  });
});
