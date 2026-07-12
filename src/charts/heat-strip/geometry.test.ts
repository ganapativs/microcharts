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
});
