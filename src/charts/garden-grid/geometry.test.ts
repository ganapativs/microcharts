import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { gardenGridGeometry } from "./geometry.js";

const g = (
  values: (number | null)[],
  extra: Partial<Parameters<typeof gardenGridGeometry>[0]> = {},
) => gardenGridGeometry({ values, rows: 7, cell: 10, gap: 2, steps: 5, pad: 1, ...extra });

describe("gardenGridGeometry (plan/24 #10) — area-quantized dots", () => {
  it("column-major grid: cols = ceil(n / rows)", () => {
    const geo = g(Array.from({ length: 15 }, (_, i) => i));
    expect(geo.cols).toBe(3); // ceil(15/7)
    expect(geo.cells[7]!.col).toBe(1);
    expect(geo.cells[7]!.row).toBe(0);
  });

  it("radius is √-quantized so AREA steps evenly", () => {
    const geo = g([0, 25, 50, 75, 100], { domain: [0, 100] });
    const rs = geo.cells.map((c) => c.r);
    // step 0 → r 0; higher steps → larger radius, top step → rMax
    expect(rs[0]).toBe(0);
    expect(rs[4]).toBeCloseTo(geo.rMax, 1);
    // area (r²) roughly linear in step
    const a = geo.cells.map((c) => c.r * c.r);
    expect(a[2]! - a[1]!).toBeCloseTo(a[4]! - a[3]!, 0);
  });

  it("zero → step 0 (ring); null → step -1 (no mark)", () => {
    const geo = g([0, null, 5]);
    expect(geo.cells[0]!.step).toBe(0);
    expect(geo.cells[1]!.step).toBe(-1);
    expect(geo.cells[2]!.step).toBeGreaterThanOrEqual(1);
  });

  it("all-equal positives → all at the top step", () => {
    const geo = g([7, 7, 7, 7]);
    expect(geo.cells.every((c) => c.step === 5)).toBe(true);
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 1, maxLength: 40 })])(
    "every dot fits inside its cell + the grid",
    (values) => {
      const geo = gardenGridGeometry({ values, rows: 7, cell: 10, gap: 2, steps: 5, pad: 1 });
      for (const c of geo.cells) {
        expect(c.r).toBeLessThanOrEqual(geo.rMax + 0.01);
        expect(c.cx - c.r).toBeGreaterThanOrEqual(-0.01);
        expect(c.cx + c.r).toBeLessThanOrEqual(geo.width + 0.01);
      }
    },
  );
});
