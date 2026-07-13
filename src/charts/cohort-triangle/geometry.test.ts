import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { cohortTriangleGeometry, LEVELS, MAX_AGES, MAX_COHORTS } from "./geometry.js";
import type { CohortRow } from "./geometry.js";
import type { Value } from "../../core/types.js";

const COHORTS: CohortRow[] = [
  { label: "Jan", values: [1, 0.6, 0.45, 0.4, 0.38] },
  { label: "Feb", values: [1, 0.5, 0.4, 0.35] },
  { label: "Mar", values: [1, 0.44, 0.34] },
  { label: "Apr", values: [1, 0.52] },
];

describe("cohortTriangleGeometry", () => {
  it("empty → no cells, zero rows/cols", () => {
    const g = cohortTriangleGeometry([]);
    expect(g.cells).toEqual([]);
    expect(g.rows).toBe(0);
    expect(g.cols).toBe(0);
    expect(g.worst).toBeNull();
    expect(g.newestFirst).toBeNull();
  });

  it("ragged rows → one cell per observed age, triangle trailing edge", () => {
    const g = cohortTriangleGeometry(COHORTS);
    expect(g.rows).toBe(4);
    expect(g.cols).toBe(5); // widest cohort (Jan)
    expect(g.cells).toHaveLength(5 + 4 + 3 + 2);
    // last cohort (Apr) draws only its two observed ages
    expect(g.cells.filter((c) => c.row === 3)).toHaveLength(2);
  });

  it("column-major coordinates step by cell+gap", () => {
    const g = cohortTriangleGeometry(COHORTS, { cell: 9, gap: 2, labels: false });
    const first = g.cells.find((c) => c.row === 0 && c.col === 0)!;
    const next = g.cells.find((c) => c.row === 0 && c.col === 1)!;
    const down = g.cells.find((c) => c.row === 1 && c.col === 0)!;
    expect(first).toMatchObject({ x: 0, y: 0 });
    expect(next.x).toBe(11);
    expect(down.y).toBe(11);
  });

  it("deepest common age is contiguous from 0", () => {
    const g = cohortTriangleGeometry(COHORTS);
    // every cohort has ages 0 and 1; Apr stops at age 1
    expect(g.commonAge).toBe(1);
  });

  it("worst cohort = min retention at the deepest common age", () => {
    const g = cohortTriangleGeometry(COHORTS);
    expect(g.worst).toEqual({ label: "Mar", age: 1, value: 0.44 });
  });

  it("newest cohort's first reading = last row, first finite age", () => {
    const g = cohortTriangleGeometry(COHORTS);
    expect(g.newestFirst).toEqual({ label: "Apr", value: 1 });
  });

  it("auto-detects 0–100 percent input identically to 0–1", () => {
    const pct = cohortTriangleGeometry([
      { label: "Jan", values: [100, 60, 45] },
      { label: "Feb", values: [100, 44] },
    ]);
    const frac = cohortTriangleGeometry([
      { label: "Jan", values: [1, 0.6, 0.45] },
      { label: "Feb", values: [1, 0.44] },
    ]);
    expect(pct.cells.map((c) => c.value)).toEqual(frac.cells.map((c) => c.value));
    expect(pct.worst).toEqual(frac.worst);
  });

  it("non-finite cell → gap slot (level -1, null value)", () => {
    const g = cohortTriangleGeometry([{ label: "c", values: [1, Number.NaN, 0.4, null] }]);
    expect(g.cells[1]).toMatchObject({ gap: true, level: -1, value: null });
    expect(g.cells[3]).toMatchObject({ gap: true, value: null });
    expect(g.cells[0]!.gap).toBe(false);
  });

  it("levels bucket into 0.LEVELS-1 and rise with value", () => {
    const g = cohortTriangleGeometry([{ label: "c", values: [0, 0.25, 0.5, 0.75, 1] }]);
    const levels = g.cells.map((c) => c.level);
    expect(Math.min(...levels)).toBe(0);
    expect(Math.max(...levels)).toBe(LEVELS - 1);
    for (let i = 1; i < levels.length; i++)
      expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]!);
  });

  it("highlight rings the matching cohort row", () => {
    const g = cohortTriangleGeometry(COHORTS, { highlight: "Mar", labels: false });
    expect(g.ring).not.toBeNull();
    // Mar is row index 2
    expect(g.ring!.y).toBeCloseTo(2 * 11 - 0.5, 5);
    // spans its three drawn cells
    expect(g.ring!.width).toBeCloseTo(3 * 11 - 2 + 1, 5);
  });

  it("unknown highlight → no ring", () => {
    expect(cohortTriangleGeometry(COHORTS, { highlight: "Dec" }).ring).toBeNull();
  });

  it("labels seat only when the cell is tall enough (seat-gate)", () => {
    expect(cohortTriangleGeometry(COHORTS, { labels: true, cell: 9 }).showLabels).toBe(true);
    // tiny cells drop labels (font floor 7 needs cell ≥ 7.8)
    expect(cohortTriangleGeometry(COHORTS, { labels: true, cell: 5 }).showLabels).toBe(false);
    expect(cohortTriangleGeometry(COHORTS, { labels: false, cell: 9 }).labels).toEqual([]);
  });

  it("caps at 12 cohorts × 12 ages", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      label: `c${i}`,
      values: Array.from({ length: 20 }, () => 0.5),
    }));
    const g = cohortTriangleGeometry(many, { labels: false });
    expect(g.rows).toBe(MAX_COHORTS);
    expect(g.cols).toBe(MAX_AGES);
  });
});

describe("cohortTriangleGeometry (invariants)", () => {
  const value = fc.oneof(
    fc.double({ noNaN: true, noDefaultInfinity: true, min: -5, max: 200 }),
    fc.constant(null as Value),
  );
  const row = fc.record({
    label: fc.string({ minLength: 1, maxLength: 6 }),
    values: fc.array(value, { minLength: 0, maxLength: 14 }),
  });
  test.prop([fc.array(row, { minLength: 1, maxLength: 16 })])(
    "every cell has a valid level and non-negative position; fractions stay in [0,1]",
    (data) => {
      const g = cohortTriangleGeometry(data);
      for (const c of g.cells) {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
        expect(c.level).toBeGreaterThanOrEqual(-1);
        expect(c.level).toBeLessThanOrEqual(LEVELS - 1);
        if (c.value !== null) {
          expect(c.value).toBeGreaterThanOrEqual(0);
          expect(c.value).toBeLessThanOrEqual(1);
        }
      }
    },
  );
});
