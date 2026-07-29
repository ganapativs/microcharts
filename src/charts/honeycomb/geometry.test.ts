import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  honeycombGeometry,
  hexPath,
  HONEYCOMB_MAX_CELLS,
  HONEYCOMB_TOTAL,
  resolveTotal,
  resolveValue,
  resolveCell,
} from "./geometry.js";

const g = (value: number, total: number, rows: number | "auto" = "auto") =>
  honeycombGeometry({ value, total, rows, cellR: 4, pad: 1 });

describe("honeycombGeometry — hex occupancy", () => {
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

  it("sizes from the rows the comb OCCUPIES, not the rows asked for", () => {
    // 12 cells over 5 rows is 3 columns — 4 rows. The 5th was reserved anyway,
    // leaving a dead band under the comb and dragging the inline seat with it.
    expect(g(5, 12, 5).height).toBe(g(5, 12, 4).height);
    expect(g(5, 12, 100).height).toBe(g(5, 12, 12).height);
    expect(g(5, 12, 1e6).height).toBe(g(5, 12, 12).height);
  });

  it("the seat's bottom edge is the last row's hex bottom", () => {
    for (const rows of [1, 2, 5, 7, 100] as const) {
      const geo = g(5, 12, rows);
      const maxCy = geo.cells.reduce((m, c) => Math.max(m, c.cy), 0);
      expect(geo.y1).toBeCloseTo(maxCy + 4, 5); // + circumradius
      expect(geo.height).toBeGreaterThanOrEqual(geo.y1);
    }
  });

  describe("hostile config — the comb is laid out on the numbers it announces", () => {
    it("resolvers repair a computed prop", () => {
      // `Number(field.value)` on an empty field; `seats / perFloor` at perFloor 0.
      expect(resolveTotal(Number.NaN)).toBe(HONEYCOMB_TOTAL);
      expect(resolveTotal(Number.POSITIVE_INFINITY)).toBe(HONEYCOMB_TOTAL);
      expect(resolveTotal(-5)).toBe(0); // a negative capacity is none, not a default
      expect(resolveTotal(12.7)).toBe(12);
      expect(resolveValue(Number.NaN)).toBe(0);
      expect(resolveValue(Number.POSITIVE_INFINITY)).toBe(0);
      expect(resolveValue(-3)).toBe(0);
      expect(resolveCell(Number.NaN)).toBe(4);
      expect(resolveCell(-4)).toBe(4);
      expect(resolveCell(0)).toBe(0);
    });

    it.each([
      ["total", { total: Number.NaN }],
      ["total ∞", { total: Number.POSITIVE_INFINITY }],
      ["value", { value: Number.NaN }],
      ["value ∞", { value: Number.POSITIVE_INFINITY }],
      ["rows", { rows: Number.NaN }],
      ["rows ∞", { rows: Number.POSITIVE_INFINITY }],
      ["cell", { cell: Number.NaN }],
      ["cell ∞", { cell: Number.POSITIVE_INFINITY }],
      ["cell −4", { cell: -4 }],
    ])("%s never reaches a coordinate", (_name, hostile) => {
      const o = { value: 5, total: 12, rows: "auto" as number | "auto", cell: 4, ...hostile };
      const geo = honeycombGeometry({
        value: o.value,
        total: o.total,
        rows: o.rows,
        cellR: o.cell,
        pad: 1,
      });
      expect(geo.filledPath + geo.emptyPath).not.toMatch(/NaN|Infinity/);
      for (const n of [geo.width, geo.height, geo.y0, geo.y1, geo.cell]) {
        expect(Number.isFinite(n)).toBe(true);
      }
      // and nothing paints outside the box `.mc-root` does not clip
      const nums = (geo.filledPath + geo.emptyPath).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
      for (let i = 0; i < nums.length; i += 2) {
        expect(nums[i]!).toBeGreaterThanOrEqual(-0.5);
        expect(nums[i]!).toBeLessThanOrEqual(geo.width + 0.5);
        expect(nums[i + 1]!).toBeGreaterThanOrEqual(-0.5);
        expect(nums[i + 1]!).toBeLessThanOrEqual(geo.height + 0.5);
      }
    });
  });

  // the clamp itself is covered by the explicit 1e15 test above; here just sweep
  // realistic totals for containment, capped so a 400-cell comb × runs stays fast
  test.prop([fc.integer({ min: 1, max: 400 }), fc.integer({ min: 0, max: 1e9 })], {
    numRuns: 30,
  })("every hex vertex stays inside the box", (total, value) => {
    const geo = honeycombGeometry({ value, total, rows: "auto", cellR: 4, pad: 1 });
    const nums = (geo.filledPath + geo.emptyPath).match(/-?\d+\.?\d*/g)?.map(Number) ?? [];
    for (let i = 0; i < nums.length; i += 2) {
      expect(nums[i]!).toBeGreaterThanOrEqual(-0.5);
      expect(nums[i]!).toBeLessThanOrEqual(geo.width + 0.5);
      expect(nums[i + 1]!).toBeGreaterThanOrEqual(-0.5);
      expect(nums[i + 1]!).toBeLessThanOrEqual(geo.height + 0.5);
    }
  });
});
