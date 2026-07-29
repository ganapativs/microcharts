import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { funnelGeometry } from "./geometry.js";

const base = {
  width: 60,
  height: 18,
  mode: "absolute" as const,
  connectors: true,
  label: "none" as const,
};

describe("funnelGeometry", () => {
  it("column heights ∝ value, zero-anchored; slats connect stages", () => {
    const geo = funnelGeometry({ ...base, values: [100, 46, 22] });
    expect(geo.stages[0]!.h).toBeGreaterThan(geo.stages[1]!.h);
    expect(geo.stages[0]!.y + geo.stages[0]!.h).toBeCloseTo(18, 1);
    expect(geo.slats.length).toBe(2);
  });

  it("rate mode normalizes to the FIRST stage", () => {
    const geo = funnelGeometry({ ...base, mode: "rate", values: [200, 100, 50] });
    expect(geo.stages[0]!.h).toBeCloseTo(18, 1); // 100%
    expect(geo.stages[1]!.h).toBeCloseTo(9, 1); // 50% of first
  });

  it("zero mid-stage → zero-height column, later stages still render", () => {
    const geo = funnelGeometry({ ...base, values: [10, 0, 5] });
    expect(geo.stages[1]!.h).toBe(0);
    expect(geo.stages[2]!.h).toBeGreaterThan(0);
  });

  it("a box that cannot be painted in falls back to the documented default", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -50]) {
      const geo = funnelGeometry({ ...base, width: bad, height: bad, values: [10, 4] });
      expect(geo.width).toBe(60);
      expect(geo.height).toBe(18);
      for (const st of geo.stages) {
        for (const n of [st.x, st.y, st.w, st.h, st.share]) expect(Number.isFinite(n)).toBe(true);
      }
    }
  });

  it("labels drop when the text would land outside a short box", () => {
    // labelFont floors at 7, so a 4-unit box cannot seat one: no gutter, and the
    // full height goes back to the columns instead of vanishing behind the text.
    expect(funnelGeometry({ ...base, height: 4, label: "percent", values: [10, 4] }).fontSize).toBe(
      0,
    );
    expect(funnelGeometry({ ...base, label: "percent", values: [10, 4] }).fontSize).toBeGreaterThan(
      0,
    );
  });

  test.prop([
    fc.array(fc.double({ min: 0, max: 1e4, noNaN: true }), { minLength: 1, maxLength: 6 }),
    fc.constantFrom<"absolute" | "rate">("absolute", "rate"),
  ])("containment: stages + slats inside the box", (values, mode) => {
    const geo = funnelGeometry({ ...base, mode, values });
    for (const st of geo.stages) {
      expect(st.x).toBeGreaterThanOrEqual(0);
      expect(st.x + st.w).toBeLessThanOrEqual(60.01);
      expect(st.y).toBeGreaterThanOrEqual(-0.01);
      expect(st.y + st.h).toBeLessThanOrEqual(18.01);
    }
  });

  // Past 6 stages the chart only dev-warns, so the geometry has to survive a
  // caller who ignores it: the fixed gap used to eat the box, giving every
  // column a negative `width` and marching the row past the viewBox.
  test.prop([
    fc.array(fc.double({ min: 0, max: 1e4, noNaN: true }), { minLength: 1, maxLength: 400 }),
    fc.double({ min: 1, max: 200, noNaN: true }),
    fc.constantFrom<"none" | "percent">("none", "percent"),
  ])("containment holds past the documented stage cap", (values, width, label) => {
    const geo = funnelGeometry({ ...base, width, label, values });
    for (const st of geo.stages) {
      expect(st.w).toBeGreaterThanOrEqual(0);
      expect(st.h).toBeGreaterThanOrEqual(0);
      expect(st.x).toBeGreaterThanOrEqual(0);
      expect(st.x + st.w).toBeLessThanOrEqual(width + 0.01);
      expect(st.y + st.h).toBeLessThanOrEqual(18.01);
    }
  });
});
