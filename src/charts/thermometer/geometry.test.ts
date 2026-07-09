import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { thermometerGeometry } from "./geometry.js";

const base = {
  domain: [0, 100] as const,
  ticks: 5,
  width: 16,
  height: 48,
  orientation: "vertical" as const,
  bulb: true,
  pad: 2,
};

describe("thermometerGeometry (plan/24 #5) — calibrated tube", () => {
  it("fill anchors at the bulb end and rises with value", () => {
    const lo = thermometerGeometry({ ...base, value: 10 });
    const hi = thermometerGeometry({ ...base, value: 90 });
    expect(hi.fill.height).toBeGreaterThan(lo.fill.height);
    // fill starts at domain[0] (height ~ 0 at the floor)
    expect(thermometerGeometry({ ...base, value: 0 }).fill.height).toBeCloseTo(0, 1);
  });

  it("value outside the domain flags overflow and clamps the fill", () => {
    const r = thermometerGeometry({ ...base, value: 140 });
    expect(r.overflow).toBe(true);
    // clamped fill edge equals the value=100 edge
    expect(r.fillEdge).toBeCloseTo(thermometerGeometry({ ...base, value: 100 }).fillEdge, 2);
  });

  it("target renders a tick; absent target → none", () => {
    expect(thermometerGeometry({ ...base, value: 50, target: 80 }).targetTick).not.toBeNull();
    expect(thermometerGeometry({ ...base, value: 50 }).targetTick).toBeNull();
  });

  it("bulb toggles", () => {
    expect(thermometerGeometry({ ...base, value: 50 }).bulb).not.toBeNull();
    expect(thermometerGeometry({ ...base, value: 50, bulb: false }).bulb).toBeNull();
  });

  it("ticks: count vs explicit values", () => {
    expect(thermometerGeometry({ ...base, value: 50, ticks: 5 }).tickLines.length).toBe(5);
    expect(thermometerGeometry({ ...base, value: 50, ticks: [0, 50, 100] }).tickLines.length).toBe(
      3,
    );
  });

  it("horizontal orientation fills along x", () => {
    const r = thermometerGeometry({
      ...base,
      value: 60,
      orientation: "horizontal",
      width: 48,
      height: 16,
    });
    expect(r.fill.width).toBeGreaterThan(0);
  });

  test.prop([fc.integer({ min: 0, max: 100 })])("fill + ticks stay inside the box", (value) => {
    const r = thermometerGeometry({ ...base, value });
    expect(r.fill.y).toBeGreaterThanOrEqual(0);
    expect(r.fill.y + r.fill.height).toBeLessThanOrEqual(48);
    for (const t of r.tickLines) expect(t.x2).toBeLessThanOrEqual(16.5);
  });
});
