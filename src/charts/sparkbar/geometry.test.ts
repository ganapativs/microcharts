import { describe, it, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { sparkBarGeometry } from "./geometry.js";
import type { Value } from "../../core/types.js";

const W = 80;
const H = 20;
const geo = (data: readonly Value[], opts = {}) =>
  sparkBarGeometry(data, { width: W, height: H, ...opts });

describe("sparkBarGeometry (edge matrix, )", () => {
  it("empty → no bars", () => {
    expect(geo([]).bars).toEqual([]);
  });

  it("all-null → no bars", () => {
    expect(geo([null, null]).bars).toEqual([]);
  });

  it("nulls are skipped, indices preserved", () => {
    const g = geo([3, null, 5]);
    expect(g.bars.map((b) => b.index)).toEqual([0, 2]);
  });

  it("bars anchor at the zero baseline; positive bars sit above it", () => {
    const g = geo([2, 5, 3]);
    for (const b of g.bars) expect(b.y + b.height).toBeCloseTo(g.baselineY, 5);
  });

  it("negative values grow downward from the baseline with sign=-1", () => {
    const g = geo([-4, -2]);
    for (const b of g.bars) {
      expect(b.sign).toBe(-1);
      expect(b.y).toBeCloseTo(g.baselineY, 5);
    }
  });

  it("mixed signs straddle a shared zero baseline", () => {
    const g = geo([5, -5]);
    expect(g.bars[0]!.sign).toBe(1);
    expect(g.bars[1]!.sign).toBe(-1);
    expect(g.bars[0]!.y).toBeLessThan(g.baselineY);
    expect(g.bars[1]!.y).toBeCloseTo(g.baselineY, 5);
  });

  it("last finite bar is flagged", () => {
    const g = geo([1, 2, null]);
    expect(g.bars.at(-1)!.last).toBe(true);
    expect(g.bars.at(-1)!.index).toBe(1);
  });

  it("win-loss: equal height, sign only, straddling the mid-line", () => {
    const g = geo([3, -9, 100, -1], { mode: "winloss" });
    const heights = new Set(g.bars.map((b) => b.height));
    expect(heights.size).toBe(1); // magnitude discarded
    expect(g.bars.map((b) => b.sign)).toEqual([1, -1, 1, -1]);
    expect(g.bars[0]!.y).toBeLessThan(g.baselineY); // win above
    expect(g.bars[1]!.y).toBeCloseTo(g.baselineY, 5); // loss below
  });

  it("gap widens the empty space between bars", () => {
    const wide = geo([1, 1, 1], { gap: 0.6 }).bars[0]!.width;
    const tight = geo([1, 1, 1], { gap: 0.1 }).bars[0]!.width;
    expect(wide).toBeLessThan(tight);
  });
});

// Hostile CONFIG: props a host computes rather than types. Each case below
// emitted NaN coordinates, an invalid negative height, or a mark outside the
// frame — always under an accessible name that read the series out correctly.
describe("sparkBarGeometry (hostile config, )", () => {
  const D = [3, 5, 4, 7, 6, 9, 8, 11];

  it("a non-finite gap falls back to the default instead of NaN coords", () => {
    for (const gap of [NaN, Infinity, -Infinity]) {
      expect(geo(D, { gap }).bars).toEqual(geo(D).bars);
    }
  });

  it("an out-of-range gap clamps to the documented 0–0.9", () => {
    expect(geo(D, { gap: -5 }).bars).toEqual(geo(D, { gap: 0 }).bars);
    expect(geo(D, { gap: 5 }).bars).toEqual(geo(D, { gap: 0.9 }).bars);
    // gap: -5 used to widen bars past their slot: x = -23.37 in an 80-unit box.
    for (const b of geo(D, { gap: -5 }).bars) expect(b.x).toBeGreaterThanOrEqual(0);
  });

  it("a non-finite box resolves to the default frame `Chart` also clamps to", () => {
    for (const box of [{ width: NaN }, { height: NaN }, { width: Infinity }, { height: -50 }]) {
      const g = sparkBarGeometry(D, { width: W, height: H, ...box });
      for (const b of g.bars) expect(Number.isFinite(b.x + b.y + b.width + b.height)).toBe(true);
    }
    expect(sparkBarGeometry(D, { width: NaN, height: NaN }).bars).toEqual(geo(D).bars);
  });

  it("a non-finite domain bound falls back to the auto fit, per bound", () => {
    // A host's Math.min over a series holding a gap yields NaN; the flattened
    // midline that produced contradicted the summary's stated range.
    expect(geo(D, { domain: [NaN, NaN] }).bars).toEqual(geo(D).bars);
    expect(geo(D, { domain: [-Infinity, Infinity] }).bars).toEqual(geo(D).bars);
    expect(geo(D, { domain: [-1e308, 1e308] }).bars).toEqual(geo(D).bars);
    // the usable half survives: [NaN, 20] keeps 20 as the top
    expect(geo(D, { domain: [NaN, 20] }).bars).toEqual(geo(D, { domain: [0, 20] }).bars);
  });

  it("a value outside an explicit domain truncates at the frame, never past it", () => {
    // Pinning several sparkbars to one scale and letting a series overshoot used
    // to paint a height=38 bar in a 20-unit frame, across the surrounding text.
    for (const g of [
      geo([2, 20], { domain: [0, 10] }),
      geo([-30, 5], { domain: [0, 10] }),
      geo([3, 11], { domain: [10, 0] }),
    ]) {
      for (const b of g.bars) {
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.y + b.height).toBeLessThanOrEqual(H + 1e-6);
      }
    }
  });

  it("win-loss keeps a positive band height on a frame too short to halve", () => {
    // (y1 - y0)/2 - 0.5 goes negative under ~4 units: the wins and losses came
    // out as height="-0.5" and the renderer dropped them.
    for (const height of [1, 2, 3, 4, 20]) {
      const g = sparkBarGeometry([1, -1, 0], { width: W, height, mode: "winloss" });
      for (const b of g.bars) {
        expect(b.height).toBeGreaterThan(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.y + b.height).toBeLessThanOrEqual(Math.max(1, height) + 1e-6);
      }
    }
  });
});

