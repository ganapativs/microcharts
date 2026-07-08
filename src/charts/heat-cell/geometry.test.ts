import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { heatCellGeometry } from "./geometry.js";
import type { CellShape } from "../../shared/cell.js";

const SHAPES: CellShape[] = ["square", "round", "dot"];

const stepAt = (v: number) =>
  heatCellGeometry({ width: 12, height: 12, value: v, domain: [0, 100], steps: 5, shape: "square" })
    .step;

describe("heatCellGeometry (plan/22 #3)", () => {
  it("bins a value into 0-based steps over the domain", () => {
    expect(stepAt(0)).toBe(0);
    expect(stepAt(42)).toBe(2);
    expect(stepAt(99)).toBe(4);
    expect(stepAt(100)).toBe(4); // top edge belongs to the last step
  });

  it("clamps out-of-domain values to the end steps (documented)", () => {
    const opts = {
      width: 12,
      height: 12,
      domain: [0, 1] as const,
      steps: 5,
      shape: "square" as const,
    };
    expect(heatCellGeometry({ ...opts, value: -3 }).step).toBe(0);
    expect(heatCellGeometry({ ...opts, value: 7 }).step).toBe(4);
  });

  it("zero-width domain → single mid step", () => {
    const geo = heatCellGeometry({
      width: 12,
      height: 12,
      value: 5,
      domain: [5, 5],
      steps: 5,
      shape: "square",
    });
    expect(geo.step).toBe(2);
    expect(geo.t).toBe(0.5);
  });

  it("non-finite value → null step (designed empty, not a leak)", () => {
    const geo = heatCellGeometry({
      width: 12,
      height: 12,
      value: Number.NaN,
      domain: [0, 1],
      steps: 5,
      shape: "square",
    });
    expect(geo.step).toBeNull();
  });

  test.prop([
    fc.double({ noNaN: true, min: -1e6, max: 1e6 }),
    fc.integer({ min: 2, max: 9 }),
    fc.constantFrom(...SHAPES),
    fc.integer({ min: 6, max: 48 }),
  ])("mark stays inside the box; step within range; 2-dp", (value, steps, shape, size) => {
    const geo = heatCellGeometry({
      width: size,
      height: size,
      value,
      domain: [0, 100],
      steps,
      shape,
    });
    expect(geo.x).toBeGreaterThanOrEqual(0);
    expect(geo.y).toBeGreaterThanOrEqual(0);
    expect(geo.x + geo.w).toBeLessThanOrEqual(size + 0.01);
    expect(geo.y + geo.h).toBeLessThanOrEqual(size + 0.01);
    if (geo.step !== null) {
      expect(geo.step).toBeGreaterThanOrEqual(0);
      expect(geo.step).toBeLessThan(steps);
    }
    expect(geo.t).toBeGreaterThanOrEqual(0);
    expect(geo.t).toBeLessThanOrEqual(1);
  });
});
