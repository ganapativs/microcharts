import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { quadrantDotGeometry, quadrantDotRadii } from "./geometry.js";

const base = { width: 24, height: 24 };
const FIELD = [
  { x: 2, y: 8 },
  { x: 8, y: 9 },
  { x: 3, y: 7 },
  { x: 9, y: 2 },
  { x: 7, y: 3 },
  { x: 1, y: 1 },
];

/** Every coordinate the chart emits, so a NaN can't hide in one of them. */
const coords = (geo: NonNullable<ReturnType<typeof quadrantDotGeometry>>): number[] => [
  geo.dot.x,
  geo.dot.y,
  geo.region.x,
  geo.region.y,
  geo.region.width,
  geo.region.height,
  ...(geo.cross.x === null ? [] : [geo.cross.x]),
  ...(geo.cross.y === null ? [] : [geo.cross.y]),
  ...geo.ghosts.flatMap((g) => [g.x, g.y]),
];

describe("quadrantDotGeometry", () => {
  it("focal quadrant by boundary rule ≥ split ⇒ right/top", () => {
    // domain 1..9 both axes → split at 5; focal (3,9) is x<5 (left), y≥5 (top) → TL=0
    const geo = quadrantDotGeometry({ ...base, data: { x: 3, y: 9 }, field: FIELD })!;
    expect(geo.quadrant).toBe(0);
    expect(geo.yHigh).toBe(true);
    expect(geo.xHigh).toBe(false);
  });

  it("exactly on the split lands top/right (deterministic)", () => {
    const geo = quadrantDotGeometry({
      ...base,
      data: { x: 5, y: 5 },
      xDomain: [0, 10],
      domain: [0, 10],
      split: [5, 5],
    })!;
    expect(geo.quadrant).toBe(1); // TR — both ≥ split
    expect(geo.xHigh).toBe(true);
    expect(geo.yHigh).toBe(true);
  });

  it("peersInQuadrant counts only the focal's quadrant", () => {
    // focal (3,9) TL; peers with x<5 & y≥5: (2,8),(3,7) → 2
    const geo = quadrantDotGeometry({ ...base, data: { x: 3, y: 9 }, field: FIELD })!;
    expect(geo.peersInQuadrant).toBe(2);
    expect(geo.fieldCount).toBe(6);
  });

  it("ghosts sorted nearest-first from the focal, capped at 30", () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ x: i, y: i }));
    const geo = quadrantDotGeometry({ ...base, data: { x: 25, y: 25 }, field: many })!;
    expect(geo.ghosts.length).toBe(30);
    // first ghost is the nearest raw point to (25,25)
    expect(geo.ghosts[0]!.vx).toBe(25);
  });

  it("no field → lone glyph, no ghosts, peersInQuadrant 0", () => {
    const geo = quadrantDotGeometry({ ...base, data: { x: 3, y: 9 } })!;
    expect(geo.ghosts).toEqual([]);
    expect(geo.fieldCount).toBe(0);
    expect(geo.peersInQuadrant).toBe(0);
  });

  it("degenerate x-axis → focal centered on x, vertical cross suppressed", () => {
    const geo = quadrantDotGeometry({
      ...base,
      data: { x: 5, y: 8 },
      field: [{ x: 5, y: 2 }],
    })!;
    expect(geo.xDegenerate).toBe(true);
    expect(geo.cross.x).toBeNull();
    expect(geo.cross.y).not.toBeNull();
    expect(geo.dot.x).toBeCloseTo(12, 0); // mid of 24
  });

  it("both axes degenerate → focal dead center, no cross lines", () => {
    const geo = quadrantDotGeometry({ ...base, data: { x: 5, y: 5 } })!;
    expect(geo.cross.x).toBeNull();
    expect(geo.cross.y).toBeNull();
    expect(geo.dot.x).toBeCloseTo(12, 0);
    expect(geo.dot.y).toBeCloseTo(12, 0);
  });

  it("region rect covers the focal's quadrant", () => {
    // focal TR (both high) with split at center → region is the top-right cell
    const geo = quadrantDotGeometry({
      ...base,
      data: { x: 9, y: 9 },
      xDomain: [0, 10],
      domain: [0, 10],
      split: [5, 5],
    })!;
    expect(geo.region.x).toBeGreaterThan(geo.cross.x! - 0.01);
    expect(geo.region.y).toBe(0);
  });

  it("NaN focal → null", () => {
    expect(quadrantDotGeometry({ ...base, data: { x: NaN, y: 3 } })).toBeNull();
  });

  // Hostile CONFIG (as opposed to hostile data): the props a host computes
  // rather than types. Each case below emitted NaN/Infinity coordinates — or a
  // rect metres wider than the viewBox — behind an accessible name that still
  // announced a quadrant and a peer count.
  describe("hostile config props", () => {
    it("a non-finite domain falls back to the data extent, never the NaN scale", () => {
      const bad = quadrantDotGeometry({ ...base, data: { x: 3, y: 9 }, field: FIELD })!;
      for (const hostile of [
        [NaN, 10],
        [0, NaN],
        [-Infinity, 10],
      ] as [number, number][]) {
        const geo = quadrantDotGeometry({
          ...base,
          data: { x: 3, y: 9 },
          field: FIELD,
          xDomain: hostile,
        })!;
        expect(coords(geo).every(Number.isFinite)).toBe(true);
        // …and it lands where the auto-domain would, not stacked on the split.
        expect(geo.dot.x).toBe(bad.dot.x);
      }
    });

    it("a non-finite split falls back to the domain midpoint", () => {
      const mid = quadrantDotGeometry({ ...base, data: { x: 3, y: 9 }, field: FIELD })!;
      for (const hostile of [
        [NaN, 5],
        [Infinity, 5],
      ] as [number, number][]) {
        const geo = quadrantDotGeometry({
          ...base,
          data: { x: 3, y: 9 },
          field: FIELD,
          split: hostile,
        })!;
        expect(coords(geo).every(Number.isFinite)).toBe(true);
        expect(geo.cross.x).toBe(mid.cross.x);
      }
    });

    it("a domain too wide to halve still resolves a finite split", () => {
      const geo = quadrantDotGeometry({
        ...base,
        data: { x: 0, y: 0 },
        domain: [-1e308, 1e308],
        xDomain: [-1e308, 1e308],
      })!;
      expect(coords(geo).every(Number.isFinite)).toBe(true);
    });

    it("a non-finite box falls back to the documented 24×24", () => {
      const data = { x: 3, y: 9 };
      const geo = quadrantDotGeometry({ width: NaN, height: NaN, data, field: FIELD })!;
      expect(geo).toEqual(quadrantDotGeometry({ ...base, data, field: FIELD }));
    });

    it("a split outside the domain pins the cross to the frame, not past it", () => {
      for (const split of [
        [20, 5],
        [-5, -5],
      ] as [number, number][]) {
        const geo = quadrantDotGeometry({
          ...base,
          data: { x: 3, y: 9 },
          field: FIELD,
          xDomain: [0, 10],
          domain: [0, 10],
          split,
        })!;
        expect(geo.cross.x).toBeGreaterThanOrEqual(0);
        expect(geo.cross.x).toBeLessThanOrEqual(base.width);
        expect(geo.region.x + geo.region.width).toBeLessThanOrEqual(base.width);
        expect(geo.region.y + geo.region.height).toBeLessThanOrEqual(base.height);
        expect(geo.region.width).toBeGreaterThanOrEqual(0);
      }
    });

    it("a point past a fixed domain lands on the edge, never outside the box", () => {
      const geo = quadrantDotGeometry({
        ...base,
        data: { x: 500, y: -500 },
        field: [{ x: -900, y: 900 }],
        xDomain: [0, 10],
        domain: [0, 10],
      })!;
      const { halo } = quadrantDotRadii(base.width, base.height);
      for (const [cx, cy] of [
        [geo.dot.x, geo.dot.y],
        [geo.ghosts[0]!.x, geo.ghosts[0]!.y],
      ]) {
        expect(cx! - halo).toBeGreaterThanOrEqual(0);
        expect(cx! + halo).toBeLessThanOrEqual(base.width);
        expect(cy! - halo).toBeGreaterThanOrEqual(0);
        expect(cy! + halo).toBeLessThanOrEqual(base.height);
      }
    });
  });

  // Containment: `.mc-root` is `overflow: visible`, so the halo running past
  // the viewBox paints over the neighbouring line, it does not clip. The plot
  // used to be inset by a flat 3 while the halo grows with the box — at 120 px
  // a focal on the domain edge hung ~10 units outside.
  it("the focal halo stays inside the viewBox at every box size", () => {
    for (const side of [8, 24, 40, 64, 120]) {
      const { halo } = quadrantDotRadii(side, side);
      const geo = quadrantDotGeometry({
        width: side,
        height: side,
        data: { x: 0, y: 0 },
        field: [{ x: 10, y: 10 }],
      })!;
      expect(geo.dot.x - halo).toBeGreaterThanOrEqual(0);
      expect(geo.dot.y + halo).toBeLessThanOrEqual(side);
    }
  });

  // Regression: the interactive hard-coded a 3-unit hit radius while the ghosts
  // are painted proportionally, so past ~58 units the dot outgrew its own hit
  // box and its rim went dead to the pointer.
  describe("quadrantDotRadii", () => {
    it("grows with the box and keeps the ghost inside the focal", () => {
      const small = quadrantDotRadii(24, 24);
      const large = quadrantDotRadii(64, 64);
      expect(large.focal).toBeGreaterThan(small.focal);
      expect(large.ghost).toBeLessThan(large.focal);
    });

    it("floors keep marks visible in tiny boxes", () => {
      const tiny = quadrantDotRadii(8, 8);
      expect(tiny.focal).toBe(1.6);
      expect(tiny.ghost).toBe(1);
    });

    it("sizes off the SHORT side, so a wide box does not inflate the dots", () => {
      expect(quadrantDotRadii(200, 24)).toEqual(quadrantDotRadii(24, 24));
    });

    it("a 64-unit box paints ghosts wider than the old fixed 3-unit hit radius", () => {
      expect(quadrantDotRadii(64, 64).ghost).toBeGreaterThan(3);
    });
  });

  test.prop([
    fc.record({ x: fc.integer({ min: -50, max: 50 }), y: fc.integer({ min: -50, max: 50 }) }),
    fc.array(
      fc.record({ x: fc.integer({ min: -50, max: 50 }), y: fc.integer({ min: -50, max: 50 }) }),
      { maxLength: 40 },
    ),
  ])("dot + ghosts stay within the viewBox", (data, field) => {
    const geo = quadrantDotGeometry({ ...base, data, field })!;
    expect(geo.dot.x).toBeGreaterThanOrEqual(0);
    expect(geo.dot.x).toBeLessThanOrEqual(base.width);
    expect(geo.dot.y).toBeGreaterThanOrEqual(0);
    expect(geo.dot.y).toBeLessThanOrEqual(base.height);
    for (const g of geo.ghosts) {
      expect(g.x).toBeGreaterThanOrEqual(0);
      expect(g.x).toBeLessThanOrEqual(base.width);
      expect(g.y).toBeGreaterThanOrEqual(0);
      expect(g.y).toBeLessThanOrEqual(base.height);
    }
  });
});
