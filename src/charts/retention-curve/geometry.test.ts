import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { retentionGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
// a decaying cohort that flattens at the end
const SAMPLE = [1, 0.71, 0.52, 0.43, 0.37, 0.344, 0.341, 0.34];

describe("retentionGeometry (plan/23 #7)", () => {
  it("locks the y-domain to [0,1]: 1.0 at top, 0 at bottom", () => {
    const geo = retentionGeometry({ ...base, data: [1, 0.5, 0] })!;
    // period 0 = 1.0 near the top (small y), last = 0 near the bottom (large y)
    expect(geo.line.d).toMatch(/^M/);
    expect(geo.last.value).toBe(0);
    expect(geo.last.y).toBeCloseTo(base.height - 2, 1); // 0 → bottom (pad)
  });

  it("detects a plateau by the documented criterion (mean |Δ| < 0.005)", () => {
    const geo = retentionGeometry({ ...base, data: SAMPLE })!;
    expect(geo.plateau).not.toBeNull();
    expect(geo.plateau!.from).toBe(5); // last k=3 of 8 → window starts at index 5
    expect(geo.plateau!.value).toBeCloseTo(0.342, 2);
  });

  it("no plateau when the tail is still moving", () => {
    const geo = retentionGeometry({ ...base, data: [1, 0.8, 0.6, 0.45, 0.32, 0.22] })!;
    expect(geo.plateau).toBeNull();
  });

  it("plateau={false} suppresses the marker", () => {
    const geo = retentionGeometry({ ...base, data: SAMPLE, plateau: false })!;
    expect(geo.plateau).toBeNull();
  });

  it("percent input (max > 1.001) is divided by 100", () => {
    const geo = retentionGeometry({ ...base, data: [100, 68, 55, 40] })!;
    expect(geo.last.value).toBe(0.4); // 40 → 0.40
  });

  it("benchmark renders its own ghost path on the shared x scale", () => {
    const geo = retentionGeometry({ ...base, data: SAMPLE, benchmark: [1, 0.6, 0.44, 0.36] })!;
    expect(geo.ghost).not.toBeNull();
    expect(geo.ghost!.d).toMatch(/^M/);
  });

  it("non-monotone bump (resurrection) is kept, never sorted", () => {
    const geo = retentionGeometry({ ...base, data: [1, 0.5, 0.4, 0.55, 0.5] })!;
    // last value is the actual last input, not a sorted min
    expect(geo.last.value).toBe(0.5);
  });

  it("empty / all-null → null", () => {
    expect(retentionGeometry({ ...base, data: [] })).toBeNull();
    expect(retentionGeometry({ ...base, data: [Number.NaN, Number.NaN] })).toBeNull();
  });

  it("smooth curve uses bézier, step uses H/V", () => {
    const step = retentionGeometry({ ...base, data: SAMPLE, curve: "step" })!;
    const smooth = retentionGeometry({ ...base, data: SAMPLE, curve: "smooth" })!;
    expect(step.line.d).toMatch(/[HV]/);
    expect(smooth.line.d).toMatch(/C/);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: 0, max: 1 }), { minLength: 1, maxLength: 40 }),
  ])("containment: line points inside the plot", (data) => {
    const geo = retentionGeometry({ ...base, data, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    const ys = [...geo.line.d.matchAll(/[MLHV]?\s?(-?\d+(?:\.\d+)?)\s(-?\d+(?:\.\d+)?)/g)].map(
      (m) => Number(m[2]),
    );
    for (const yv of ys) {
      expect(yv).toBeGreaterThanOrEqual(1.99);
      expect(yv).toBeLessThanOrEqual(18.01);
    }
    expect(geo.last.x).toBeGreaterThanOrEqual(1.99);
    expect(geo.last.x).toBeLessThanOrEqual(78.01);
  });
});
