import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { largestRemainderPercents, rollup, segmentedBarGeometry } from "./geometry.js";

describe("segmentedBarGeometry", () => {
  it("segments fill the bar in proportion", () => {
    const geo = segmentedBarGeometry({ width: 60, height: 10, values: [62, 24, 14], fontSize: 6 });
    expect(geo.segments.length).toBe(3);
    expect(geo.segments[0]!.w).toBeGreaterThan(geo.segments[1]!.w);
    const end = geo.segments.at(-1)!;
    expect(end.x + end.w).toBeLessThanOrEqual(60.01);
  });

  it("rollup: top (max−1) keep data order; the tail becomes a labeled Other", () => {
    const data = [
      { label: "a", value: 10 },
      { label: "b", value: 50 },
      { label: "c", value: 5 },
      { label: "d", value: 30 },
      { label: "e", value: 3 },
      { label: "f", value: 2 },
    ];
    const rolled = rollup(data, 4, "Other");
    expect(rolled.map((d) => d.label)).toEqual(["a", "b", "d", "Other"]);
    expect(rolled.at(-1)!.value).toBe(10);
    expect(rolled.at(-1)!.members).toBe(3);
  });

  it("negatives and zeros are excluded from the whole", () => {
    const rolled = rollup(
      [
        { label: "a", value: 10 },
        { label: "bad", value: -5 },
        { label: "zero", value: 0 },
      ],
      5,
      "Other",
    );
    expect(rolled.map((d) => d.label)).toEqual(["a"]);
  });

  it("largest-remainder percents always sum to exactly 100", () => {
    expect(largestRemainderPercents([1 / 3, 1 / 3, 1 / 3]).reduce((a, b) => a + b)).toBe(100);
    expect(largestRemainderPercents([0.62, 0.24, 0.14])).toEqual([62, 24, 14]);
    // raw values normalize to the same percents as their shares do
    expect(largestRemainderPercents([620, 240, 140])).toEqual([62, 24, 14]);
  });

  it("an overflowing total takes the no-data branch, never a partial split", () => {
    // Every ratio underflows to 0, and the leftover loop can hand out at most
    // one point per entry — the result would have summed to 2, not 100.
    expect(largestRemainderPercents([1e308, 1e308])).toEqual([0, 0]);
    expect(largestRemainderPercents([NaN, 1])).toEqual([0, 0]);
  });

  it("rollup clamps a hostile maxSegments instead of dissolving the composition", () => {
    const data = [
      { label: "a", value: 10 },
      { label: "b", value: 50 },
      { label: "c", value: 5 },
    ];
    // NaN sliced nothing and rolled EVERYTHING into "Other"; 0 sliced from the
    // end and returned three segments for a max of zero.
    expect(rollup(data, NaN, "Other").map((d) => d.label)).toEqual(["a", "b", "c"]);
    expect(rollup(data, 0, "Other").map((d) => d.label)).toEqual(["Other"]);
    expect(rollup(data, -3, "Other").map((d) => d.label)).toEqual(["Other"]);
    expect(rollup(data, 2.5, "Other").map((d) => d.label)).toEqual(["b", "Other"]);
  });

  test.prop([
    fc.array(fc.double({ min: 0.01, max: 1e4, noNaN: true }), { minLength: 1, maxLength: 5 }),
  ])("containment + shares sum to ~1", (values) => {
    const geo = segmentedBarGeometry({ width: 60, height: 10, values, fontSize: 6 });
    let sum = 0;
    for (const s of geo.segments) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x + s.w).toBeLessThanOrEqual(60.01);
      sum += s.share;
    }
    // shares are 2-dp rounded, so the sum can drift up to ±0.005 per segment
    // from the exact 1; the tolerance must scale with segment count.
    const tol = geo.segments.length * 0.005 + 1e-9;
    expect(sum).toBeGreaterThanOrEqual(1 - tol);
    expect(sum).toBeLessThanOrEqual(1 + tol);
    expect(largestRemainderPercents(geo.segments.map((s) => s.share)).reduce((a, b) => a + b)).toBe(
      100,
    );
  });
});
