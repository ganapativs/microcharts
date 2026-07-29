import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  binRaw,
  calibrationGeometry,
  isBinned,
  resolveBins,
  resolveMinSupport,
  supportPath,
  DOT_R,
  PAD,
} from "./geometry.js";

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

  // `bins` is caller config, and it sizes both the bucketing and the support
  // lane's columns. Unresolved, `bins={1e8}` exhausted the heap and a
  // non-finite one reached `plotW / Math.max(1, NaN)` — a whole lane of
  // `x="NaN" width="NaN"` under a scatter that looked perfectly normal.
  describe("hostile `bins`", () => {
    it("resolves non-finite to the documented default and clamps the ceiling", () => {
      expect(resolveBins(NaN)).toBe(10);
      expect(resolveBins(Infinity)).toBe(10);
      expect(resolveBins(-Infinity)).toBe(10);
      expect(resolveBins(0)).toBe(1);
      expect(resolveBins(-5)).toBe(1);
      expect(resolveBins(2.7)).toBe(2);
      expect(resolveBins(1e8)).toBe(512);
    });

    it("keeps every emitted coordinate finite", () => {
      for (const bins of [NaN, Infinity, 0, -5, 1e8]) {
        const geo = calibrationGeometry({
          data: BINS,
          bins,
          minSupport: 11,
          width: 100,
          height: 32,
          supportHeight: 6,
        });
        for (const b of geo.supportBars) {
          for (const n of [b.x, b.y, b.width, b.height]) expect(Number.isFinite(n)).toBe(true);
        }
        expect(supportPath(geo.supportBars)).not.toMatch(/NaN|Infinity/);
      }
    });

    it("binning a huge `bins` stays bounded", () => {
      const raw = Array.from({ length: 40 }, (_, i) => ({ p: (i % 10) / 10, outcome: i % 2 }));
      expect(binRaw(raw, 1e9).length).toBe(512);
      expect(binRaw(raw, NaN).length).toBe(10);
    });
  });

  // A non-finite `minSupport` left `count < minSupport` false for every bin, so
  // the low-support disclosure this chart exists to force went silent.
  it("resolves a non-finite minSupport to the 2% default", () => {
    expect(resolveMinSupport(BINS, NaN)).toBe(11); // 2% of 533 samples
    expect(resolveMinSupport(BINS, Infinity)).toBe(11);
    expect(resolveMinSupport(BINS, undefined)).toBe(11);
    expect(resolveMinSupport(BINS, 40)).toBe(40);
    expect(resolveMinSupport(BINS, 0)).toBe(0);
  });

  // Support columns are centred on their bin, so a bin at predicted 0 or 1 hung
  // half a column past the frame; dots paint a disc around their centre, so the
  // perfectly-calibrated top bin (predicted 1, observed 1) put ink outside too.
  // `.mc-root` is overflow: visible — an escape lands on the neighbouring text.
  it("edge bins stay inside the viewBox (containment)", () => {
    const edge = [
      { predicted: 0, observed: 0, count: 500 },
      { predicted: 0.5, observed: 0.5, count: 500 },
      { predicted: 1, observed: 1, count: 500 },
    ];
    for (const bins of [1, 3, 10, 512]) {
      const geo = calibrationGeometry({
        data: edge,
        bins,
        minSupport: 10,
        width: 100,
        height: 32,
        supportHeight: 6,
      });
      for (const b of geo.supportBars) {
        expect(b.x).toBeGreaterThanOrEqual(PAD);
        expect(b.x + b.width).toBeLessThanOrEqual(100 - PAD);
        expect(b.y + b.height).toBeLessThanOrEqual(32 - PAD);
      }
      for (const p of geo.points) {
        expect(p.x - DOT_R).toBeGreaterThanOrEqual(0);
        expect(p.x + DOT_R).toBeLessThanOrEqual(100);
        expect(p.y - DOT_R).toBeGreaterThanOrEqual(0);
        expect(p.y + DOT_R).toBeLessThanOrEqual(32);
      }
    }
  });

  it("draws the support lane as one path, one subpath per column", () => {
    const geo = calibrationGeometry({
      data: BINS,
      bins: 10,
      minSupport: 11,
      width: 100,
      height: 32,
      supportHeight: 6,
    });
    expect(supportPath(geo.supportBars).match(/M/g)!.length).toBe(10);
    expect(supportPath([])).toBe("");
    // zero-height columns are omitted rather than emitted as invisible subpaths
    expect(supportPath([{ x: 1, y: 1, width: 4, height: 0 }])).toBe("");
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
    // centre ± the dot radius: the mark paints a disc, not a point.
    for (const p of geo.points) {
      expect(p.x - DOT_R).toBeGreaterThanOrEqual(0);
      expect(p.x + DOT_R).toBeLessThanOrEqual(100.01);
      expect(p.y - DOT_R).toBeGreaterThanOrEqual(0);
      expect(p.y + DOT_R).toBeLessThanOrEqual(32.01);
    }
  });
});
