import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { pictogramGeometry } from "./geometry.js";

const base = { width: 60, height: 12, shape: "dot" as const, fractional: "clip" as const };

describe("pictogramGeometry (plan/22 #7)", () => {
  it("N units, constant size, fills per unit", () => {
    const geo = pictogramGeometry({ ...base, value: 2.5, total: 4 });
    expect(geo.units.map((u) => u.fill)).toEqual([1, 1, 0.5, 0]);
    const rs = new Set(geo.units.map((u) => u.r));
    expect(rs.size).toBe(1); // unit size NEVER varies
    expect(geo.units[2]!.partial).toContain("A"); // circular segment
  });

  it("fractional='round' snaps to whole units", () => {
    const geo = pictogramGeometry({ ...base, fractional: "round", value: 2.5, total: 4 });
    expect(geo.units.map((u) => u.fill)).toEqual([1, 1, 1, 0]);
    expect(geo.units.every((u) => u.partial === undefined)).toBe(true);
  });

  it("square partial is a left-anchored partial rect", () => {
    const geo = pictogramGeometry({ ...base, shape: "square", value: 1.25, total: 2 });
    expect(geo.units[1]!.partial).toMatch(/^M.*H.*V.*H.*Z$/);
  });

  it("overflow → all filled; negative → all empty; bad total → no units", () => {
    expect(
      pictogramGeometry({ ...base, value: 9, total: 4 }).units.every((u) => u.fill === 1),
    ).toBe(true);
    expect(
      pictogramGeometry({ ...base, value: -2, total: 4 }).units.every((u) => u.fill === 0),
    ).toBe(true);
    expect(pictogramGeometry({ ...base, value: 3, total: 0 }).units.length).toBe(0);
  });

  test.prop([
    fc.double({ noNaN: true, min: -5, max: 30 }),
    fc.integer({ min: 1, max: 20 }),
    fc.constantFrom<"dot" | "square">("dot", "square"),
  ])("containment: every unit + partial path inside the box", (value, total, shape) => {
    const geo = pictogramGeometry({
      width: 60,
      height: 12,
      value,
      total,
      shape,
      fractional: "clip",
    });
    for (const u of geo.units) {
      expect(u.cx - u.r).toBeGreaterThanOrEqual(-0.01);
      expect(u.cx + u.r).toBeLessThanOrEqual(60.01);
      expect(u.cy - u.r).toBeGreaterThanOrEqual(-0.01);
      expect(u.cy + u.r).toBeLessThanOrEqual(12.01);
      for (const m of (u.partial ?? "").matchAll(/-?\d+(?:\.\d+)?/g)) {
        const v = Number(m[0]);
        expect(v).toBeGreaterThanOrEqual(-0.01);
        expect(v).toBeLessThanOrEqual(60.01);
      }
    }
  });
});
