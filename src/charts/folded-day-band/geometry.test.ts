import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { foldedBandGeometry } from "./geometry.js";

const curve = (h: number) => Math.round(40 + 42 * Math.max(0, 1 - Math.abs(h - 14) / 10));
const DATA = Array.from({ length: 3 }, (_p, p) =>
  Array.from({ length: 24 }, (_h, h) => ({ t: p * 24 + h, value: curve(h) + [-2, 0, 2][p]! })),
).flat();
const TODAY = Array.from({ length: 24 }, (_h, h) => ({ t: h, value: 90 }));
const BANDS: [number, number][] = [
  [25, 75],
  [5, 95],
];

describe("foldedBandGeometry (plan/25 §15, plan/17 F7)", () => {
  it("folds periods and finds the median peak", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      bands: BANDS,
      width: 120,
      height: 32,
    });
    expect(geo.peak.bin).toBe(14);
    expect(geo.peak.median).toBe(82);
    expect(geo.bandPaths.length).toBe(2);
    expect(geo.medianPath).toContain("M");
  });

  it("today overlay + percentile vs the pooled distribution", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: TODAY,
      period: 24,
      bins: 24,
      bands: BANDS,
      width: 120,
      height: 32,
    });
    expect(geo.todayPath).not.toBeNull();
    expect(geo.todayPercentile!).toBeGreaterThan(75);
  });

  it("per-bin stats carry median + middle-half", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      bands: BANDS,
      width: 120,
      height: 32,
    });
    const peakStat = geo.binStats.find((s) => s.bin === 14)!;
    expect(peakStat.median).toBe(82);
    expect(peakStat.q3).toBeGreaterThanOrEqual(peakStat.q1);
  });

  test.prop([
    fc.array(
      fc.record({
        t: fc.integer({ min: 0, max: 1000 }),
        value: fc.double({ min: 0, max: 100, noNaN: true }),
      }),
      { minLength: 1, maxLength: 300 },
    ),
  ])("band + median coords stay inside the viewBox", (data) => {
    const geo = foldedBandGeometry({
      data,
      today: null,
      period: 24,
      bins: 24,
      bands: BANDS,
      width: 120,
      height: 32,
    });
    for (const m of `${geo.medianPath}${geo.bandPaths.join("")}`.matchAll(/([\d.]+) ([\d.]+)/g)) {
      expect(Number(m[1])).toBeLessThanOrEqual(120.01);
      expect(Number(m[2])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[2])).toBeLessThanOrEqual(32.01);
    }
  });
});
