import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { confusionGridGeometry } from "./geometry.js";

const COUNTS = [
  [88, 12],
  [10, 59],
];

describe("confusionGridGeometry", () => {
  it("computes accuracy, row totals, and the worst off-diagonal", () => {
    const geo = confusionGridGeometry({
      size: 40,
      k: 2,
      counts: COUNTS,
      normalize: "row",
      gutterCh: 6,
    });
    expect(geo.cells.length).toBe(4);
    expect(geo.rowTotals).toEqual([100, 69]);
    expect(geo.accuracy).toBe(0.87);
    expect(geo.maxErrorCell).toEqual({ row: 0, col: 1 }); // cat→dog
  });

  it("row-normalizes cell shares by default", () => {
    const geo = confusionGridGeometry({
      size: 40,
      k: 2,
      counts: COUNTS,
      normalize: "row",
      gutterCh: 6,
    });
    const catDog = geo.cells.find((c) => c.row === 0 && c.col === 1)!;
    expect(catDog.share).toBe(0.12); // 12 of 100 cats
  });

  it("an all-zero row → null shares (no divide by zero)", () => {
    const geo = confusionGridGeometry({
      size: 40,
      k: 2,
      counts: [
        [10, 5],
        [0, 0],
      ],
      normalize: "row",
      gutterCh: 6,
    });
    const emptyRow = geo.cells.filter((c) => c.row === 1);
    expect(emptyRow.every((c) => c.share === null)).toBe(true);
  });

  test.prop([fc.integer({ min: 2, max: 4 })])("cells tile the grid inside the viewBox", (k) => {
    const counts = Array.from({ length: k }, (_, r) =>
      Array.from({ length: k }, (_c, c) => (r + c) % 5),
    );
    const size = 40 + (k - 2) * 4;
    const geo = confusionGridGeometry({ size, k, counts, normalize: "row", gutterCh: 6 });
    expect(geo.cells.length).toBe(k * k);
    for (const cell of geo.cells) {
      expect(cell.x + cell.w).toBeLessThanOrEqual(size + 0.01);
      expect(cell.y + cell.w).toBeLessThanOrEqual(size + 0.01);
    }
  });
});
