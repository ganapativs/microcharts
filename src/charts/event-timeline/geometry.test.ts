import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { eventTimelineGeometry } from "./geometry.js";

const BASE = { width: 80, height: 12, fontSize: 5 };

describe("eventTimelineGeometry", () => {
  it("spans and points on one linear axis", () => {
    const geo = eventTimelineGeometry({
      ...BASE,
      items: [{ start: 0, end: 50 }, { start: 75 }],
      domain: [0, 100],
    });
    expect(geo.spans.length).toBe(1);
    expect(geo.points.length).toBe(1);
    expect(geo.spans[0]!.x0).toBe(2);
    expect(geo.spans[0]!.x1).toBe(40); // 50% of [2, 78]
    expect(geo.points[0]!.x).toBe(59); // 75%
  });

  it("coverage merges overlapping spans (never double-counts)", () => {
    const geo = eventTimelineGeometry({
      ...BASE,
      items: [
        { start: 0, end: 60 },
        { start: 40, end: 80 }, // overlaps the first
      ],
      domain: [0, 100],
    });
    expect(geo.coverage).toBe(0.8); // merged [0,80], not 1.0
  });

  it("items overlapping the window edge clip flat; fully-outside are excluded", () => {
    const geo = eventTimelineGeometry({
      ...BASE,
      items: [
        { start: -50, end: 20 }, // clips at the left edge
        { start: 200, end: 300 }, // fully outside
        { start: -10 }, // point outside
      ],
      domain: [0, 100],
    });
    expect(geo.spans.length).toBe(1);
    expect(geo.spans[0]!.clipped).toBe(true);
    expect(geo.spans[0]!.x0).toBe(2); // flat cut at the window edge
    expect(geo.points.length).toBe(0);
    expect(geo.coverage).toBe(0.2);
  });

  it("now tick lands inside the plot", () => {
    const geo = eventTimelineGeometry({
      ...BASE,
      items: [],
      domain: [0, 100],
      now: 50,
    });
    expect(geo.nowX).toBe(40);
    expect(eventTimelineGeometry({ ...BASE, items: [], domain: [0, 100] }).nowX).toBeNull();
  });

  it("span labels fit only when the estimated text fits", () => {
    const geo = eventTimelineGeometry({
      ...BASE,
      items: [
        { start: 0, end: 90, label: "Deploy" },
        { start: 92, end: 95, label: "Deploy" },
      ],
      domain: [0, 100],
    });
    expect(geo.spans[0]!.labelFits).toBe(true);
    expect(geo.spans[1]!.labelFits).toBe(false);
  });

  test.prop([
    fc.array(
      fc
        .tuple(
          fc.double({ min: -1000, max: 2000, noNaN: true }),
          fc.option(fc.double({ min: 0, max: 500, noNaN: true }), { nil: undefined }),
        )
        .map(([start, dur]) => ({
          start,
          end: dur === undefined ? undefined : start + dur,
        })),
      { maxLength: 20 },
    ),
  ])("containment + coverage ∈ [0,1] for any items", (items) => {
    const geo = eventTimelineGeometry({ ...BASE, items, domain: [0, 1000] });
    expect(geo.coverage).toBeGreaterThanOrEqual(0);
    expect(geo.coverage).toBeLessThanOrEqual(1);
    for (const s of geo.spans) {
      expect(s.x0).toBeGreaterThanOrEqual(0);
      expect(s.x1).toBeLessThanOrEqual(80);
      expect(s.x1).toBeGreaterThanOrEqual(s.x0);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y + s.h).toBeLessThanOrEqual(12);
    }
    for (const p of geo.points) {
      expect(p.x - 2.5).toBeGreaterThanOrEqual(0);
      expect(p.x + 2.5).toBeLessThanOrEqual(80);
    }
  });

  // The box is the one input <Chart> sanitizes on its own (viewBox side → 1),
  // so geometry laid marks out against a box that was never painted.
  describe("the box geometry uses is the box <Chart> paints", () => {
    it("a short lane keeps a POSITIVE span bar inside the box", () => {
      // `height - 4` went to 0 at height 4 and negative below it. A `<rect>`
      // height of 0 or less is an SVG error, so the browser dropped every span
      // while the summary still announced them.
      for (const height of [1, 2, 3, 4, 5, 6]) {
        const geo = eventTimelineGeometry({
          ...BASE,
          height,
          items: [{ start: 0, end: 50 }],
          domain: [0, 100],
        });
        const s = geo.spans[0]!;
        expect(s.h, `span bar at height ${height}`).toBeGreaterThan(0);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y + s.h).toBeLessThanOrEqual(height);
      }
    });

    it("the point diamond shrinks to the lane instead of spilling", () => {
      const geo = eventTimelineGeometry({
        ...BASE,
        height: 3,
        items: [{ start: 50 }],
        domain: [0, 100],
      });
      const p = geo.points[0]!;
      expect(p.y - geo.r).toBeGreaterThanOrEqual(0);
      expect(p.y + geo.r).toBeLessThanOrEqual(3);
      // unchanged at the default lane
      expect(eventTimelineGeometry({ ...BASE, items: [], domain: [0, 1] }).r).toBe(2.5);
    });

    it("a 4-unit box still runs time left to right", () => {
      // A fixed 2-unit pad inverted the range to [2, 0] below width 4.
      const geo = eventTimelineGeometry({ ...BASE, width: 4, items: [], domain: [0, 100] });
      expect(geo.track.x1).toBeGreaterThan(geo.track.x0);
    });

    it("round2 cannot push a mark past a sub-centibox side", () => {
      // Counterexample from the property test: width 0.009 rounds to 0.01.
      const width = 0.009090909090909092;
      const height = Number.POSITIVE_INFINITY;
      const w = Number.isFinite(width) && width > 0 ? width : 1;
      const h = Number.isFinite(height) && height > 0 ? height : 1;
      const geo = eventTimelineGeometry({
        ...BASE,
        width,
        height,
        items: [{ start: 10, end: 60 }, { start: 80 }],
        domain: [0, 100],
        now: 50,
      });
      for (const s of geo.spans) {
        expect(s.x0).toBeGreaterThanOrEqual(0);
        expect(s.x1).toBeLessThanOrEqual(w);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y + s.h).toBeLessThanOrEqual(h);
      }
      for (const p of geo.points) {
        expect(p.x - geo.r).toBeGreaterThanOrEqual(0);
        expect(p.x + geo.r).toBeLessThanOrEqual(w);
        expect(p.y - geo.r).toBeGreaterThanOrEqual(0);
        expect(p.y + geo.r).toBeLessThanOrEqual(h);
      }
    });

    test.prop([
      fc.oneof(fc.double({ min: -100, max: 400 }), fc.constant(NaN), fc.constant(Infinity)),
      fc.oneof(fc.double({ min: -20, max: 60 }), fc.constant(NaN), fc.constant(Infinity)),
    ])("any box yields finite, contained coordinates", (width, height) => {
      // <Chart> draws a non-finite or non-positive side at 1 unit; geometry has
      // to agree, so the containment bound is the box it resolves, not the prop.
      const w = Number.isFinite(width) && width > 0 ? width : 1;
      const h = Number.isFinite(height) && height > 0 ? height : 1;
      const geo = eventTimelineGeometry({
        ...BASE,
        width,
        height,
        items: [{ start: 10, end: 60 }, { start: 80 }],
        domain: [0, 100],
        now: 50,
      });
      for (const v of [geo.track.x0, geo.track.x1, geo.track.y, geo.r, geo.nowX ?? 0])
        expect(Number.isFinite(v)).toBe(true);
      for (const s of geo.spans) {
        expect(s.x0).toBeGreaterThanOrEqual(0);
        expect(s.x1).toBeLessThanOrEqual(w);
        // Geometry rounds to 2 dp at generation, so a lane thinner than 0.01
        // viewBox units has no representable bar — it rounds to 0, which is
        // invisible but still legal. Anything a browser could show is positive.
        if (h >= 0.01) expect(s.h).toBeGreaterThan(0);
        else expect(s.h).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y + s.h).toBeLessThanOrEqual(h);
      }
      for (const p of geo.points) {
        expect(p.x - geo.r).toBeGreaterThanOrEqual(0);
        expect(p.x + geo.r).toBeLessThanOrEqual(w);
        expect(p.y - geo.r).toBeGreaterThanOrEqual(0);
        expect(p.y + geo.r).toBeLessThanOrEqual(h);
      }
    });
  });

  it("degenerate domain (single instant) still renders", () => {
    const geo = eventTimelineGeometry({
      ...BASE,
      items: [{ start: 5 }],
      domain: [5, 5],
    });
    expect(geo.points.length).toBe(1);
    expect(Number.isFinite(geo.points[0]!.x)).toBe(true);
  });
});
