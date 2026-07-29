import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { spreadBandGeometry } from "./geometry.js";

const base = { width: 80, height: 20, gutterCh: 0, fontSize: 6 };

describe("spreadBandGeometry", () => {
  it("one shared domain: the same value lands at the same y in both series", () => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: 0, b: 10 },
        { a: 10, b: 0 },
      ],
    });
    expect(geo.subjectPoints[1]![1]).toBe(geo.referencePoints[0]![1]);
  });

  it("crossing splits both signed bands and records the flip", () => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: 0, b: 10 },
        { a: 10, b: 0 },
      ],
    });
    expect(geo.crossings.length).toBe(1);
    expect(geo.lastFlip).toBe(1);
    expect(geo.aLeadBand).not.toBe("");
    expect(geo.bLeadBand).not.toBe("");
  });

  it("never crossing → one band only, no crossing dots", () => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: 10, b: 5 },
        { a: 12, b: 6 },
      ],
    });
    expect(geo.crossings.length).toBe(0);
    expect(geo.aLeadBand).not.toBe("");
    expect(geo.bLeadBand).toBe("");
  });

  it("null in either series is a gap in BOTH lines", () => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: 5, b: null },
        { a: 6, b: 7 },
      ],
    });
    expect(geo.subjectPoints[0]).toBeNull();
    expect(geo.referencePoints[0]).toBeNull();
    expect(geo.subjectPoints[1]).not.toBeNull();
  });

  it("identical series → coincident, no bands", () => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: 5, b: 5 },
        { a: 6, b: 6 },
      ],
    });
    expect(geo.coincident).toBe(true);
    expect(geo.aLeadBand).toBe("");
    expect(geo.bLeadBand).toBe("");
  });

  // A gap, or a gap between two gaps, can overflow to ±Infinity long before the
  // values themselves do. `Infinity / (Infinity + Infinity)` is NaN, NaN sails
  // through `clamp`, and the crossing dot plus its two split band subpaths
  // reached the DOM as `MNaN NaN`.
  it.each([
    ["both gaps overflow", 1e308, -1e308, -1e308, 1e308],
    ["the gap-of-gaps overflows", 1e308, 0, -1e308, 0],
    ["neither overflows alone", 5e307, -5e307, -5e307, 5e307],
  ])("crossing stays finite when %s", (_why, a0, b0, a1, b1) => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: a0, b: b0 },
        { a: a1, b: b1 },
      ],
    });
    expect(geo.crossings.length).toBe(1);
    for (const v of geo.crossings[0]!) expect(Number.isFinite(v)).toBe(true);
    for (const d of [geo.aLeadBand, geo.bLeadBand, geo.subjectD, geo.referenceD]) {
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  });

  it("the crossing dot sits on the drawn subject segment", () => {
    const geo = spreadBandGeometry({
      ...base,
      data: [
        { a: 0, b: 10 },
        { a: 10, b: 0 },
      ],
    });
    const [x, y] = geo.crossings[0]!;
    const [x0, y0] = geo.subjectPoints[0]!;
    const [x1, y1] = geo.subjectPoints[1]!;
    const t = (x - x0) / (x1 - x0);
    expect(y).toBeCloseTo(y0 + t * (y1 - y0), 1);
  });

  test.prop([
    fc.array(
      fc.record({
        a: fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }),
        b: fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }),
      }),
      { maxLength: 40 },
    ),
  ])("containment: every mark inside the plot", (data) => {
    const geo = spreadBandGeometry({ ...base, data });
    for (const p of [...geo.subjectPoints, ...geo.referencePoints, ...geo.crossings]) {
      if (!p) continue;
      expect(p[0]).toBeGreaterThanOrEqual(0);
      expect(p[0]).toBeLessThanOrEqual(80);
      expect(p[1]).toBeGreaterThanOrEqual(0);
      expect(p[1]).toBeLessThanOrEqual(20);
    }
  });
});
