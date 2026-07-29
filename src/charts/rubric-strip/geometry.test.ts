import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  UNIT_DOMAIN,
  resolveDomain,
  rubricLabels,
  rubricRowBands,
  rubricStripGeometry,
} from "./geometry.js";

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

  test.prop([
    fc.double({ noNaN: false, noDefaultInfinity: false }),
    fc.double({ noNaN: false, noDefaultInfinity: false }),
  ])("no domain a caller can compute produces a non-finite bar", (lo, hi) => {
    const geo = rubricStripGeometry({
      data: [{ label: "x", score: 0.5, weight: 1 }],
      domain: [lo, hi],
      width: 80,
      height: 12,
      gutter: 10,
      gap: 1,
    });
    expect(Number.isFinite(geo.rows[0]!.barWidth)).toBe(true);
    expect(Number.isFinite(geo.targetX(0.7))).toBe(true);
  });
});

describe("resolveDomain", () => {
  it("keeps a usable bound and defaults the other", () => {
    expect(resolveDomain([NaN, 1])).toEqual([0, 1]);
    expect(resolveDomain([2, NaN])).toEqual([2, 1]);
    expect(resolveDomain([0, 100])).toEqual([0, 100]);
  });

  it("falls back whole when the span is unrepresentable", () => {
    // `1e308 - -1e308` overflows, and every score divided to a zero-length bar
    // under a summary that still named them.
    expect(resolveDomain([-Infinity, Infinity])).toEqual([...UNIT_DOMAIN]);
    expect(resolveDomain([-1e308, 1e308])).toEqual([...UNIT_DOMAIN]);
  });
});

describe("rubricLabels", () => {
  const NAMES = ["Correctness", "Coverage", "Clarity", "Style"];
  const layout = (weights: number[], width: number, height: number) =>
    rubricLabels({
      names: NAMES,
      bands: rubricRowBands({ weights, height, gap: 1 }),
      width,
      height,
      show: true,
    });

  it("reserves a gutter the painted name fits inside", () => {
    const lab = layout([3, 2, 1, 1], 260, 40);
    expect(lab.chars).toBeGreaterThanOrEqual(7);
    // anchor − painted extent ≥ 0: the name never crosses the left edge
    const painted = Math.min(lab.chars, 11) + 1;
    expect(lab.gutter - 8 - painted * lab.fontSize * 0.95).toBeGreaterThanOrEqual(-0.01);
  });

  it("drops the names when adjacent rows crowd their centres", () => {
    // Same box, same width: only the weight distribution changes.
    expect(layout([1, 1, 1, 1], 200, 40).chars).toBeGreaterThan(0);
    expect(layout([10, 1, 1, 1], 200, 40).chars).toBe(0);
  });

  it("drops the gutter with the names", () => {
    expect(layout([10, 1, 1, 1], 200, 40).gutter).toBe(0);
    const off = rubricLabels({ names: NAMES, bands: [], width: 200, height: 40, show: false });
    expect(off.gutter).toBe(0);
  });

  it("keeps every name centre inside the box", () => {
    const lab = layout([10, 1, 1, 1], 200, 14);
    for (const y of lab.y) {
      expect(y - lab.fontSize * 0.5).toBeGreaterThanOrEqual(0);
      expect(y + lab.fontSize * 0.5).toBeLessThanOrEqual(14.01);
    }
  });
});
