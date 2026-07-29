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

// Hostile CONFIG: `cell={boxPx / weeks}` with weeks momentarily 0, a `gap` from
// an empty number field, a `steps` a host computed. Each of these used to flow
// straight into the emitted coordinates.
const finite = (g: ReturnType<typeof activityGridGeometry>) =>
  [g.width, g.height, ...g.cells.flatMap((c) => [c.x, c.y, c.size, c.level])].every((n) =>
    Number.isFinite(n),
  );

describe("activityGridGeometry (hostile config)", () => {
  it("non-finite cell/gap fall back to the documented defaults", () => {
    for (const bad of [NaN, Infinity, -Infinity, -5]) {
      const byCell = activityGridGeometry([1, 2, 3], { cell: bad });
      expect(byCell.cell, `cell=${bad}`).toBe(10);
      expect(finite(byCell)).toBe(true);
      const byGap = activityGridGeometry([1, 2, 3], { gap: bad });
      expect(byGap.gap, `gap=${bad}`).toBe(2);
      expect(finite(byGap)).toBe(true);
    }
  });

  it("a negative gap never places a cell outside the box", () => {
    // gap=-20 made step negative, so column 1 sat at x=-10 while width clamped
    // to 1 — paint outside the viewBox, which `.mc-root` does not clip.
    const g = activityGridGeometry([1, 2, 3, 4, 5, 6, 7, 8], { gap: -20 });
    for (const c of g.cells) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x + c.size).toBeLessThanOrEqual(g.width);
      expect(c.y + c.size).toBeLessThanOrEqual(g.height);
    }
  });

  it("levels resolve to a whole count ≥ 2, and the geometry reports it", () => {
    expect(activityGridGeometry([1], { levels: NaN }).levels).toBe(5);
    expect(activityGridGeometry([1], { levels: Infinity }).levels).toBe(5);
    expect(activityGridGeometry([1], { levels: 0 }).levels).toBe(5);
    expect(activityGridGeometry([1], { levels: -3 }).levels).toBe(5);
    expect(activityGridGeometry([1], { levels: 1 }).levels).toBe(2); // clamped, not defaulted
    expect(activityGridGeometry([1], { levels: 2.5 }).levels).toBe(3);
    expect(activityGridGeometry([1], { levels: 7 }).levels).toBe(7);
  });

  it("levels stay inside the reported count", () => {
    const g = activityGridGeometry([1, 2, 3, 4, 5], { levels: 2.5, domain: [0, 5] });
    for (const c of g.cells) expect(c.level).toBeLessThanOrEqual(g.levels - 1);
  });

  it("non-finite rows/offset fall back rather than poisoning every coordinate", () => {
    expect(finite(activityGridGeometry([1, 2, 3], { rows: NaN }))).toBe(true);
    expect(activityGridGeometry([1, 2, 3], { rows: NaN }).rows).toBe(7);
    const g = activityGridGeometry([1, 2, 3], { offset: NaN });
    expect(finite(g)).toBe(true);
    expect(g.cells[0]!.row).toBe(0);
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
