import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { rubricStripGeometry } from "./geometry.js";

const RUBRIC = [
  { label: "Correctness", score: 0.92, weight: 3 },
  { label: "Coverage", score: 0.78, weight: 2 },
  { label: "Clarity", score: 0.65, weight: 1 },
  { label: "Style", score: 0.41, weight: 1 },
];

describe("rubricStripGeometry", () => {
  it("thickness ∝ weight, length ∝ score", () => {
    const geo = rubricStripGeometry({
      data: RUBRIC,
      domain: [0, 1],
      width: 80,
      height: 32,
      gutter: 20,
      gap: 1,
    });
    const [correctness, , , style] = geo.rows;
    expect(correctness!.height).toBeGreaterThan(style!.height); // weight 3 vs 1
    expect(correctness!.barWidth).toBeGreaterThan(style!.barWidth); // score 0.92 vs 0.41
  });

  it("equal weights → uniform thickness", () => {
    const geo = rubricStripGeometry({
      data: [
        { label: "a", score: 0.5, weight: 1 },
        { label: "b", score: 0.7, weight: 1 },
      ],
      domain: [0, 1],
      width: 80,
      height: 24,
      gutter: 10,
      gap: 1,
    });
    expect(geo.rows[0]!.height).toBeCloseTo(geo.rows[1]!.height, 1);
  });

  it("scores clamp to the domain", () => {
    const geo = rubricStripGeometry({
      data: [{ label: "x", score: 2, weight: 1 }],
      domain: [0, 1],
      width: 80,
      height: 12,
      gutter: 10,
      gap: 1,
    });
    expect(geo.rows[0]!.barWidth).toBeLessThanOrEqual(geo.rows[0]!.trackWidth + 0.01);
  });

  test.prop([
    fc.array(
      fc.record({
        label: fc.string({ minLength: 1, maxLength: 6 }),
        score: fc.double({ min: 0, max: 1, noNaN: true }),
        weight: fc.double({ min: 0.1, max: 10, noNaN: true }),
      }),
      { minLength: 1, maxLength: 8 },
    ),
  ])("rows stay inside the viewBox", (data) => {
    const geo = rubricStripGeometry({
      data,
      domain: [0, 1],
      width: 80,
      height: 32,
      gutter: 20,
      gap: 1,
    });
    for (const row of geo.rows) {
      expect(row.y).toBeGreaterThanOrEqual(0);
      expect(row.y + row.height).toBeLessThanOrEqual(32.01);
      expect(row.barWidth).toBeLessThanOrEqual(row.trackWidth + 0.01);
    }
  });
});
