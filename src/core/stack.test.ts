import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { stackSeries, normalizeShares, divergingStack } from "./stack.js";
import { type Value } from "./types.js";

const finite = fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 });
const nonNegative = fc.double({ noNaN: true, noDefaultInfinity: true, min: 0, max: 1e6 });
const value: fc.Arbitrary<Value> = fc.oneof(finite, fc.constant(null));

describe("stackSeries (edge matrix)", () => {
  it("empty → empty layers and totals", () => {
    expect(stackSeries([])).toEqual({ layers: [], totals: [] });
  });

  it("single series stacks on zero", () => {
    const s = stackSeries([[1, 2, 3]]);
    expect(s.layers[0]!.y0).toEqual([0, 0, 0]);
    expect(s.layers[0]!.y1).toEqual([1, 2, 3]);
    expect(s.totals).toEqual([1, 2, 3]);
  });

  it("layers stack bottom-up in input order", () => {
    const s = stackSeries([
      [1, 1],
      [2, 3],
    ]);
    expect(s.layers[1]!.y0).toEqual([1, 1]);
    expect(s.layers[1]!.y1).toEqual([3, 4]);
    expect(s.totals).toEqual([3, 4]);
  });

  it("null/NaN → stacked as 0 and flagged missing", () => {
    const s = stackSeries([[1, null, NaN]]);
    expect(s.layers[0]!.y1).toEqual([1, 0, 0]);
    expect(s.layers[0]!.missing).toEqual([false, true, true]);
  });

  it("negatives clamp to 0 (compositions cannot overlap)", () => {
    const s = stackSeries([[-5, 2]]);
    expect(s.layers[0]!.y1).toEqual([0, 2]);
    expect(s.layers[0]!.missing).toEqual([false, false]);
  });

  it("unequal lengths stack over the longest; the short tail is missing", () => {
    const s = stackSeries([[1, 2, 3], [10]]);
    expect(s.totals).toEqual([11, 2, 3]);
    expect(s.layers[1]!.missing).toEqual([false, true, true]);
  });

  it("all-zero series keeps a zero-thickness layer", () => {
    const s = stackSeries([
      [1, 1],
      [0, 0],
    ]);
    expect(s.layers[1]!.y0).toEqual(s.layers[1]!.y1);
  });
});

describe("stackSeries (invariants)", () => {
  test.prop([fc.array(fc.array(value, { maxLength: 20 }), { maxLength: 5 })])(
    "layers are contiguous, non-overlapping, zero-anchored; totals = top layer",
    (series) => {
      const s = stackSeries(series);
      const n = s.totals.length;
      for (let i = 0; i < n; i++) {
        let cursor = 0;
        for (const layer of s.layers) {
          expect(layer.y0[i]).toBe(cursor);
          expect(layer.y1[i]).toBeGreaterThanOrEqual(layer.y0[i]!);
          cursor = layer.y1[i]!;
        }
        expect(s.totals[i]).toBe(cursor);
        expect(s.totals[i]).toBeGreaterThanOrEqual(0);
      }
    },
  );
});

describe("normalizeShares (edge matrix)", () => {
  it("empty → null", () => expect(normalizeShares([])).toBeNull());
  it("all-null → null", () => expect(normalizeShares([null, null])).toBeNull());
  it("all-zero → null", () => expect(normalizeShares([0, 0])).toBeNull());
  it("all-negative → null", () => expect(normalizeShares([-1, -2])).toBeNull());

  it("single positive → share 1", () => {
    expect(normalizeShares([5])).toEqual({ shares: [1], total: 5 });
  });

  it("zero/negative/null entries get share 0, positives carry the total", () => {
    const r = normalizeShares([6, 0, -2, null, 2])!;
    expect(r.total).toBe(8);
    expect(r.shares).toEqual([0.75, 0, 0, 0, 0.25]);
  });
});

describe("normalizeShares (invariants)", () => {
  test.prop([fc.array(value, { minLength: 1, maxLength: 20 })])(
    "shares are in [0,1], aligned with input, and sum to 1",
    (xs) => {
      const r = normalizeShares(xs);
      const positive = xs.filter((v) => typeof v === "number" && Number.isFinite(v) && v > 0);
      if (positive.length === 0) {
        expect(r).toBeNull();
        return;
      }
      expect(r!.shares).toHaveLength(xs.length);
      let sum = 0;
      for (const s of r!.shares) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
        sum += s;
      }
      expect(sum).toBeCloseTo(1, 12);
    },
  );
});