const finite = fc
  .double({ noNaN: true, noDefaultInfinity: true, min: -1e4, max: 1e4 })
  .filter((v) => v === 0 || Math.abs(v) >= 1e-3);
const value = fc.oneof(finite, fc.constant(null as Value));

/** Any number a host could hand a scalar config prop, hostile ones included. */
const anyNumber = fc.oneof(
  fc.double({ min: -1e4, max: 1e4 }),
  fc.constantFrom(NaN, Infinity, -Infinity, 0),
);

describe("sparkBarGeometry (invariants)", () => {
  test.prop([fc.array(value, { minLength: 1 }), anyNumber, anyNumber, anyNumber])(
    "no config value paints outside the box or emits NaN",
    (data, gap, lo, hi) => {
      for (const mode of ["bar", "winloss"] as const) {
        const g = sparkBarGeometry(data, { width: W, height: H, mode, gap, domain: [lo, hi] });
        for (const b of g.bars) {
          expect(Number.isFinite(b.x + b.y + b.width + b.height)).toBe(true);
          expect(b.width).toBeGreaterThan(0);
          expect(b.height).toBeGreaterThan(0);
          expect(b.x).toBeGreaterThanOrEqual(-1e-6);
          expect(b.y).toBeGreaterThanOrEqual(-1e-6);
          expect(b.x + b.width).toBeLessThanOrEqual(W + 1e-6);
          expect(b.y + b.height).toBeLessThanOrEqual(H + 1e-6);
        }
      }
    },
  );

  test.prop([fc.array(value, { minLength: 1 })])("bars stay within the box, no NaN", (data) => {
    const g = geo(data);
    for (const b of g.bars) {
      expect(Number.isNaN(b.x + b.y + b.width + b.height)).toBe(false);
      expect(b.x).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(b.x + b.width).toBeLessThanOrEqual(79 + 1e-6);
      expect(b.y).toBeGreaterThanOrEqual(1 - 1e-6);
      expect(b.y + b.height).toBeLessThanOrEqual(H + 1e-6);
      expect(b.width).toBeGreaterThan(0);
      expect(b.height).toBeGreaterThan(0);
    }
  });
});
