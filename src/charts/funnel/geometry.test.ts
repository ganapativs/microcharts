import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { funnelGeometry } from "./geometry.js";

const base = { width: 60, height: 18, mode: "absolute" as const, connectors: true, fontSize: 0 };

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
});
