import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { gardenGridGeometry } from "./geometry.js";

const g = (
  values: (number | null)[],
  extra: Partial<Parameters<typeof gardenGridGeometry>[0]> = {},
) => gardenGridGeometry({ values, rows: 7, cell: 10, gap: 2, steps: 5, pad: 1, ...extra });

describe("gardenGridGeometry — area-quantized dots", () => {
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

  it("zero-ring radius is rounded at generation", () => {
    // cell=9 → rMax*0.6 = 2.6999999999999997 in float; the emitted attribute
    // must be 2 dp like every other coordinate.
    expect(g([0], { cell: 9 }).rEmpty).toBe(2.7);
  });

  describe("hostile config is repaired once, here", () => {
    // `Number(input.value)` on an empty field, `boxPx / 0`, or a negative typed
    // into a knob: each used to reach the DOM as NaN / Infinity / negative
    // coords under an aria-label that still announced the peak.
    it.each([
      ["rows", (v: number) => ({ rows: v })],
      ["cell", (v: number) => ({ cell: v })],
      ["gap", (v: number) => ({ gap: v })],
      ["steps", (v: number) => ({ steps: v })],
    ] as const)("%s falls back when non-finite or below its floor", (_name, at) => {
      const base = g([1, 2, 3]);
      for (const bad of [NaN, Infinity, -Infinity, -5]) {
        const geo = g([1, 2, 3], at(bad));
        expect(geo.rows).toBe(base.rows);
        expect(geo.cell).toBe(base.cell);
        expect(geo.gap).toBe(base.gap);
        expect(geo.steps).toBe(base.steps);
        expect(Number.isFinite(geo.width)).toBe(true);
        expect(Number.isFinite(geo.height)).toBe(true);
        for (const c of geo.cells) {
          expect(Number.isFinite(c.cx)).toBe(true);
          expect(Number.isFinite(c.cy)).toBe(true);
          expect(c.r).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("rows and steps are whole (a fractional one bucketed off the ramp)", () => {
      expect(g([1, 2, 3], { rows: 2.5 }).rows).toBe(2);
      expect(g([1, 2, 3], { steps: 2.4 }).steps).toBe(2);
      expect(g([1, 2, 3], { steps: 1 }).steps).toBe(2); // clamped floor, reported as clamped
    });

    it("a non-finite domain bound falls back to the data extent", () => {
      // [NaN, NaN] made stepOf return NaN, so every dot painted r=0 — an empty
      // plot under a summary still claiming a peak.
      const auto = g([1, 2, 3]);
      const bounds: ReadonlyArray<readonly [number, number]> = [
        [NaN, NaN],
        [0, NaN],
        [-Infinity, Infinity],
      ];
      for (const bad of bounds) {
        const geo = g([1, 2, 3], { domain: bad });
        expect(geo.cells.map((c) => c.step)).toEqual(auto.cells.map((c) => c.step));
      }
    });
  });
});
