import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { citySkylineGeometry } from "./geometry.js";

const g = (data: { value: number; lit?: number }[]) =>
  citySkylineGeometry({ data, bw: 9, height: 24, groundY: 22, maxH: 20, gap: 3, pad: 2 });

describe("citySkylineGeometry — height + lit windows", () => {
  it("heights are zero-anchored; the tallest fills maxH", () => {
    const geo = g([{ value: 46 }, { value: 23 }, { value: 0 }]);
    expect(geo.buildings[0]!.h).toBeCloseTo(20, 1); // 46 = max → full
    expect(geo.buildings[1]!.h).toBeCloseTo(10, 1); // half
    expect(geo.buildings[2]!.h).toBe(0); // zero → no tower
  });

  it("lit windows are round(lit·windowCount), filled bottom-up", () => {
    const geo = g([{ value: 46, lit: 0.5 }]);
    const b = geo.buildings[0]!;
    expect(b.litCount).toBe(Math.round(0.5 * b.windowCount));
    expect(b.windowsPath.length).toBeGreaterThan(0);
  });

  it("omitting lit → no windows path (plain bar)", () => {
    const geo = g([{ value: 46 }]);
    expect(geo.buildings[0]!.windowsPath).toBe("");
    expect(geo.buildings[0]!.lit).toBeNull();
  });

  it("lit clamps to [0,1]", () => {
    const over = g([{ value: 46, lit: 1.5 }]);
    expect(over.buildings[0]!.litCount).toBe(over.buildings[0]!.windowCount);
    const under = g([{ value: 46, lit: -1 }]);
    expect(under.buildings[0]!.litCount).toBe(0);
  });

  it("buildings march left to right by band", () => {
    const geo = g([{ value: 10 }, { value: 20 }, { value: 30 }]);
    expect(geo.buildings[0]!.x).toBeLessThan(geo.buildings[1]!.x);
    expect(geo.buildings[1]!.x).toBeLessThan(geo.buildings[2]!.x);
  });

  test.prop([
    fc.array(
      fc.record({
        value: fc.integer({ min: 0, max: 100 }),
        lit: fc.double({ min: 0, max: 1, noNaN: true }),
      }),
      { minLength: 1, maxLength: 8 },
    ),
  ])("buildings + windows stay inside the box", (data) => {
    const geo = citySkylineGeometry({
      data,
      bw: 9,
      height: 24,
      groundY: 22,
      maxH: 20,
      gap: 3,
      pad: 2,
    });
    for (const b of geo.buildings) {
      expect(b.y).toBeGreaterThanOrEqual(1.9);
      expect(b.y + b.h).toBeLessThanOrEqual(22.1);
      expect(b.litCount).toBeLessThanOrEqual(b.windowCount);
    }
  });
});
