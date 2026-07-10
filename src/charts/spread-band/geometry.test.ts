import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { spreadBandGeometry } from "./geometry.js";

const base = { width: 80, height: 20, gutterCh: 0, fontSize: 6 };

describe("spreadBandGeometry (plan/26 §6)", () => {
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
