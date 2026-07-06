import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { bulletGeometry } from "./geometry.js";

const g = (o: Partial<Parameters<typeof bulletGeometry>[0]> & { value: number }) =>
  bulletGeometry({ width: 80, height: 16, ...o });

describe("bulletGeometry (plan/05 S4, plan/09)", () => {
  it("measure bar spans 0 → value", () => {
    const b = g({ value: 50, domain: [0, 100] });
    expect(b.measure.x).toBe(1);
    expect(b.measure.width).toBeCloseTo(78 * 0.5, 0);
  });

  it("value clamps to the track when it exceeds max", () => {
    const b = g({ value: 200, domain: [0, 100] });
    expect(b.measure.x + b.measure.width).toBeLessThanOrEqual(79 + 1e-6);
  });

  it("target places a tick inside the track", () => {
    const b = g({ value: 40, target: 80, domain: [0, 100] });
    expect(b.tick).not.toBeNull();
    expect(b.tick!.x).toBeGreaterThan(b.measure.x + b.measure.width);
    expect(b.tick!.x).toBeLessThanOrEqual(79);
  });

  it("no target → no tick", () => {
    expect(g({ value: 40, domain: [0, 100] }).tick).toBeNull();
  });

  it("bands split the track into ascending regions", () => {
    const b = g({ value: 60, bands: [50, 80], domain: [0, 100] });
    expect(b.regions).toHaveLength(3);
    expect(b.regions.map((r) => r.step)).toEqual([0, 1, 2]);
    // contiguous, covering the track
    for (let i = 1; i < b.regions.length; i++) {
      expect(b.regions[i]!.x).toBeCloseTo(b.regions[i - 1]!.x + b.regions[i - 1]!.width, 1);
    }
  });

  it("out-of-range / unsorted thresholds are cleaned", () => {
    const b = g({ value: 60, bands: [80, 50, 999, -5], domain: [0, 100] });
    expect(b.regions).toHaveLength(3); // 50 and 80 kept, sorted; 999/-5 dropped
  });

  it("auto max fits value/target/bands", () => {
    const b = g({ value: 40, target: 90, bands: [120] });
    expect(b.max).toBeGreaterThanOrEqual(120);
  });
});

describe("bulletGeometry (invariants)", () => {
  const num = fc.double({ noNaN: true, noDefaultInfinity: true, min: 0, max: 1e4 });
  test.prop([num, num])("bar + tick stay inside the track, no NaN", (value, target) => {
    const b = g({ value, target });
    expect(Number.isNaN(b.measure.width)).toBe(false);
    expect(b.measure.x).toBeGreaterThanOrEqual(1 - 1e-6);
    expect(b.measure.x + b.measure.width).toBeLessThanOrEqual(79 + 1e-6);
    if (b.tick) {
      expect(b.tick.x).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(b.tick.x).toBeLessThanOrEqual(79 + 1e-6);
    }
  });
});
