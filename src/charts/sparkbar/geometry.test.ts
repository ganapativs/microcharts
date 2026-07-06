import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { sparkBarGeometry } from "./geometry.js";
import type { Value } from "../../core/types.js";

const W = 80;
const H = 20;
const geo = (data: readonly Value[], opts = {}) =>
  sparkBarGeometry(data, { width: W, height: H, ...opts });

describe("sparkBarGeometry (edge matrix, plan/09)", () => {
  it("empty → no bars", () => {
    expect(geo([]).bars).toEqual([]);
  });

  it("all-null → no bars", () => {
    expect(geo([null, null]).bars).toEqual([]);
  });

  it("nulls are skipped, indices preserved", () => {
    const g = geo([3, null, 5]);
    expect(g.bars.map((b) => b.index)).toEqual([0, 2]);
  });

  it("bars anchor at the zero baseline; positive bars sit above it", () => {
    const g = geo([2, 5, 3]);
    for (const b of g.bars) expect(b.y + b.height).toBeCloseTo(g.baselineY, 5);
  });

  it("negative values grow downward from the baseline with sign=-1", () => {
    const g = geo([-4, -2]);
    for (const b of g.bars) {
      expect(b.sign).toBe(-1);
      expect(b.y).toBeCloseTo(g.baselineY, 5);
    }
  });

  it("mixed signs straddle a shared zero baseline", () => {
    const g = geo([5, -5]);
    expect(g.bars[0]!.sign).toBe(1);
    expect(g.bars[1]!.sign).toBe(-1);
    expect(g.bars[0]!.y).toBeLessThan(g.baselineY);
    expect(g.bars[1]!.y).toBeCloseTo(g.baselineY, 5);
  });

  it("last finite bar is flagged", () => {
    const g = geo([1, 2, null]);
    expect(g.bars.at(-1)!.last).toBe(true);
    expect(g.bars.at(-1)!.index).toBe(1);
  });

  it("win-loss: equal height, sign only, straddling the mid-line", () => {
    const g = geo([3, -9, 100, -1], { mode: "winloss" });
    const heights = new Set(g.bars.map((b) => b.height));
    expect(heights.size).toBe(1); // magnitude discarded
    expect(g.bars.map((b) => b.sign)).toEqual([1, -1, 1, -1]);
    expect(g.bars[0]!.y).toBeLessThan(g.baselineY); // win above
    expect(g.bars[1]!.y).toBeCloseTo(g.baselineY, 5); // loss below
  });

  it("gap widens the empty space between bars", () => {
    const wide = geo([1, 1, 1], { gap: 0.6 }).bars[0]!.width;
    const tight = geo([1, 1, 1], { gap: 0.1 }).bars[0]!.width;
    expect(wide).toBeLessThan(tight);
  });
});

const finite = fc
  .double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4 })
  .filter((v) => v === 0 || Math.abs(v) >= 1e-3);
const value = fc.oneof(finite, fc.constant(null as Value));

describe("sparkBarGeometry (invariants)", () => {
  test.prop([fc.array(value, { minLength: 1 })])("bars stay within the box, no NaN", (data) => {
    const g = geo(data);
    for (const b of g.bars) {
      expect(Number.isNaN(b.x + b.y + b.width + b.height)).toBe(false);
      expect(b.x).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(b.x + b.width).toBeLessThanOrEqual(79 + 1e-6);
      expect(b.y).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(b.y + b.height).toBeLessThanOrEqual(19 + 1e-6);
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
    }
  });
});
