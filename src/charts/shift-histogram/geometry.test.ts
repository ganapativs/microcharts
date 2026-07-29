import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { shiftHistogramGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// a clean rightward→leftward shift (latency fix): after is centered lower
const BEFORE = Array.from({ length: 100 }, (_, i) => 120 + (i % 40) - 20);
const AFTER = Array.from({ length: 100 }, (_, i) => 96 + (i % 40) - 20);

describe("shiftHistogramGeometry", () => {
  it("shared bin edges for both sides; mirrored up/down heights", () => {
    const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER })!;
    expect(geo.bins.length).toBeGreaterThan(0);
    // some bins have before mass (up), some after mass (down)
    expect(geo.bins.some((b) => b.up > 0)).toBe(true);
    expect(geo.bins.some((b) => b.down > 0)).toBe(true);
  });

  it("median shift = after − before, and the direction is a fall here", () => {
    const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER })!;
    expect(geo.shift).toBe(round(geo.medians.after!.value - geo.medians.before!.value));
    expect(geo.shift).toBeLessThan(0);
  });

  it("per-side proportions: unequal n cannot fake a shift", () => {
    // after has 10× the samples but the SAME distribution → no fake shift
    const many = Array.from({ length: 1000 }, (_, i) => BEFORE[i % BEFORE.length]!);
    const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: many })!;
    // identical distributions → up and down heights match bin-for-bin
    for (const b of geo.bins) expect(Math.abs(b.up - b.down)).toBeLessThan(0.3);
    expect(geo.shift).toBe(0);
  });

  it("bins carry the shared edges + both shares for the interactive read", () => {
    const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER })!;
    for (const b of geo.bins) {
      expect(b.x1).toBeGreaterThanOrEqual(b.x0);
      expect(b.beforeShare).toBeGreaterThanOrEqual(0);
      expect(b.afterShare).toBeGreaterThanOrEqual(0);
    }
  });

  it("bins prop is honored as given (shared edges stay exact)", () => {
    const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER, bins: 6 })!;
    expect(geo.bins).toHaveLength(6);
  });

  it("one side empty → single histogram, shift null", () => {
    const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: [] })!;
    expect(geo.medians.after).toBeNull();
    expect(geo.shift).toBeNull();
    expect(geo.nAfter).toBe(0);
  });

  it("both empty → null", () => {
    expect(shiftHistogramGeometry({ ...base, before: [], after: [] })).toBeNull();
  });

  it("a non-finite `bins` falls back to auto; a huge one is capped at n", () => {
    // NaN collapsed the bin array to empty (blank plot, summary still reading
    // the shift) and Infinity threw RangeError out of Array.from.
    const auto = shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER })!;
    for (const bins of [NaN, Infinity, -Infinity]) {
      const geo = shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER, bins })!;
      expect(geo.bins).toHaveLength(auto.bins.length);
    }
    // more bins than observations is only slivers
    const capped = shiftHistogramGeometry({ ...base, before: [1, 2], after: [3], bins: 5000 })!;
    expect(capped.bins.length).toBeLessThanOrEqual(3);
  });

  it("a reversed `domain` is normalized, so bars and median rules agree", () => {
    const both = { ...base, before: BEFORE, after: AFTER };
    const asc = shiftHistogramGeometry({ ...both, domain: [0, 200] })!;
    const desc = shiftHistogramGeometry({ ...both, domain: [200, 0] })!;
    // the fall has to read the same way on both marks: after median LEFT of before
    expect(desc.medians.after!.x).toBeLessThan(desc.medians.before!.x);
    expect(desc.medians.after!.x).toBe(asc.medians.after!.x);
    expect(desc.bins.map((b) => b.up)).toEqual(asc.bins.map((b) => b.up));
  });

  it("medians describe the values the bins actually count", () => {
    // A window past the data painted nothing, yet still announced a median for
    // each side with both rules clamped onto the left edge.
    expect(
      shiftHistogramGeometry({ ...base, before: BEFORE, after: AFTER, domain: [900, 1000] }),
    ).toBeNull();
    // a window over part of the data reports that part's n, not the raw sample's
    const geo = shiftHistogramGeometry({
      ...base,
      before: [1, 2, 3, 400],
      after: [1, 2, 500],
      domain: [0, 10],
    })!;
    expect([geo.nBefore, geo.nAfter]).toEqual([3, 2]);
    expect(geo.medians.before!.value).toBe(2);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 200 }), { minLength: 1, maxLength: 80 }),
    fc.array(fc.double({ noNaN: true, min: 0, max: 200 }), { minLength: 1, maxLength: 80 }),
  ])("containment: bars within their half of the plot", (before, after) => {
    const geo = shiftHistogramGeometry({ ...base, before, after, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    const half = base.height / 2 - 2;
    for (const b of geo.bins) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(80.01);
      expect(b.up).toBeLessThanOrEqual(half + 0.02);
      expect(b.down).toBeLessThanOrEqual(half + 0.02);
    }
    // the gutter label starts at labelX and runs 4 chars at the digits-only
    // 0.62 over-estimate — it has to end inside totalWidth, not past the box
    expect(geo.labelX + 4 * 8 * 0.62).toBeLessThanOrEqual(geo.totalWidth);
  });
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
