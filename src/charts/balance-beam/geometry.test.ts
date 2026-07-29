import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { balanceBeamGeometry, DEFAULT_MAX_TILT } from "./geometry.js";

const g = (a: number, b: number, extra: Partial<Parameters<typeof balanceBeamGeometry>[0]> = {}) =>
  balanceBeamGeometry({
    a,
    b,
    width: 48,
    height: 20,
    maxTilt: DEFAULT_MAX_TILT,
    mode: "ratio",
    pad: 2,
    ...extra,
  });

describe("balanceBeamGeometry — tilt + area-true weights", () => {
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

  // A weight sits ABOVE its beam end, so the vertical bound is the one a tilt
  // can break — `difference` mode with a small domain saturates the tilt while
  // both pans stay nearly equal, which used to lift a full-size square off the
  // top edge (`y="-3.18"` at the default 48×20).
  test.prop([
    fc.integer({ min: 0, max: 1000 }),
    fc.integer({ min: 0, max: 1000 }),
    fc.integer({ min: 32, max: 240 }),
    fc.integer({ min: 12, max: 80 }),
    fc.integer({ min: 0, max: 40 }),
    fc.option(fc.tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: -50, max: 50 })), {
      nil: undefined,
    }),
  ])("nothing paints outside the viewBox, any mode/box/tilt", (a, b, width, height, tilt, dom) => {
    const r = balanceBeamGeometry({
      a,
      b,
      width,
      height,
      maxTilt: tilt,
      mode: dom ? "difference" : "ratio",
      domain: dom ? ([dom[0], dom[1]] as const) : undefined,
      pad: 2,
    });
    for (const y of [r.beam.y1, r.beam.y2]) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(height);
    }
    for (const w of r.weights) {
      expect(w.cy - w.half).toBeGreaterThanOrEqual(-0.02);
      expect(w.cy + w.half).toBeLessThanOrEqual(height);
      expect(w.cx - w.half).toBeGreaterThanOrEqual(-0.05);
      expect(w.cx + w.half).toBeLessThanOrEqual(width + 0.05);
    }
  });
});

// Hostile CONFIG, not hostile data: `maxTilt` is the one scalar a host computes
// (a slider, `Number(input.value)`), and every value below reached a painted
// coordinate before these guards — as NaN, or as a tilt pointing at the LIGHTER
// pan while the summary named the heavier one.
describe("balanceBeamGeometry — hostile maxTilt", () => {
  const DEFAULTED = g(620, 480).tiltDeg;

  it("a non-finite maxTilt falls back to the default, never NaN", () => {
    for (const bad of [Number.NaN, Infinity, -Infinity])
      expect(g(620, 480, { maxTilt: bad }).tiltDeg).toBe(DEFAULTED);
  });

  it("never tilts against the side the summary calls heavier", () => {
    // negative → no tilt at all; huge → capped, not wrapped past 90° (which
    // flipped the sign of sin and pointed the beam the wrong way).
    for (const tilt of [-12, -1e6, 1e6, 4000]) {
      const r = g(620, 480, { maxTilt: tilt });
      expect(r.heavier).toBe(-1);
      expect(r.tiltDeg).toBeGreaterThanOrEqual(0); // left end down, or level
      expect(r.beam.y1).toBeGreaterThanOrEqual(r.beam.y2);
    }
  });

  it("an end never swings past the fulcrum's stance on a wide, short beam", () => {
    const r = balanceBeamGeometry({
      a: 1000,
      b: 1,
      width: 200,
      height: 20,
      maxTilt: 12,
      mode: "ratio",
      pad: 2,
    });
    expect(r.beam.y1).toBeLessThanOrEqual(20);
    expect(r.beam.y2).toBeGreaterThanOrEqual(0);
  });
});