describe("divergingStack (edge matrix)", () => {
  it("empty → null", () => expect(divergingStack([])).toBeNull());
  it("zero-total → null", () => expect(divergingStack([0, 0, 0])).toBeNull());
  it("all-null → null", () => expect(divergingStack([null, null, null])).toBeNull());

  it("odd length defaults the middle level to neutral, split half each side", () => {
    const d = divergingStack([1, 2, 1])!; // 25% / 50% / 25%
    expect(d.negative).toBeCloseTo(0.25, 9);
    expect(d.positive).toBeCloseTo(0.25, 9);
    expect(d.neutral).toBeCloseTo(0.5, 9);
    const mid = d.segments.find((s) => s.side === 0)!;
    expect(mid.x0).toBeCloseTo(-0.25, 9);
    expect(mid.x1).toBeCloseTo(0.25, 9);
  });

  it("even length has no neutral; halves meet at center exactly", () => {
    const d = divergingStack([1, 1, 1, 1])!;
    expect(d.neutral).toBe(0);
    expect(d.segments.filter((s) => s.side === 0)).toHaveLength(0);
    const neg = d.segments.filter((s) => s.side === -1);
    const pos = d.segments.filter((s) => s.side === 1);
    expect(Math.max(...neg.map((s) => s.x1))).toBe(0);
    expect(Math.min(...pos.map((s) => s.x0))).toBe(0);
  });

  it("omit removes the neutral segment but ALWAYS reports its share", () => {
    const d = divergingStack([1, 2, 1], { neutral: "omit" })!;
    expect(d.neutral).toBeCloseTo(0.5, 9);
    expect(d.segments.filter((s) => s.side === 0)).toHaveLength(0);
    // poles meet at center; bar is honestly shorter (shares of grand total)
    expect(d.segments.find((s) => s.index === 0)!.x1).toBe(0);
    expect(d.segments.find((s) => s.index === 2)!.x0).toBe(0);
    expect(d.negative + d.positive).toBeCloseTo(0.5, 9);
  });

  it("all-neutral → centered neutral block only", () => {
    const d = divergingStack([0, 4, 0])!;
    expect(d.neutral).toBe(1);
    expect(d.segments.filter((s) => s.share > 0)).toHaveLength(1);
    const mid = d.segments.find((s) => s.side === 0)!;
    expect(mid.x0).toBeCloseTo(-0.5, 9);
    expect(mid.x1).toBeCloseTo(0.5, 9);
  });

  it("most-negative level sits farthest left", () => {
    const d = divergingStack([1, 1, 0, 1, 1])!;
    const first = d.segments.find((s) => s.index === 0)!;
    const second = d.segments.find((s) => s.index === 1)!;
    expect(first.x0).toBeLessThan(second.x0);
    const last = d.segments.find((s) => s.index === 4)!;
    expect(last.x1).toBeGreaterThan(d.segments.find((s) => s.index === 3)!.x1);
  });

  it("negative counts are treated as 0", () => {
    const d = divergingStack([-3, 1, 1])!;
    expect(d.segments.find((s) => s.index === 0)!.share).toBe(0);
  });

  it("explicit neutralIndex null disables the neutral on odd input", () => {
    const d = divergingStack([1, 1, 1, 1, 1], { neutralIndex: null })!;
    expect(d.neutral).toBe(0);
    expect(d.segments.filter((s) => s.side === 0)).toHaveLength(0);
  });

  it("out-of-range neutralIndex → treated as no neutral, no NaN segments", () => {
    for (const neutralIndex of [10, -1, 3]) {
      const d = divergingStack([1, 2, 1], { neutralIndex })!;
      expect(d.neutral).toBe(0);
      expect(d.segments).toHaveLength(3);
      for (const s of d.segments) {
        expect(Number.isFinite(s.x0)).toBe(true);
        expect(Number.isFinite(s.x1)).toBe(true);
        expect(Number.isFinite(s.share)).toBe(true);
      }
      expect(d.negative + d.positive + d.neutral).toBeCloseTo(1, 9);
    }
  });
});

describe("divergingStack (invariants)", () => {
  test.prop([fc.array(nonNegative, { minLength: 2, maxLength: 7 })])(
    "segments are contiguous per side, ordered by index, shares account for the total",
    (xs) => {
      const d = divergingStack(xs);
      const total = xs.reduce((a, b) => a + b, 0);
      if (total === 0) {
        expect(d).toBeNull();
        return;
      }
      expect(d!.negative + d!.positive + d!.neutral).toBeCloseTo(1, 9);
      for (const s of d!.segments) {
        expect(s.x0).toBeLessThanOrEqual(s.x1);
        expect(s.x1 - s.x0).toBeCloseTo(s.share, 9);
      }
      // segment extents tile without overlap when sorted by x0
      const drawn = d!.segments.filter((s) => s.share > 0);
      const byX = [...drawn].sort((a, b) => a.x0 - b.x0);
      for (let i = 1; i < byX.length; i++) {
        expect(byX[i]!.x0).toBeCloseTo(byX[i - 1]!.x1, 9);
      }
    },
  );

  test.prop([fc.array(nonNegative, { minLength: 3, maxLength: 7 })])(
    "split neutral straddles the center symmetrically",
    (xs) => {
      const d = divergingStack(xs);
      if (d === null) return;
      const mid = d.segments.find((s) => s.side === 0);
      if (!mid) return;
      expect(mid.x0).toBeCloseTo(-mid.x1, 9);
    },
  );
});
