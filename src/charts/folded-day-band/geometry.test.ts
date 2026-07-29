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

describe("foldedBandGeometry", () => {
  it("folds periods and finds the median peak", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      percentiles: BANDS,
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
      percentiles: BANDS,
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
      percentiles: BANDS,
      width: 120,
      height: 32,
    });
    const peakStat = geo.binStats.find((s) => s.bin === 14)!;
    expect(peakStat.median).toBe(82);
    expect(peakStat.q3).toBeGreaterThanOrEqual(peakStat.q1);
  });

  // Hostile CONFIG: `period` is a number a host computes (`Number("")` on an
  // empty field), and `t % 0` / `t % Infinity` are both NaN — every reading
  // piled into bin 0 while the chart still looked plotted.
  it.each([NaN, Infinity, -Infinity, 0, -5])("period=%p folds on the default period", (period) => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period,
      bins: 24,
      percentiles: BANDS,
      width: 120,
      height: 32,
    });
    const ok = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      percentiles: BANDS,
      width: 120,
      height: 32,
    });
    expect(geo.peak).toEqual(ok.peak);
    expect(geo.medianPath).toBe(ok.medianPath);
  });

  // `quantiles` yields NaN for a non-finite probability by design. That NaN
  // reached the band's `d` (dropped whole by the browser) and binStats.q1/q3,
  // which the interactive readout painted as "middle half NaN–NaN".
  it("drops an envelope whose percentile is not finite", () => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      percentiles: [
        [NaN, 75],
        [5, 95],
      ],
      width: 120,
      height: 32,
    });
    expect(geo.bandPaths.length).toBe(1);
    expect(geo.bandPaths.join("")).not.toMatch(/NaN|Infinity/);
    for (const s of geo.binStats) {
      expect(Number.isFinite(s.q1)).toBe(true);
      expect(Number.isFinite(s.q3)).toBe(true);
    }
  });

  // `Chart` clamps a non-finite viewBox to 1; geometry scaling by the raw prop
  // instead emitted NaN coords (and a NaN `--mc-seat`) under a confident name.
  it.each([
    ["width", NaN],
    ["width", 0],
    ["height", NaN],
    ["height", -10],
  ])("a non-finite %s still yields finite coords", (which, bad) => {
    const geo = foldedBandGeometry({
      data: DATA,
      today: null,
      period: 24,
      bins: 24,
      percentiles: BANDS,
      width: which === "width" ? (bad as number) : 120,
      height: which === "height" ? (bad as number) : 32,
    });
    expect(`${geo.medianPath}${geo.bandPaths.join("")}`).not.toMatch(/NaN|Infinity/);
    expect(Number.isFinite(geo.y1)).toBe(true);
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
      percentiles: BANDS,
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
