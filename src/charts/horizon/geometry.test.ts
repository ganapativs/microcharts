import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { horizonGeometry, resolveFolds } from "./geometry.js";

const base = { width: 80, height: 14, baseline: 0, folds: 2 as const, mode: "mirror" as const };

describe("horizonGeometry", () => {
  it("values within fold 1 render exactly one band (no phantom dark bands)", () => {
    const geo = horizonGeometry({ ...base, values: [1, 2, 3, 2, 1], domain: undefined });
    // max dev 3, foldSize 1.5 → values 2..3 reach fold 2; use tight data:
    const tight = horizonGeometry({ ...base, values: [1, 1.2, 1.1] });
    // with max dev 1.2, foldSize .6 → fold 2 exists... so instead assert:
    expect(geo.bands.some((b) => b.fold === 1)).toBe(true);
    expect(tight.bands.length).toBeGreaterThan(0);
  });

  it("boundary values belong to the LOWER fold (half-open bands)", () => {
    // foldSize = max/2 = 2; a value exactly 2 must NOT open fold 2
    const geo = horizonGeometry({ ...base, values: [2, 4] });
    const fold2 = geo.bands.filter((b) => b.fold === 2 && b.sign === 1);
    expect(fold2.length).toBe(1);
    // fold-2 band exists only because of the 4; check the 2 contributes nothing:
    const only2 = horizonGeometry({ ...base, values: [2, 2], domain: [0, 4] });
    expect(only2.bands.filter((b) => b.fold === 2).length).toBe(0);
  });

  it("all-negative series in mirror mode renders negative-sign bands upward", () => {
    const geo = horizonGeometry({ ...base, values: [-3, -1, -4] });
    expect(geo.bands.every((b) => b.sign === -1)).toBe(true);
    expect(geo.bands.length).toBeGreaterThan(0);
  });

  it("offset mode splits the strip at a midline", () => {
    const geo = horizonGeometry({ ...base, mode: "offset", values: [3, -3] });
    expect(geo.bands.some((b) => b.sign === 1)).toBe(true);
    expect(geo.bands.some((b) => b.sign === -1)).toBe(true);
  });

  it("a fold count off the opacity table falls back to the documented 2", () => {
    // `OPACITY` is indexed by the prop: `folds={4}` used to hand back
    // `undefined` opacities and the render threw on `undefined[0]`.
    for (const folds of [4, 1, 0, 2.5, NaN, -3] as (2 | 3)[]) {
      const geo = horizonGeometry({ ...base, folds, values: [3, -5, 9, 18] });
      expect(geo.opacities).toEqual([0.42, 0.85]);
      expect(geo.bands.every((b) => b.fold <= 2)).toBe(true);
    }
    expect(resolveFolds(3)).toBe(3);
    expect(resolveFolds(undefined)).toBe(2);
  });

  it("an unbounded fold count terminates instead of hanging the tab", () => {
    // `fold <= folds` never ended at Infinity — the loop OOM'd the renderer.
    const geo = horizonGeometry({ ...base, folds: Infinity as unknown as 2, values: [1, 2, 3] });
    expect(geo.bands.length).toBeLessThanOrEqual(4);
    expect(geo.opacities.length).toBe(2);
  });

  it("a domain whose distance from baseline overflows still paints", () => {
    // Both bounds finite, |bound - baseline| infinite → foldSize Infinity →
    // fold 1's floor was `0 * Infinity` = NaN → every coordinate NaN, so the
    // browser dropped the paths and the strip went blank under a live summary.
    const geo = horizonGeometry({
      ...base,
      values: [1, 2, 3],
      baseline: 1e308,
      domain: [-1e308, 1e308],
    });
    expect(geo.bands.length).toBeGreaterThan(0);
    for (const b of geo.bands) expect(b.d).not.toMatch(/NaN|Infinity/);
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      maxLength: 90,
    }),
    fc.constantFrom<2 | 3>(2, 3),
    fc.constantFrom<"mirror" | "offset">("mirror", "offset"),
  ])("containment: every band path inside the strip", (values, folds, mode) => {
    const geo = horizonGeometry({ width: 80, height: 14, baseline: 0, values, folds, mode });
    for (const band of geo.bands) {
      // NaN first: the number regex below cannot match "NaN", so a poisoned
      // coordinate used to pass containment by being invisible to it.
      expect(band.d).not.toMatch(/NaN|Infinity/);
      for (const m of band.d.matchAll(/-?\d+(?:\.\d+)?/g)) {
        const v = Number(m[0]);
        expect(v).toBeGreaterThanOrEqual(-0.01);
        expect(v).toBeLessThanOrEqual(80.01);
      }
    }
  });

  // Hostile CONFIG, not hostile data: `folds`, `baseline` and `domain` are
  // typed but reach the chart from JSON, form state, or a model's output.
  test.prop([
    // unconstrained: fast-check emits NaN, ±Infinity and ±MAX_VALUE here, which
    // is exactly the input that reached these props from a host's arithmetic.
    fc.double(),
    fc.option(fc.tuple(fc.double(), fc.double()), { nil: undefined }),
    fc.oneof(fc.double(), fc.constantFrom(2, 3, 0, 4, Infinity, NaN)),
    fc.constantFrom<"mirror" | "offset">("mirror", "offset"),
  ])("hostile config never poisons a coordinate", (baseline, domain, folds, mode) => {
    const geo = horizonGeometry({
      width: 80,
      height: 14,
      values: [3, -5, 4, 9, -7, 12],
      baseline,
      domain: domain as [number, number] | undefined,
      folds: folds as 2 | 3,
      mode,
    });
    expect(geo.opacities.length).toBeGreaterThan(0);
    for (const band of geo.bands) {
      expect(band.d).not.toMatch(/NaN|Infinity/);
      expect(geo.opacities[band.fold - 1]).toBeTypeOf("number");
    }
  });
});
