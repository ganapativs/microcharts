import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { biasLayout, biasStripGeometry } from "./geometry.js";

const base = { width: 56, height: 30, limits: 1.96, rad: 1.8 };

// a clean paired set with a known +2 offset (b runs 2 below a)
const OFFSET = Array.from({ length: 12 }, (_, i) => ({ a: i + 2, b: i }));

// a noisy +2 offset — σ > 0, so the band has real height and a mis-resolved k
// changes the geometry instead of hiding behind a collapsed hairline
const NOISY = [2.1, 1.6, 2.8, 1.9, 2.4, 3.2, 1.4, 2.6].map((d, i) => ({ a: i + d, b: i }));

describe("biasStripGeometry", () => {
  it("bias is the mean difference; band + limits appear at n ≥ 5", () => {
    const geo = biasStripGeometry({ ...base, data: OFFSET });
    expect(geo.bias).toBe(2);
    expect(geo.band).not.toBeNull();
    expect(geo.biasY).not.toBeNull();
    expect(geo.withinPct).not.toBeNull();
    expect(geo.n).toBe(12);
  });

  it("fewer than 5 pairs → dots only, no band or limits (micro-box precedent)", () => {
    const geo = biasStripGeometry({ ...base, data: OFFSET.slice(0, 4) });
    expect(geo.band).toBeNull();
    expect(geo.biasY).toBeNull();
    expect(geo.withinPct).toBeNull();
    expect(geo.bias).toBe(2); // the mean difference is still reported
  });

  it("perfect agreement → bias 0, limits collapse to a hair-thin band", () => {
    const geo = biasStripGeometry({
      ...base,
      data: Array.from({ length: 6 }, (_, i) => ({ a: i, b: i })),
    });
    expect(geo.bias).toBe(0);
    expect(geo.band).not.toBeNull();
    expect(geo.band!.height).toBe(0.75); // collapsed band ⇒ sd 0
    expect(geo.withinPct).toBe(100);
  });

  it("within-limits share counts the finite pairs inside the band", () => {
    // 9 tight pairs (diff 0) + 1 gross outlier → far outside the ±1.96σ band
    const data = [...Array.from({ length: 9 }, () => ({ a: 10, b: 10 })), { a: 100, b: 0 }];
    const geo = biasStripGeometry({ ...base, data });
    expect(geo.dots.find((d) => d.outside)).toBeTruthy();
    expect(geo.withinPct).toBe(90);
  });

  it("non-finite pairs are dropped and counted", () => {
    const geo = biasStripGeometry({
      ...base,
      data: [
        { a: 1, b: 2 },
        { a: Number.NaN, b: 3 },
        { a: 4, b: Number.POSITIVE_INFINITY },
      ],
    });
    expect(geo.dots.length).toBe(1);
    expect(geo.n).toBe(1); // 2 non-finite pairs dropped from 3 inputs
  });

  it("> 40 pairs → dots downsampled for display, stats over every pair", () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ a: i + 2, b: i }));
    const geo = biasStripGeometry({ ...base, data });
    expect(geo.dots.length).toBe(40);
    expect(geo.n).toBe(100); // bias/limits still use all 100
    expect(geo.bias).toBe(2);
  });

  // Hosts compute k — from an input field (`Number("")` → NaN), from a
  // division. Each of these used to paint a normal-looking chart whose y-domain
  // had silently collapsed: every dot stacked on the zero line while the summary
  // announced a within-limits share for limits that were never drawn.
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1.96])(
    "a limits of %p falls back to the 1.96 default, geometry and share together",
    (limits) => {
      expect(biasStripGeometry({ ...base, data: NOISY, limits })).toEqual(
        biasStripGeometry({ ...base, data: NOISY, limits: 1.96 }),
      );
    },
  );

  it("a k that overflows the symmetric domain drops the band, keeping the cloud", () => {
    // both limits stay finite here — it is the ±m span that overflows, which is
    // why the guard tests `upper - lower` and not each end
    const geo = biasStripGeometry({ ...base, data: NOISY, limits: Number.MAX_VALUE });
    expect(geo.band).toBeNull();
    expect(geo.biasY).toBeNull();
    expect(geo.withinPct).toBeNull(); // nothing announced that was not painted
    expect(new Set(geo.dots.map((d) => d.y)).size).toBeGreaterThan(1); // dots still spread
  });

  it("a non-finite r falls back to the default radius; finite ones still clamp", () => {
    // `clamp` is NaN-transparent, so NaN used to reach cx/cy/r and --mc-seat
    expect(biasLayout(56, 30, "bias", Number.NaN).rad).toBe(1.5);
    expect(biasLayout(56, 30, "bias", Number.POSITIVE_INFINITY).rad).toBe(1.5);
    expect(biasLayout(56, 30, "bias", 8).rad).toBe(3);
    expect(biasLayout(56, 30, "bias", undefined).rad).toBe(1.5);
  });

  test.prop([
    fc.array(
      fc.record({
        a: fc.double({ min: -1e4, max: 1e4 }),
        b: fc.double({ min: -1e4, max: 1e4 }),
      }),
      { maxLength: 80 },
    ),
    // k unconstrained on purpose — NaN, ±Infinity and negatives included. It is
    // a CONFIG prop a host computes, and every coordinate here depends on it.
    fc.double(),
  ])("dots + band stay inside the plot and finite; withinPct ∈ [0, 100]", (data, k) => {
    const geo = biasStripGeometry({ ...base, data, limits: k });
    for (const d of geo.dots) {
      expect(Number.isFinite(d.x) && Number.isFinite(d.y)).toBe(true);
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(56);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(30);
    }
    expect(Number.isFinite(geo.zeroY)).toBe(true);
    if (geo.biasY !== null) expect(Number.isFinite(geo.biasY)).toBe(true);
    if (geo.band) {
      expect(Number.isFinite(geo.band.y) && Number.isFinite(geo.band.height)).toBe(true);
      expect(geo.band.y).toBeGreaterThanOrEqual(0);
      expect(geo.band.y + geo.band.height).toBeLessThanOrEqual(30.01);
    }
    if (geo.withinPct !== null) {
      expect(geo.withinPct).toBeGreaterThanOrEqual(0);
      expect(geo.withinPct).toBeLessThanOrEqual(100);
    }
    expect(geo.dots.length).toBeLessThanOrEqual(40);
  });
});
