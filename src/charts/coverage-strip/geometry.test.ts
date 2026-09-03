import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { COVERAGE_MAX_SLOTS, coverageGeometry } from "./geometry.js";

const base = { width: 80, height: 10, shape: "square" as const };

describe("coverageGeometry", () => {
  it("measured cells are present, null cells are gaps — 0 ≠ null", () => {
    const geo = coverageGeometry({ ...base, data: [0, null, 3, null, null] });
    expect(geo.cells.map((c) => c.present)).toEqual([true, false, true, false, false]);
    expect(geo.measured).toBe(2);
    expect(geo.expected).toBe(5);
    expect(geo.coverage).toBe(0.4);
    expect(geo.longestGap).toBe(2);
  });

  it("`expected` beyond data length makes trailing missingness count", () => {
    const geo = coverageGeometry({ ...base, data: [1, 2, 3], expected: 6 });
    expect(geo.expected).toBe(6);
    expect(geo.cells.length).toBe(6);
    expect(geo.cells.slice(3).every((c) => !c.present)).toBe(true);
    expect(geo.longestGap).toBe(3);
    expect(geo.coverage).toBe(0.5);
  });

  it("NaN is measured-but-unreadable: present cell, value omitted", () => {
    const geo = coverageGeometry({ ...base, data: [3, Number.NaN, 5] });
    expect(geo.cells[1]!.present).toBe(true);
    expect(geo.cells[1]!.value).toBeNull();
    expect(geo.measured).toBe(3);
  });

  it("intensity mode shades measured cells; gaps carry no step", () => {
    const geo = coverageGeometry({
      ...base,
      data: [0, null, 100],
      mode: "intensity",
      steps: 5,
      domain: [0, 100],
    });
    expect(geo.cells[0]!.step).toBe(0);
    expect(geo.cells[1]!.step).toBeNull();
    expect(geo.cells[2]!.step).toBe(4);
  });

  it("all-null → 0% coverage, every cell hollow (renders, not empty state)", () => {
    const geo = coverageGeometry({ ...base, data: [null, null, null, null] });
    expect(geo.coverage).toBe(0);
    expect(geo.measured).toBe(0);
    expect(geo.cells.every((c) => !c.present)).toBe(true);
    expect(geo.longestGap).toBe(4);
  });

  it("a non-finite `expected` is ignored — the window is the data", () => {
    // `expected={hours / bucket}` with bucket 0, or Number("") from a cleared
    // field: NaN used to run the slot loop zero times, so a strip holding real
    // readings drew nothing and announced "No data."
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const geo = coverageGeometry({ ...base, data: [1, null, 3], expected: bad });
      expect(geo.expected).toBe(3);
      expect(geo.cells.length).toBe(3);
      expect(geo.measured).toBe(2);
    }
  });

  it("a fractional `expected` rounds to the slots actually drawn", () => {
    // announced scale = painted scale: 7.5 used to draw 8 cells and report
    // "4 of 7.5 slots" at 4/7.5 coverage
    const geo = coverageGeometry({ ...base, data: [1, null, 3, 4], expected: 7.5 });
    expect(geo.expected).toBe(8);
    expect(geo.cells.length).toBe(geo.expected);
    expect(geo.coverage).toBe(0.38);
  });

  it("a non-finite or sub-1 `steps` falls back to the default ramp", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -3]) {
      const geo = coverageGeometry({ ...base, data: [0, 50, 100], mode: "intensity", steps: bad });
      expect(geo.steps).toBe(bad === 0 || bad === -3 ? 1 : 5);
      expect(geo.cells.every((c) => c.step === null || Number.isInteger(c.step))).toBe(true);
    }
  });

  it("caps at COVERAGE_MAX_SLOTS", () => {
    const geo = coverageGeometry({ ...base, data: Array.from({ length: 500 }, () => 1) });
    expect(geo.cells.length).toBe(COVERAGE_MAX_SLOTS);
    expect(geo.expected).toBe(COVERAGE_MAX_SLOTS);
  });

  it("rawCoverage feeds Intl the raw ratio; coverage stays 2-dp (57.5% boundary)", () => {
    // 23/40 = 0.575 is a true decimal half: `Intl` rounds it up to "58%", but
    // `round2` (binary `Math.round` on 57.4999…) collapses it to 0.57, so Intl
    // on the pre-rounded field yields "57%". `rawCoverage` is the fraction the
    // percent formatter is contracted to receive; `coverage` keeps its 2-dp
    // contract for other consumers. Sibling k-of-n charts (icon-array,
    // progress) feed Intl the raw fraction, so `rawCoverage` lets this chart
    // agree with them.
    const data = Array.from({ length: 40 }, (_, i) => (i < 23 ? 1 : null));
    const geo = coverageGeometry({ ...base, data });
    expect(geo.measured).toBe(23);
    expect(geo.expected).toBe(40);
    expect(geo.coverage).toBe(0.57);
    expect(geo.rawCoverage).toBe(0.575);
    const pct = new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 0 });
    expect(pct.format(geo.rawCoverage)).toBe("58%");
    expect(pct.format(geo.coverage)).toBe("57%");
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      maxLength: 130,
    }),
    fc.constantFrom<"square" | "round" | "dot">("square", "round", "dot"),
  ])("containment: cells stay inside the box", (data, shape) => {
    const geo = coverageGeometry({ ...base, shape, data });
    for (const c of geo.cells) {
      expect(c.x).toBeGreaterThanOrEqual(-0.01);
      expect(c.x + c.w).toBeLessThanOrEqual(80.01);
      expect(c.y).toBeGreaterThanOrEqual(-0.01);
      expect(c.y + c.h).toBeLessThanOrEqual(10.01);
    }
    expect(geo.coverage).toBeGreaterThanOrEqual(0);
    expect(geo.coverage).toBeLessThanOrEqual(1);
    expect(geo.rawCoverage).toBeGreaterThanOrEqual(0);
    expect(geo.rawCoverage).toBeLessThanOrEqual(1);
  });
});
