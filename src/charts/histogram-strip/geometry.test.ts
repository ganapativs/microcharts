import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { histogramGeometry } from "./geometry.js";

const base = { width: 60, height: 16 };

describe("histogramGeometry", () => {
  it("bins uniformly; counts zero-anchored; modal bin found", () => {
    const values = [1, 1, 1, 5, 5, 9];
    const geo = histogramGeometry({ ...base, values, bins: 3 });
    expect(geo.bars.length).toBe(3);
    expect(geo.modalBin).toBe(0);
    expect(geo.bars[0]!.h).toBeGreaterThan(geo.bars[2]!.h);
    expect(geo.bars[0]!.y + geo.bars[0]!.h).toBeCloseTo(16, 1); // zero-anchored
  });

  it("all values identical → ONE bin, not twelve slivers", () => {
    const geo = histogramGeometry({ ...base, values: [4, 4, 4, 4] });
    expect(geo.bars.filter((b) => b.count > 0).length).toBe(1);
  });

  it("n < bins → bins collapse (no empty-comb artifact)", () => {
    const geo = histogramGeometry({ ...base, values: [1, 9], bins: 12 });
    expect(geo.bars.length).toBeLessThanOrEqual(2);
  });

  it("markValue marks the bin of a VALUE; never re-bins", () => {
    const values = Array.from({ length: 40 }, (_, i) => i % 10);
    const with_ = histogramGeometry({ ...base, values, markValue: 9 });
    const without = histogramGeometry({ ...base, values });
    expect(with_.markBin).toBeGreaterThanOrEqual(0);
    expect(with_.bars.map((b) => b.x1)).toEqual(without.bars.map((b) => b.x1));
  });

  // A non-finite `domain`/`bins` used to reach uniformBins: the domain came back
  // as bin edges of NaN (nothing painted, name still read "…between NaN and
  // NaN"), the bin count collapsed the array to empty ("No data." over real
  // observations). Both now fall back to the auto path.
  it("non-finite domain/bins fall back to the auto binning", () => {
    const values = [1, 2, 2, 3, 3, 3, 4, 9];
    const auto = histogramGeometry({ ...base, values });
    for (const opts of [
      { domain: [NaN, NaN] as const },
      { domain: [0, NaN] as const },
      { domain: [-Infinity, Infinity] as const },
      { bins: NaN },
      { bins: Infinity },
    ]) {
      const geo = histogramGeometry({ ...base, values, ...opts });
      expect(geo.total).toBe(auto.total);
      expect(geo.bars.map((b) => [b.x0, b.x1])).toEqual(auto.bars.map((b) => [b.x0, b.x1]));
      for (const b of geo.bars) {
        expect(Number.isFinite(b.x0) && Number.isFinite(b.x1)).toBe(true);
      }
    }
  });

  it("a finite domain still fixes the edges", () => {
    const geo = histogramGeometry({ ...base, values: [1, 2, 3], domain: [0, 10], bins: 2 });
    expect(geo.bars.map((b) => [b.x0, b.x1])).toEqual([
      [0, 5],
      [5, 10],
    ]);
  });

  test.prop([fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { maxLength: 200 })])(
    "containment: ≤ 12 bars inside the box",
    (values) => {
      const geo = histogramGeometry({ ...base, values });
      expect(geo.bars.length).toBeLessThanOrEqual(12);
      for (const b of geo.bars) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(60.01);
        expect(b.y).toBeGreaterThanOrEqual(-0.01);
        expect(b.y + b.h).toBeLessThanOrEqual(16.01);
      }
    },
  );
});
