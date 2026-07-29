import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { iconArrayGeometry, iconArrayLabelPlan, resolveK, resolveTotal } from "./geometry.js";

const base = { width: 60, height: 24, shape: "square" as const };

describe("resolveK (half-up, clamped)", () => {
  it("rounds to the nearest whole unit, half-up", () => {
    expect(resolveK(0.15, 20)).toBe(3);
    expect(resolveK(0.125, 20)).toBe(3); // 2.5 → 3
    expect(resolveK(0.5, 10)).toBe(5);
  });
  it("clamps out-of-range + guards non-finite", () => {
    expect(resolveK(-0.2, 20)).toBe(0);
    expect(resolveK(2, 20)).toBe(20);
    expect(resolveK(Number.NaN, 20)).toBe(0);
  });
});

describe("resolveTotal", () => {
  it("keeps the designed denominators", () => {
    expect(resolveTotal(10)).toBe(10);
    expect(resolveTotal(20)).toBe(20);
    expect(resolveTotal(100)).toBe(100);
  });

  // Regression: GRID_DIMS was destructured unguarded, so any other number threw
  // "undefined is not iterable" and took the whole render down.
  it("snaps anything else to 20 instead of throwing", () => {
    for (const bad of [0, 7, 25, -5, 1e6, Number.NaN, Number.POSITIVE_INFINITY, undefined])
      expect(resolveTotal(bad)).toBe(20);
  });

  it("geometry paints the resolved denominator, so the count matches the grid", () => {
    const geo = iconArrayGeometry({ ...base, value: 0.15, total: 7 as never });
    expect(geo.n).toBe(20);
    expect(geo.units.length).toBe(20);
    expect(geo.k).toBe(3);
  });
});

describe("iconArrayLabelPlan", () => {
  // Regression: a flat 9-char reserve fit "3 in 20" but not "100 in 100", which
  // painted up to 6.7 units past the right edge of an overflow-visible root.
  it("reserves for the widest ratio the denominator can produce", () => {
    const box = { label: "ratio", width: 400, height: 40 } as const;
    expect(iconArrayLabelPlan({ ...box, total: 10 }).gutterCh).toBe(9);
    // unchanged: the calibrated reserve for "20 in 20"
    expect(iconArrayLabelPlan({ ...box, total: 20 }).gutterCh).toBe(9);
    // "100 in 100" is ten characters
    expect(iconArrayLabelPlan({ ...box, total: 100 }).gutterCh).toBe(11);
  });

  it("percent keeps its own reserve; 'none' asks for no gutter", () => {
    expect(
      iconArrayLabelPlan({ label: "percent", total: 100, width: 400, height: 40 }).gutterCh,
    ).toBe(5);
    const off = iconArrayLabelPlan({ label: "none", total: 20, width: 400, height: 40 });
    expect(off.show).toBe(false);
    expect(off.gutterCh).toBe(0);
  });

  it("drops the label (and its gutter) when it would swallow the grid", () => {
    const plan = iconArrayLabelPlan({ label: "ratio", total: 20, width: 36, height: 12 });
    expect(plan.show).toBe(false);
    expect(plan.gutterCh).toBe(0);
  });
});

describe("iconArrayGeometry", () => {
  it("N units, filled contiguous from the top-left in reading order", () => {
    const geo = iconArrayGeometry({ ...base, value: 0.15, total: 20 });
    expect(geo.units.length).toBe(20);
    expect(geo.k).toBe(3);
    expect(geo.units.slice(0, 3).every((u) => u.filled)).toBe(true);
    expect(geo.units.slice(3).every((u) => !u.filled)).toBe(true);
  });

  it("grid dims per denominator", () => {
    expect(iconArrayGeometry({ ...base, value: 0.5, total: 10 }).cols).toBe(5);
    expect(iconArrayGeometry({ ...base, value: 0.5, total: 20 }).cols).toBe(10);
    expect(
      iconArrayGeometry({ width: 60, height: 60, value: 0.5, total: 100, shape: "square" }).cols,
    ).toBe(10);
  });

  it("degenerate notes: none / all / sub-unit (never a partial fill)", () => {
    expect(iconArrayGeometry({ ...base, value: 0, total: 20 }).note).toBe("none");
    expect(iconArrayGeometry({ ...base, value: 1, total: 20 }).note).toBe("all");
    // a real but tiny rate rounds to 0 units — flagged, never a fractional unit
    expect(iconArrayGeometry({ ...base, value: 0.01, total: 20 }).note).toBe("sub");
    expect(iconArrayGeometry({ ...base, value: 0.01, total: 20 }).k).toBe(0);
  });

  test.prop([
    fc.double({ noNaN: true, min: -2, max: 2 }),
    fc.constantFrom<10 | 20 | 100>(10, 20, 100),
    fc.constantFrom<"square" | "round" | "dot">("square", "round", "dot"),
  ])("containment: every unit inside the box; k in [0, n]", (value, total, shape) => {
    const h = total === 100 ? 60 : 24;
    const geo = iconArrayGeometry({
      width: 60,
      height: h,
      value,
      total,
      shape,
      gutterCh: 9,
      fontSize: 6,
    });
    for (const u of geo.units) {
      expect(u.x).toBeGreaterThanOrEqual(-0.01);
      expect(u.x + geo.cell).toBeLessThanOrEqual(60.01);
      expect(u.y).toBeGreaterThanOrEqual(-0.01);
      expect(u.y + geo.cell).toBeLessThanOrEqual(h + 0.01);
    }
    expect(geo.k).toBeGreaterThanOrEqual(0);
    expect(geo.k).toBeLessThanOrEqual(total);
  });
});
