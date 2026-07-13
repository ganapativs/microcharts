import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { activityGridGeometry } from "./geometry.js";
import type { Value } from "../../core/types.js";

describe("activityGridGeometry", () => {
  it("empty → no cells, zero cols", () => {
    const g = activityGridGeometry([]);
    expect(g.cells).toEqual([]);
    expect(g.cols).toBe(0);
  });

  it("grid: 7 rows, column-major fill", () => {
    const g = activityGridGeometry([0, 1, 2, 3, 4, 5, 6, 7], { rows: 7 });
    expect(g.rows).toBe(7);
    expect(g.cols).toBe(2);
    expect(g.cells[7]).toMatchObject({ col: 1, row: 0 }); // 8th cell wraps to next week
  });

  it("strip: single row", () => {
    const g = activityGridGeometry([1, 2, 3], { rows: 1 });
    expect(g.rows).toBe(1);
    expect(g.cols).toBe(3);
    expect(g.cells.map((c) => c.row)).toEqual([0, 0, 0]);
  });

  it("value ≤ 0 → level 0 (empty)", () => {
    const g = activityGridGeometry([0, -3, 5], { domain: [0, 10] });
    expect(g.cells[0]!.level).toBe(0);
    expect(g.cells[1]!.level).toBe(0);
    expect(g.cells[2]!.level).toBeGreaterThan(0);
  });

  it("max value → top level", () => {
    const g = activityGridGeometry([1, 5, 10], { levels: 5, domain: [0, 10] });
    expect(g.cells[2]!.level).toBe(4);
  });

  it("levels are monotonic in value", () => {
    const g = activityGridGeometry([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], { levels: 5, domain: [0, 10] });
    const levels = g.cells.map((c) => c.level);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]!);
  });

  it("null cells become level 0 with null value", () => {
    const g = activityGridGeometry([null, 5], { domain: [0, 10] });
    expect(g.cells[0]).toMatchObject({ level: 0, value: null });
  });
});

describe("activityGridGeometry (invariants)", () => {
  const val = fc.oneof(
    fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4 }),
    fc.constant(null as Value),
  );
  test.prop([fc.array(val, { minLength: 1, maxLength: 400 })])(
    "every cell has an in-range level and non-negative position",
    (data) => {
      const g = activityGridGeometry(data, { levels: 5 });
      for (const c of g.cells) {
        expect(c.level).toBeGreaterThanOrEqual(0);
        expect(c.level).toBeLessThanOrEqual(4);
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
      }
    },
  );
});
