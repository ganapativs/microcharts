import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { depthWedgeGeometry } from "./geometry.js";

const BOOK = {
  demand: [
    { level: 99.9, amount: 500 },
    { level: 99.5, amount: 300 },
    { level: 99, amount: 100 },
  ],
  supply: [
    { level: 100.1, amount: 300 },
    { level: 100.5, amount: 200 },
  ],
};

describe("depthWedgeGeometry (plan/25 §12, plan/17 F5)", () => {
  it("builds two wedges, the spread, and the lead ratio", () => {
    const geo = depthWedgeGeometry({
      ...BOOK,
      range: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(geo.demandPath).toContain("M");
    expect(geo.supplyPath).toContain("M");
    expect(geo.spread).toBe(0.2);
    expect(geo.ratio).toBe(1.8);
    expect(geo.lead).toBe(1); // demand
  });

  it("normalize plots shares per side", () => {
    const geo = depthWedgeGeometry({
      ...BOOK,
      range: null,
      normalize: true,
      width: 100,
      height: 24,
    });
    // both wedges reach full height at their side total
    expect(geo.demandPath).toContain("M");
    expect(geo.supplyPath).toContain("M");
  });

  it("crossed / empty side is honest", () => {
    const geo = depthWedgeGeometry({
      demand: BOOK.demand,
      supply: [],
      range: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(geo.supplyPath).toBe("");
    expect(geo.spread).toBe(0);
  });

  test.prop([
    fc.array(
      fc.record({
        level: fc.double({ min: 90, max: 99.9, noNaN: true }),
        amount: fc.double({ min: 1, max: 1000, noNaN: true }),
      }),
      { minLength: 1, maxLength: 8 },
    ),
    fc.array(
      fc.record({
        level: fc.double({ min: 100.1, max: 110, noNaN: true }),
        amount: fc.double({ min: 1, max: 1000, noNaN: true }),
      }),
      { minLength: 1, maxLength: 8 },
    ),
  ])("wedge coords stay inside the viewBox", (demand, supply) => {
    const geo = depthWedgeGeometry({
      demand,
      supply,
      range: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    for (const m of `${geo.demandPath}${geo.supplyPath}`.matchAll(/[ML]([\d.]+) ([\d.]+)/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[1])).toBeLessThanOrEqual(100.01);
      expect(Number(m[2])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[2])).toBeLessThanOrEqual(24.01);
    }
  });
});
