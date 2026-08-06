import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { percentileGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// a standing that climbs from the middle half up above it
const SAMPLE = [42, 48, 55, 61, 68, 74, 79, 81];

describe("percentileGeometry", () => {
  it("locks the y-domain to [0,100]: 100 at top, 0 at bottom", () => {
    const geo = percentileGeometry({ ...base, data: [100, 50, 0] })!;
    expect(geo.line.d).toMatch(/^M/);
    expect(geo.last.value).toBe(0);
    expect(geo.last.y).toBeCloseTo(base.height - 2, 1); // 0 → bottom (pad)
  });

  it("`domain` is the escape hatch; the full ladder stays the default", () => {
    const full = percentileGeometry({ ...base, data: SAMPLE })!;
    const zoom = percentileGeometry({ ...base, data: SAMPLE, domain: [40, 85] })!;
    const spread = (g: typeof full) =>
      Math.max(...g.points.map((p) => p.y)) - Math.min(...g.points.map((p) => p.y));
    expect(spread(zoom)).toBeGreaterThan(spread(full));
    // a reading outside the caller's frame lands on the plot edge, never past it
    const off = percentileGeometry({ ...base, data: [10, 90], domain: [40, 85] })!;
    for (const p of off.points) {
      expect(p.y).toBeGreaterThanOrEqual(off.y0);
      expect(p.y).toBeLessThanOrEqual(off.y1);
    }
    // …and an unusable pair falls back to the locked frame rather than a NaN scale
    for (const bad of [
      [Number.NaN, 100],
      [0, Infinity],
    ] as [number, number][]) {
      expect(percentileGeometry({ ...base, data: SAMPLE, domain: bad })!.points).toEqual(
        full.points,
      );
    }
  });

  it("delta is last − first in percentile points", () => {
    const geo = percentileGeometry({ ...base, data: SAMPLE })!;
    expect(geo.first.value).toBe(42);
    expect(geo.last.value).toBe(81);
    expect(geo.delta).toBe(39);
  });

  it("classifies movement across the middle half (p25–75)", () => {
    expect(percentileGeometry({ ...base, data: SAMPLE })!.movement).toBe("roseAbove");
    expect(percentileGeometry({ ...base, data: [80, 70, 55, 40, 30] })!.movement).toBe(
      "enteredMiddle",
    );
    expect(percentileGeometry({ ...base, data: [90, 30, 10] })!.movement).toBe("fellBelow");
    expect(percentileGeometry({ ...base, data: [50, 50, 50] })!.movement).toBe("heldMiddle");
    expect(percentileGeometry({ ...base, data: [85, 90, 88] })!.movement).toBe("heldAbove");
    expect(percentileGeometry({ ...base, data: [10, 5, 12] })!.movement).toBe("heldBelow");
  });

  it("fixed bands nest: outer p5–95 taller than inner p25–75", () => {
    const geo = percentileGeometry({ ...base, data: SAMPLE })!;
    expect(geo.bands.outer.height).toBeGreaterThan(geo.bands.inner.height);
    // higher percentile sits higher (smaller y): the outer top is above the inner top
    expect(geo.bands.outer.y).toBeLessThan(geo.bands.inner.y);
    expect(geo.bands.inner.x).toBe(0);
    expect(geo.bands.inner.width).toBe(base.width);
  });

  it("clamps out-of-range ranks and flags it", () => {
    const geo = percentileGeometry({ ...base, data: [120, -5, 50] })!;
    expect(geo.clamped).toBe(true);
    expect(geo.first.value).toBe(100); // 120 → 100
    expect(geo.points[1]!.value).toBe(0); // −5 → 0
  });

  it("in-range ranks are not flagged", () => {
    expect(percentileGeometry({ ...base, data: SAMPLE })!.clamped).toBe(false);
  });

  it("nulls break the trace into subpaths (gaps)", () => {
    const geo = percentileGeometry({ ...base, data: [50, 55, null, 70, 75] })!;
    expect(geo.line.d.match(/M/g)!.length).toBe(2);
  });

  it("single point → renders, movement held, delta 0", () => {
    const geo = percentileGeometry({ ...base, data: [60] })!;
    expect(geo.delta).toBe(0);
    expect(geo.movement).toBe("heldMiddle");
    expect(geo.points).toHaveLength(1);
  });

  // The box is a caller prop: `Chart` clamps the FRAME, so a raw non-finite or
  // negative side left NaN / x=-42 coords inside a valid viewBox.
  it("a non-finite or non-positive box falls back to the documented one", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -40]) {
      for (const box of [
        { width: bad, height: 20 },
        { width: 80, height: bad },
      ]) {
        const geo = percentileGeometry({ ...box, data: SAMPLE })!;
        expect(geo.line.d).not.toMatch(/NaN|Infinity/);
        expect(geo.x1).toBe(78);
        expect(geo.y1).toBe(18);
      }
    }
  });

  it("a box narrower than twice the pad halves the pad instead of inverting", () => {
    const geo = percentileGeometry({ width: 3, height: 2, data: SAMPLE })!;
    expect(geo.x0).toBe(1.5);
    expect(geo.x1).toBe(1.5);
    expect(geo.y0).toBe(1);
    expect(geo.y1).toBe(1);
    // the plot collapses to a point, but nothing leaves the 3×2 box
    for (const p of geo.points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(3);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(2);
    }
  });

  it("plot box edges match the default padding", () => {
    const geo = percentileGeometry({ ...base, data: SAMPLE })!;
    expect([geo.x0, geo.x1, geo.y0, geo.y1]).toEqual([2, 78, 2, 18]);
  });

  it("empty / all-null → null", () => {
    expect(percentileGeometry({ ...base, data: [] })).toBeNull();
    expect(percentileGeometry({ ...base, data: [Number.NaN, null] })).toBeNull();
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 100 }), { minLength: 1, maxLength: 40 }),
  ])("containment: trace points inside the plot", (data) => {
    const geo = percentileGeometry({ ...base, data });
    if (!geo) return;
    const nums = [...geo.line.d.matchAll(/(-?\d+(?:\.\d+)?)\s(-?\d+(?:\.\d+)?)/g)];
    for (const m of nums) {
      const yv = Number(m[2]);
      expect(yv).toBeGreaterThanOrEqual(1.99);
      expect(yv).toBeLessThanOrEqual(18.01);
    }
    expect(geo.last.x).toBeGreaterThanOrEqual(1.99);
    expect(geo.last.x).toBeLessThanOrEqual(78.01);
  });
});
