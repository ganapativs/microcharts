import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { miniBarGeometry } from "./geometry.js";

const base = { width: 50, height: 16, orientation: "vertical" as const };

describe("miniBarGeometry", () => {
  it("bars are zero-anchored: tallest value spans to the top, all rest to baseline", () => {
    const geo = miniBarGeometry({ ...base, values: [10, 5] });
    expect(geo.bars[0]!.y).toBe(0);
    expect(geo.bars[0]!.y + geo.bars[0]!.h).toBeCloseTo(geo.baseline, 1);
    expect(geo.bars[1]!.h).toBeCloseTo(geo.bars[0]!.h / 2, 1);
  });

  it("explicit domain is widened to include zero (anchoring is )", () => {
    const geo = miniBarGeometry({ ...base, values: [10, 20], domain: [10, 20] });
    // if the domain were [10,20], value 10 would render 0 height — it must not
    expect(geo.bars[0]!.h).toBeGreaterThan(0);
    expect(geo.bars[0]!.h).toBeCloseTo(geo.bars[1]!.h / 2, 1);
  });

  it("negative values extend below the baseline", () => {
    const geo = miniBarGeometry({ ...base, values: [5, -5] });
    const pos = geo.bars[0]!;
    const neg = geo.bars[1]!;
    expect(pos.y + pos.h).toBeCloseTo(geo.baseline, 1);
    expect(neg.y).toBeCloseTo(geo.baseline, 1);
    expect(neg.sign).toBe(-1);
  });

  it("null keeps its slot: alignment survives", () => {
    const geo = miniBarGeometry({ ...base, values: [5, null, 7] });
    expect(geo.bars.length).toBe(3);
    expect(geo.bars[1]!.empty).toBe(true);
    expect(geo.bars[2]!.x).toBeGreaterThan(geo.bars[1]!.x);
  });

  it("horizontal orientation: bars grow rightward from x=0", () => {
    const geo = miniBarGeometry({ ...base, orientation: "horizontal", values: [5, 10] });
    expect(geo.bars[0]!.x).toBe(0);
    expect(geo.bars[0]!.w).toBeCloseTo(geo.bars[1]!.w / 2, 1);
  });

  it("topPad reserves a band above the plot; bars still stand on the box bottom", () => {
    const plain = miniBarGeometry({ ...base, values: [10, 5] });
    const padded = miniBarGeometry({ ...base, values: [10, 5], topPad: 8 });
    expect(plain.y0).toBe(0);
    expect(padded.y0).toBe(8);
    expect(padded.y1).toBe(16); // the floor seat is unmoved
    expect(padded.bars[0]!.y).toBeGreaterThanOrEqual(8);
    expect(padded.bars[0]!.y + padded.bars[0]!.h).toBeCloseTo(padded.baseline, 1);
    expect(padded.bars[0]!.h).toBeCloseTo(plain.bars[0]!.h / 2, 1);
  });

  it("topPad is vertical-only: horizontal runs value along x, so it ignores the band", () => {
    const geo = miniBarGeometry({ ...base, orientation: "horizontal", values: [5, 10], topPad: 8 });
    expect(geo.y0).toBe(0);
    expect(geo.bars[0]!.x).toBe(0);
    expect(geo.bars[1]!.w).toBeCloseTo(50, 0);
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      minLength: 1,
      maxLength: 8,
    }),
    fc.constantFrom<"horizontal" | "vertical">("horizontal", "vertical"),
    // the label band the component can actually reserve: it always leaves the
    // plot at least a line of its own
    fc.double({ noNaN: true, min: 0, max: 12 }),
  ])("containment: every bar inside the box, 2-dp", (values, orientation, topPad) => {
    const geo = miniBarGeometry({ width: 50, height: 16, values, orientation, topPad });
    for (const b of geo.bars) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.y).toBeGreaterThanOrEqual(geo.y0 - 0.01);
      expect(b.x + b.w).toBeLessThanOrEqual(50.01);
      expect(b.y + b.h).toBeLessThanOrEqual(16.01);
    }
  });
});
