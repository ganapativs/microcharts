import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { balanceBeamGeometry } from "./geometry.js";

const g = (a: number, b: number, extra: Partial<Parameters<typeof balanceBeamGeometry>[0]> = {}) =>
  balanceBeamGeometry({
    a,
    b,
    width: 48,
    height: 20,
    maxTilt: 12,
    mode: "ratio",
    pad: 2,
    ...extra,
  });

describe("balanceBeamGeometry (plan/24 #8) — tilt + area-true weights", () => {
  it("heavier side tilts down; direction is instant", () => {
    const left = g(620, 480);
    expect(left.heavier).toBe(-1);
    expect(left.beam.y1).toBeGreaterThan(left.beam.y2); // left end lower
    const right = g(480, 620);
    expect(right.heavier).toBe(1);
    expect(right.beam.y2).toBeGreaterThan(right.beam.y1);
  });

  it("equal → level beam, balanced", () => {
    const r = g(500, 500);
    expect(r.heavier).toBe(0);
    expect(r.tiltDeg).toBe(0);
    expect(r.beam.y1).toBe(r.beam.y2);
  });

  it("both zero → level + balanced", () => {
    const r = g(0, 0);
    expect(r.heavier).toBe(0);
    expect(r.tiltDeg).toBe(0);
  });

  it("tilt saturates at maxTilt", () => {
    const r = g(1000, 1); // near-total imbalance
    expect(Math.abs(r.tiltDeg)).toBeCloseTo(12, 1);
  });

  it("weights are area-true (half ∝ √value)", () => {
    const r = g(400, 100); // ratio 4:1 → half ratio 2:1
    expect(r.weights[0].half / r.weights[1].half).toBeCloseTo(2, 1);
  });

  it("difference mode scales by domain", () => {
    const r = g(60, 40, { mode: "difference", domain: [0, 100] });
    // (60-40)/100 = 0.2 → tilt 0.2*12 = 2.4
    expect(r.tiltDeg).toBeCloseTo(2.4, 1);
  });

  test.prop([fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 0, max: 1000 })])(
    "beam + weights stay inside the box",
    (a, b) => {
      const r = g(a, b);
      for (const w of r.weights) {
        expect(w.cx - w.half).toBeGreaterThanOrEqual(-0.6);
        expect(w.cx + w.half).toBeLessThanOrEqual(48.6);
      }
    },
  );
});
