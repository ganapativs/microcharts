import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { binRaw, calibrationGeometry, isBinned } from "./geometry.js";

const BINS = [
  { predicted: 0.05, observed: 0.05, count: 100 },
  { predicted: 0.15, observed: 0.16, count: 90 },
  { predicted: 0.25, observed: 0.24, count: 80 },
  { predicted: 0.35, observed: 0.36, count: 70 },
  { predicted: 0.45, observed: 0.44, count: 60 },
  { predicted: 0.55, observed: 0.56, count: 50 },
  { predicted: 0.65, observed: 0.63, count: 40 },
  { predicted: 0.7, observed: 0.52, count: 30 },
  { predicted: 0.85, observed: 0.83, count: 8 },
  { predicted: 0.95, observed: 0.9, count: 5 },
];

describe("calibrationGeometry", () => {
  it("discriminates pre-binned from raw input", () => {
    expect(isBinned(BINS)).toBe(true);
    expect(isBinned([{ p: 0.5, outcome: 1 }])).toBe(false);
  });

  it("bins raw pairs into observed frequencies", () => {
    const raw = [
      { p: 0.05, outcome: 0 },
      { p: 0.06, outcome: 1 },
      { p: 0.55, outcome: 1 },
      { p: 0.56, outcome: 1 },
    ];
    const rows = binRaw(raw, 10);
    expect(rows[0]!.count).toBe(2);
    expect(rows[0]!.observed).toBe(0.5); // one hit of two
    expect(rows[5]!.observed).toBe(1); // both hits
  });

  it("flags low-support bins + finds the largest gap", () => {
    const geo = calibrationGeometry({
      data: BINS,
      bins: 10,
      minSupport: 11,
      width: 100,
      height: 32,
      supportHeight: 6,
    });
    expect(geo.points.filter((p) => p.lowSupport).length).toBe(2);
    expect(geo.maxGap).toEqual({ predicted: 0.7, observed: 0.52 });
    expect(geo.supportBars.length).toBe(10);
  });

  test.prop([
    fc.array(
      fc.record({ p: fc.double({ min: 0, max: 1, noNaN: true }), outcome: fc.constantFrom(0, 1) }),
      { minLength: 1, maxLength: 500 },
    ),
  ])("points stay inside the plot", (raw) => {
    const geo = calibrationGeometry({
      data: raw,
      bins: 10,
      minSupport: 10,
      width: 100,
      height: 32,
      supportHeight: 6,
    });
    for (const p of geo.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100.01);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(32.01);
    }
  });
});
