import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { pictogramGeometry } from "./geometry.js";

const base = { width: 60, height: 12, shape: "dot" as const, fractional: "clip" as const };

describe("pictogramGeometry", () => {
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

  it("a non-finite box falls back to the documented 60×12", () => {
    // <Chart> clamps the FRAME on its own; this used to read the raw prop, so
    // the frame and the units were laid out at different scales.
    const good = pictogramGeometry({ ...base, value: 3, total: 5 });
    expect(pictogramGeometry({ ...base, width: NaN, value: 3, total: 5 })).toEqual(good);
    expect(pictogramGeometry({ ...base, height: Infinity, value: 3, total: 5 })).toEqual(good);
    expect(pictogramGeometry({ ...base, width: 0, height: -4, value: 3, total: 5 })).toEqual(good);
  });

  it("a dense row keeps drawable units instead of collapsing to negative radii", () => {
    // Past ~40 units the fixed gaps swallowed the 60-unit box: r went negative
    // (an SVG error), so the row painted nothing while announcing a count.
    for (const total of [21, 41, 120, 200]) {
      const geo = pictogramGeometry({ ...base, value: 3, total });
      expect(geo.units.length).toBe(total);
      expect(geo.units.every((u) => u.r > 0 && u.ringR >= 0)).toBe(true);
      expect(geo.units.every((u) => u.cx - u.r >= -0.01 && u.cx + u.r <= 60.01)).toBe(true);
    }
  });

  it("the gap cap is a no-op at the documented 20-unit ceiling", () => {
    // 60 / 20 / 2 === 1.5 exactly, so every countable row lays out unchanged.
    const geo = pictogramGeometry({ ...base, value: 3, total: 20 });
    expect(geo.units[0]!.r).toBe(0.72); // ((60 - 1.5·19) / 20 / 2) · 0.92
    expect(geo.units[0]!.cx).toBe(0.79);
  });

  test.prop([
    fc.double({ noNaN: true, min: -5, max: 30 }),
    fc.integer({ min: 1, max: 200 }),
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
    // A negative radius or half-edge is an SVG error, not a small mark.
    expect(geo.units.every((u) => u.r >= 0 && u.ringR >= 0)).toBe(true);
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
