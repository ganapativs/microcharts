import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { stackedAreaGeometry, stackedAreaLabelsFit } from "./geometry.js";

const base = { width: 60, height: 16, curve: "linear" as const, gutterCh: 0, fontSize: 6 };

describe("stackedAreaGeometry", () => {
  it("layers stack bottom-up, zero-anchored", () => {
    const geo = stackedAreaGeometry({
      ...base,
      series: [
        [10, 10],
        [20, 20],
      ],
    });
    expect(geo.layers.length).toBe(2);
    // last-column shares
    expect(geo.sharesAt.at(-1)).toEqual([0.33, 0.67]);
  });

  it("ridge vs stacked: identical stack offsets (smooth changes rendering only)", () => {
    const series = [
      [3, 5, 4],
      [2, 3, 6],
    ];
    const linear = stackedAreaGeometry({ ...base, series });
    const smooth = stackedAreaGeometry({ ...base, curve: "smooth", series });
    // same endpoint shares — the offsets (data semantics) are identical
    expect(smooth.layers.map((l) => l.lastShare)).toEqual(linear.layers.map((l) => l.lastShare));
    expect(smooth.sharesAt).toEqual(linear.sharesAt);
  });

  it("a zero series keeps its layer at 0% share", () => {
    const geo = stackedAreaGeometry({
      ...base,
      series: [
        [5, 5],
        [0, 0],
      ],
    });
    expect(geo.layers[1]!.lastShare).toBe(0);
  });

  it("the label gutter shrinks the plot, so its fit test gates both", () => {
    expect(stackedAreaLabelsFit(60, 3, 11)).toBe(true);
    expect(stackedAreaLabelsFit(8, 3, 7)).toBe(false);
    const withGutter = stackedAreaGeometry({ ...base, width: 30, height: 8, series: [[1, 2]] });
    const gutted = stackedAreaGeometry({
      ...base,
      width: 30,
      height: 8,
      gutterCh: 4,
      series: [[1, 2]],
    });
    expect(withGutter.plot.x1).toBe(29);
    expect(gutted.plot.x1).toBe(11); // 18 of 30 units reserved at fontSize 6
  });

  test.prop([
    fc.array(
      fc.array(fc.option(fc.double({ min: 0, max: 1e3, noNaN: true }), { nil: null }), {
        maxLength: 20,
      }),
      { minLength: 1, maxLength: 3 },
    ),
  ])("containment: all path coords inside the plot", (series) => {
    const geo = stackedAreaGeometry({ ...base, series });
    for (const layer of geo.layers) {
      for (const m of layer.dArea.matchAll(/-?\d+(?:\.\d+)?/g)) {
        const v = Number(m[0]);
        expect(v).toBeGreaterThanOrEqual(-0.01);
        expect(v).toBeLessThanOrEqual(60.01);
      }
    }
  });
});
