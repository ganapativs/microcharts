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
