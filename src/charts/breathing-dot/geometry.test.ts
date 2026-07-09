import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { breathingDotGeometry } from "./geometry.js";

const g = (value: number | null, thresholds: readonly [number, number] = [0.5, 0.8]) =>
  breathingDotGeometry({ value, size: 16, thresholds, pad: 1 });

describe("breathingDotGeometry (plan/24 #19) — ambient load", () => {
  it("bands split at the thresholds: < lower calm, [lower,upper) elevated, ≥ upper strained", () => {
    expect(g(0.3).band).toBe(0);
    expect(g(0.5).band).toBe(1); // at the lower edge → elevated
    expect(g(0.65).band).toBe(1);
    expect(g(0.8).band).toBe(2); // at the upper edge → strained
    expect(g(0.95).band).toBe(2);
  });

  it("ring radius grows with the level (the static level read)", () => {
    expect(g(0.2).ring.r).toBeLessThan(g(0.9).ring.r);
    expect(g(0).ring.r).toBeCloseTo(g(0).core.r, 1); // zero → ring at the core
  });

  it("null / NaN → unknown (no ring)", () => {
    expect(g(null).unknown).toBe(true);
    expect(g(NaN).unknown).toBe(true);
    expect(Number.isNaN(g(null).level)).toBe(true);
  });

  it("value is clamped to [0,1]", () => {
    expect(g(2).level).toBe(1);
    expect(g(-1).level).toBe(0);
  });

  test.prop([fc.double({ min: 0, max: 1, noNaN: true })])("ring stays inside the box", (v) => {
    const geo = g(v);
    expect(geo.ring.r).toBeLessThanOrEqual(geo.size / 2);
    expect(geo.ring.r).toBeGreaterThanOrEqual(geo.core.r - 0.01);
  });
});
