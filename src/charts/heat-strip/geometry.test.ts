import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { HEAT_STRIP_MAX_CELLS, heatStripGeometry } from "./geometry.js";

const base = { width: 60, height: 10, steps: 5, shape: "square" as const };

describe("heatStripGeometry", () => {
  it("one cell per slot; nulls hold their slot with a null step", () => {
    const geo = heatStripGeometry({ ...base, values: [3, null, 18] });
    expect(geo.cells.length).toBe(3);
    expect(geo.cells[1]!.step).toBeNull();
    expect(geo.cells[2]!.x).toBeGreaterThan(geo.cells[1]!.x);
  });

  it("steps share the HeatCell calibration (min → 0, max → last)", () => {
    const geo = heatStripGeometry({ ...base, values: [0, 50, 100], domain: [0, 100] });
    expect(geo.cells[0]!.step).toBe(0);
    expect(geo.cells[1]!.step).toBe(2);
    expect(geo.cells[2]!.step).toBe(4);
  });

  it("all values in one step → uniform strip (low variance is honest)", () => {
    const geo = heatStripGeometry({ ...base, values: [50, 51, 52], domain: [0, 500] });
    expect(new Set(geo.cells.map((c) => c.step)).size).toBe(1);
  });

  it("> 60 cells collapse via max-per-bucket (spikes survive)", () => {
    const values = Array.from({ length: 200 }, (_, i) => (i === 100 ? 99 : 1));
    const geo = heatStripGeometry({ ...base, values });
    expect(geo.downsampled).toBe(true);
    expect(geo.cells.length).toBe(HEAT_STRIP_MAX_CELLS);
    expect(Math.max(...geo.cells.map((c) => c.value ?? 0))).toBe(99);
  });

  it("repairs an unusable box and reports the frame the cells were built in", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -40]) {
      const geo = heatStripGeometry({ ...base, width: bad, height: bad, values: [1, 2, 3] });
      expect([geo.width, geo.height]).toEqual([60, 10]);
      for (const c of geo.cells) {
        expect(Number.isFinite(c.x + c.y + c.w + c.h + c.rx)).toBe(true);
        expect(c.w).toBeGreaterThan(0);
      }
    }
  });

  it("steps rounds to whole bins and floors at 2", () => {
    const stepsOf = (steps: number) =>
      heatStripGeometry({ ...base, steps, values: [0, 50, 100], domain: [0, 100] });
    expect(stepsOf(Number.NaN).steps).toBe(5);
    expect(stepsOf(Number.POSITIVE_INFINITY).steps).toBe(5);
    expect(stepsOf(Number.NEGATIVE_INFINITY).steps).toBe(5);
    expect(stepsOf(2.5).steps).toBe(3);
    for (const bad of [0, 1, -3]) expect(stepsOf(bad).steps).toBe(2);
    // and the bins agree with the reported count — the ramp reads geo.steps
    for (const c of stepsOf(Number.NaN).cells) expect(c.step).toBeLessThan(5);
  });

  it("a dot's padding never exceeds half a slot (dense strips stay visible)", () => {
    const geo = heatStripGeometry({
      ...base,
      shape: "dot",
      values: Array.from({ length: 60 }, (_, i) => i),
    });
    expect(geo.cells[0]!.w).toBeGreaterThan(0);
    // still a circle: the radius is half the mark it rounds
    expect(geo.cells[0]!.rx).toBeCloseTo(geo.cells[0]!.w / 2, 2);
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      maxLength: 100,
    }),
    fc.constantFrom<"square" | "round" | "dot">("square", "round", "dot"),
  ])("containment: cells inside the box, steps in range", (values, shape) => {
    const geo = heatStripGeometry({ ...base, shape, values });
    for (const c of geo.cells) {
      expect(c.x).toBeGreaterThanOrEqual(-0.01);
      expect(c.x + c.w).toBeLessThanOrEqual(60.01);
      expect(c.y).toBeGreaterThanOrEqual(-0.01);
      expect(c.y + c.h).toBeLessThanOrEqual(10.01);
      if (c.step !== null) {
        expect(c.step).toBeGreaterThanOrEqual(0);
        expect(c.step).toBeLessThan(5);
      }
    }
  });

  const hostile = fc.oneof(
    fc.double({ min: -100, max: 400 }),
    fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0),
  );
  test.prop([hostile, hostile, hostile, fc.array(fc.double({ min: -1e4, max: 1e4 }))])(
    "any config number still yields finite cells inside the reported box",
    (width, height, steps, values) => {
      const geo = heatStripGeometry({ width, height, steps, shape: "dot", values });
      expect(Number.isFinite(geo.width + geo.height)).toBe(true);
      for (const c of geo.cells) {
        expect(Number.isFinite(c.x + c.y + c.w + c.h + c.rx)).toBe(true);
        expect(c.w).toBeGreaterThanOrEqual(0);
        expect(c.h).toBeGreaterThanOrEqual(0);
        expect(c.x).toBeGreaterThanOrEqual(-0.01);
        expect(c.x + c.w).toBeLessThanOrEqual(geo.width + 0.01);
        expect(c.y + c.h).toBeLessThanOrEqual(geo.height + 0.01);
        expect(c.step === null || (c.step >= 0 && c.step < geo.steps)).toBe(true);
      }
    },
  );
});
