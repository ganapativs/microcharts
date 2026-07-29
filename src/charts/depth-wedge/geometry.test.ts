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

describe("depthWedgeGeometry", () => {
  it("builds two wedges, the spread, and the lead ratio", () => {
    const geo = depthWedgeGeometry({
      ...BOOK,
      levels: null,
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
      levels: null,
      normalize: true,
      width: 100,
      height: 24,
    });
    // both wedges reach full height at their side total
    expect(geo.demandPath).toContain("M");
    expect(geo.supplyPath).toContain("M");
  });

  // `levels` is the visible ± range AND the scope the summary claims ("within
  // the shown range"). Before it filtered, a level outside the range kept its
  // step in the path — painting into the page, since `.mc-root` is
  // `overflow: visible` — and still counted toward the announced ratio.
  it("levels windows the book: out-of-range levels leave both the paint and the ratio", () => {
    const wide = depthWedgeGeometry({
      ...BOOK,
      levels: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(wide.demandTotal).toBe(900);
    expect(wide.ratio).toBe(1.8);

    // mid = 100; the 99 bid sits 1.0 away, outside a ±0.6 window
    const near = depthWedgeGeometry({
      ...BOOK,
      levels: 0.6,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(near.demandTotal).toBe(800);
    expect(near.supplyTotal).toBe(500);
    expect(near.ratio).toBe(1.6);
    expect(near.demandSteps.map((s) => s.level)).toEqual([99.9, 99.5]);
  });

  it("a window narrower than the data still paints inside the viewBox", () => {
    const geo = depthWedgeGeometry({
      ...BOOK,
      levels: 0.1,
      normalize: false,
      width: 100,
      height: 24,
    });
    const coords = [...`${geo.demandPath}${geo.supplyPath}`.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)];
    expect(coords.length).toBeGreaterThan(0);
    for (const m of coords) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(0);
      expect(Number(m[1])).toBeLessThanOrEqual(100);
    }
  });

  // A denormal span overflowed the scale (0.45 / 1e-320 = Infinity) and put
  // literal `Infinity` in the emitted `d`; an infinite span collapsed every
  // level onto the mid. Neither is a window — both fall back to the extent.
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -1])(
    "levels=%p falls back to the data extent",
    (levels) => {
      const auto = depthWedgeGeometry({
        ...BOOK,
        levels: null,
        normalize: false,
        width: 100,
        height: 24,
      });
      const geo = depthWedgeGeometry({
        ...BOOK,
        levels,
        normalize: false,
        width: 100,
        height: 24,
      });
      expect(geo.demandPath).toBe(auto.demandPath);
      expect(geo.supplyPath).toBe(auto.supplyPath);
      expect(geo.ratio).toBe(auto.ratio);
    },
  );

  it("a crossed book keeps each side on its own price side of the mid", () => {
    // best bid ABOVE best ask: the signed-extent span used to come out negative
    // and mirror the wedges, hiding the crossing.
    const geo = depthWedgeGeometry({
      demand: [{ level: 101, amount: 100 }],
      supply: [{ level: 99, amount: 100 }],
      levels: null,
      normalize: false,
      width: 100,
      height: 24,
    });
    expect(geo.demandPath.startsWith("M99 ")).toBe(true); // 101 > mid → right half
    expect(geo.supplyPath.startsWith("M1 ")).toBe(true);
    expect(geo.spread).toBe(0);
  });

  it("crossed / empty side is honest", () => {
    const geo = depthWedgeGeometry({
      demand: BOOK.demand,
      supply: [],
      levels: null,
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
      levels: null,
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

  // Same containment claim, but with a caller-chosen window — the case that
  // used to spill: `levels` scaled the x map without dropping anything.
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
    fc.double({ min: 1e-6, max: 1e6, noNaN: true }),
  ])("any levels window stays inside the viewBox", (demand, supply, levels) => {
    const geo = depthWedgeGeometry({
      demand,
      supply,
      levels,
      normalize: false,
      width: 100,
      height: 24,
    });
    for (const m of `${geo.demandPath}${geo.supplyPath}`.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[1])).toBeLessThanOrEqual(100.01);
      expect(Number(m[2])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[2])).toBeLessThanOrEqual(24.01);
    }
  });
});
