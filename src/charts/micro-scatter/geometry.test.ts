import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { microScatterGeometry, relationshipTier, scatterRadius } from "./geometry.js";

const base = { width: 40, height: 24, trend: false };

describe("microScatterGeometry", () => {
  it("perfect correlation → r = 1; perfect inverse → r = -1", () => {
    const pos = microScatterGeometry({
      ...base,
      points: [1, 2, 3, 4].map((v) => ({ x: v, y: v * 2 })),
    });
    expect(pos.r).toBe(1);
    const neg = microScatterGeometry({
      ...base,
      points: [1, 2, 3, 4].map((v) => ({ x: v, y: -v })),
    });
    expect(neg.r).toBe(-1);
  });

  it("n < 3 or zero variance → r null (no relationship claim)", () => {
    expect(
      microScatterGeometry({
        ...base,
        points: [
          { x: 1, y: 2 },
          { x: 2, y: 3 },
        ],
      }).r,
    ).toBeNull();
    expect(
      microScatterGeometry({
        ...base,
        points: [1, 2, 3].map((v) => ({ x: v, y: 5 })), // horizontal cloud
      }).r,
    ).toBeNull();
  });

  it("non-finite pairs are dropped and counted", () => {
    const geo = microScatterGeometry({
      ...base,
      points: [
        { x: 1, y: 2 },
        { x: Number.NaN, y: 3 },
        { x: 4, y: Number.POSITIVE_INFINITY },
      ],
    });
    expect(geo.dots.length).toBe(1);
    expect(geo.dropped).toBe(2);
  });

  it("trend line only with real variance; clipped to the plot", () => {
    const geo = microScatterGeometry({
      ...base,
      trend: true,
      points: [1, 2, 3, 4].map((v) => ({ x: v, y: v })),
    });
    expect(geo.trendLine).not.toBeNull();
    const single = microScatterGeometry({ ...base, trend: true, points: [{ x: 1, y: 1 }] });
    expect(single.trendLine).toBeNull();
  });

  it("scatterRadius clamps to [1, 3] and rejects non-finite (default 1.5)", () => {
    expect(scatterRadius(undefined)).toBe(1.5);
    expect(scatterRadius(2)).toBe(2);
    expect(scatterRadius(0)).toBe(1);
    expect(scatterRadius(9)).toBe(3);
    // The old Math.min/Math.max spelling passed these straight through, and a
    // NaN radius poisons the scale range → every coordinate NaN.
    expect(scatterRadius(Number.NaN)).toBe(1.5);
    expect(scatterRadius(Number.POSITIVE_INFINITY)).toBe(1.5);
    expect(scatterRadius(Number.NEGATIVE_INFINITY)).toBe(1.5);
  });

  it("a non-finite radius still yields finite dots and trend line", () => {
    const geo = microScatterGeometry({
      ...base,
      trend: true,
      r: Number.NaN,
      points: [1, 2, 3, 4].map((v) => ({ x: v, y: v * 2 })),
    });
    for (const d of geo.dots) {
      expect(Number.isFinite(d.x)).toBe(true);
      expect(Number.isFinite(d.y)).toBe(true);
    }
    for (const v of Object.values(geo.trendLine!)) expect(Number.isFinite(v)).toBe(true);
  });

  it("relationshipTier heuristic (documented thresholds)", () => {
    expect(relationshipTier(0.82)).toBe("strong");
    expect(relationshipTier(-0.5)).toBe("moderate");
    expect(relationshipTier(0.25)).toBe("weak");
    expect(relationshipTier(0.1)).toBe("none");
  });

  test.prop([
    fc.array(
      fc.record({
        x: fc.double({ min: -1e4, max: 1e4 }),
        y: fc.double({ min: -1e4, max: 1e4 }),
      }),
      { maxLength: 60 },
    ),
    fc.boolean(),
  ])("r ∈ [−1, 1]; dots + trend clipped to the plot", (points, trend) => {
    const geo = microScatterGeometry({ ...base, trend, points });
    if (geo.r !== null) {
      expect(geo.r).toBeGreaterThanOrEqual(-1);
      expect(geo.r).toBeLessThanOrEqual(1);
    }
    for (const d of geo.dots) {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(40);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(24);
    }
    if (geo.trendLine) {
      for (const v of [geo.trendLine.x1, geo.trendLine.x2]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(40);
      }
      for (const v of [geo.trendLine.y1, geo.trendLine.y2]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(24);
      }
    }
  });
});
