import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { spreadLabels } from "./labels.js";

describe("spreadLabels", () => {
  it("leaves already-spaced labels alone", () => {
    expect(spreadLabels([10, 30, 50], 6, 0, 60)).toEqual([10, 30, 50]);
  });

  it("nudges colliding labels apart, preserving input order", () => {
    const out = spreadLabels([20, 22, 24], 6, 0, 60)!;
    expect(out[1]! - out[0]!).toBeGreaterThanOrEqual(6);
    expect(out[2]! - out[1]!).toBeGreaterThanOrEqual(6);
  });

  it("pulls overflow back from the bottom edge", () => {
    const out = spreadLabels([55, 57, 59], 6, 0, 60)!;
    expect(Math.max(...out)).toBeLessThanOrEqual(60);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });

  it("returns null when the band cannot hold them", () => {
    expect(spreadLabels([1, 2, 3, 4, 5], 10, 0, 20)).toBeNull();
  });

  it("empty input → empty output", () => {
    expect(spreadLabels([], 5, 0, 10)).toEqual([]);
  });

  test.prop([
    fc.array(fc.double({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 12 }),
    fc.double({ min: 0.5, max: 10, noNaN: true }),
  ])("output honors pitch, band, and rank order", (ys, pitch) => {
    const out = spreadLabels(ys, pitch, 0, 100);
    if ((ys.length - 1) * pitch > 100) {
      expect(out).toBeNull();
      return;
    }
    expect(out).not.toBeNull();
    const sortedIdx = ys.map((y, i) => i).sort((a, b) => ys[a]! - ys[b]! || a - b);
    for (let k = 1; k < sortedIdx.length; k++) {
      const gap = out![sortedIdx[k]!]! - out![sortedIdx[k - 1]!]!;
      expect(gap).toBeGreaterThanOrEqual(pitch - 0.02); // 2-dp rounding
    }
    for (const v of out!) {
      expect(v).toBeGreaterThanOrEqual(-0.01);
      expect(v).toBeLessThanOrEqual(100.01);
    }
  });
});
