import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { honeycombGeometry, hexPath, HONEYCOMB_MAX_CELLS } from "./geometry.js";

const g = (value: number, total: number, rows: number | "auto" = "auto") =>
  honeycombGeometry({ value, total, rows, cellR: 4, pad: 1 });

describe("honeycombGeometry (plan/24 #15) — hex occupancy", () => {
  it("total cells; filledCount = min(value, total), filled row-major", () => {
    const geo = g(6, 12);
    expect(geo.cells.length).toBe(12);
    expect(geo.filledCount).toBe(6);
    expect(geo.cells.slice(0, 6).every((c) => c.filled)).toBe(true);
    expect(geo.cells.slice(6).every((c) => !c.filled)).toBe(true);
  });

  it("value > total → all filled (summary keeps the true value)", () => {
    expect(g(50, 40).filledCount).toBe(40);
  });

  it("a hex is a 6-sided path", () => {
    const d = hexPath(10, 10, 4);
    expect((d.match(/L/g) ?? []).length).toBe(5); // M + 5 L + Z = 6 vertices
  });

  it("rows='auto' is near-square; rows=1 is a strip", () => {
    const sq = g(0, 16, "auto");
    const strip = g(0, 16, 1);
    expect(strip.width).toBeGreaterThan(sq.width); // one long row is wider
    expect(strip.height).toBeLessThan(sq.height);
  });

  it("total 0 → no cells", () => {
    expect(g(5, 0).cells.length).toBe(0);
  });

  it("saturates a non-physical total — bounded cells, contained hexes", () => {
    // 1e15 once looped ~1e15 times (unbounded alloc + a huge auto viewBox); the
    // grid must clamp to HONEYCOMB_MAX_CELLS. Summary still reports the real total.
    const geo = g(1e15, 1e15);
    expect(geo.cells.length).toBe(HONEYCOMB_MAX_CELLS);
    expect(geo.filledCount).toBe(HONEYCOMB_MAX_CELLS);
    const nums = (geo.filledPath + geo.emptyPath).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    for (let i = 0; i < nums.length; i += 2) {
      expect(nums[i]!).toBeGreaterThanOrEqual(-0.5);
      expect(nums[i]!).toBeLessThanOrEqual(geo.width + 0.5);
      expect(nums[i + 1]!).toBeGreaterThanOrEqual(-0.5);
      expect(nums[i + 1]!).toBeLessThanOrEqual(geo.height + 0.5);
    }
  });

  test.prop([fc.integer({ min: 1, max: 10000 }), fc.integer({ min: 0, max: 1e9 })])(
    "every hex vertex stays inside the box",
    (total, value) => {
      const geo = honeycombGeometry({ value, total, rows: "auto", cellR: 4, pad: 1 });
      const nums = (geo.filledPath + geo.emptyPath).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      for (let i = 0; i < nums.length; i += 2) {
        expect(nums[i]!).toBeGreaterThanOrEqual(-0.5);
        expect(nums[i]!).toBeLessThanOrEqual(geo.width + 0.5);
        expect(nums[i + 1]!).toBeGreaterThanOrEqual(-0.5);
        expect(nums[i + 1]!).toBeLessThanOrEqual(geo.height + 0.5);
      }
    },
  );
});
