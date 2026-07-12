import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { chevronTier, niceStep, tapeGaugeGeometry } from "./geometry.js";

const ZONES = [
  { from: 100, to: 130, tone: "pos" as const },
  { from: 130, to: 150, tone: "warn" as const },
  { from: 150, to: 200, tone: "neg" as const },
];

describe("tapeGaugeGeometry", () => {
  it("chevron tier is signed and quantized", () => {
    expect(chevronTier(1, [0.4, 1.6])).toBe(1);
    expect(chevronTier(-2, [0.4, 1.6])).toBe(-2);
    expect(chevronTier(0.1, [0.4, 1.6])).toBe(0);
    expect(chevronTier(0, [0.4, 1.6])).toBe(0);
  });

  it("nice tick steps are 1/2/5 × 10ⁿ", () => {
    expect(niceStep(4)).toBe(5);
    expect(niceStep(20)).toBe(20);
    expect(niceStep(0.4)).toBe(0.5);
  });

  it("window is centered on the value; ticks + zones stay inside", () => {
    const geo = tapeGaugeGeometry({
      value: 142,
      span: 25,
      zones: ZONES,
      tick: null,
      width: 28,
      height: 48,
      orientation: "vertical",
    });
    expect(geo.window).toEqual([129.5, 154.5]);
    expect(geo.containingZone).toEqual({ from: 130, to: 150, tone: "warn" });
    expect(geo.zoneRects.length).toBeGreaterThan(0);
    for (const z of geo.zoneRects) {
      expect(z.y).toBeGreaterThanOrEqual(-0.01);
      expect(z.y + z.height).toBeLessThanOrEqual(48.01);
    }
  });

  test.prop([
    fc.double({ min: -1000, max: 1000, noNaN: true }),
    fc.double({ min: 1, max: 200, noNaN: true }),
  ])("tick path coords stay inside the viewBox", (value, span) => {
    const geo = tapeGaugeGeometry({
      value,
      span,
      zones: [],
      tick: null,
      width: 28,
      height: 48,
      orientation: "vertical",
    });
    for (const m of geo.tickPath.matchAll(/([\d.]+) ([\d.]+)/g)) {
      expect(Number(m[2])).toBeGreaterThanOrEqual(-0.01);
      expect(Number(m[2])).toBeLessThanOrEqual(48.01);
    }
  });
});
