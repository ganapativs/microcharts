import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { bumpGeometry } from "./geometry.js";

const base = { width: 60, height: 16, gutterLeftCh: 2, gutterRightCh: 2, fontSize: 6 };

describe("bumpGeometry", () => {
  it("rank 1 sits at the TOP (inverted y, documented)", () => {
    const geo = bumpGeometry({ ...base, ranks: [1, 5] });
    expect(geo.points[0]!.y).toBeLessThan(geo.points[1]!.y);
  });

  it("step line: change dots only where rank moved", () => {
    const geo = bumpGeometry({ ...base, ranks: [3, 3, 2, 2, 5] });
    expect(geo.changes.length).toBe(2); // 3→2 and 2→5
    expect(geo.d).toContain("V"); // vertical steps
  });

  it("null periods break the line (gaps, never diagonal interpolation)", () => {
    const geo = bumpGeometry({ ...base, ranks: [3, null, 2] });
    expect((geo.d.match(/M/g) ?? []).length).toBe(2);
  });

  it("a period with gaps on both sides is reported isolated (a lone M never strokes)", () => {
    const both = bumpGeometry({ ...base, ranks: [3, null, 2] });
    expect(both.isolated).toEqual([
      { x: both.points[0]!.x, y: both.points[0]!.y },
      { x: both.points[1]!.x, y: both.points[1]!.y },
    ]);
    expect(bumpGeometry({ ...base, ranks: [3] }).isolated.length).toBe(1);
    // a run of two is connected — the path paints it, so no dot
    expect(bumpGeometry({ ...base, ranks: [3, 2, null, 1] }).isolated.length).toBe(1);
    expect(bumpGeometry({ ...base, ranks: [3, 3, 2] }).isolated).toEqual([]);
  });

  it("an unusable maxRank is ignored, not painted (NaN / ±Infinity / < 1)", () => {
    const auto = bumpGeometry({ ...base, ranks: [1, 3, 5] });
    for (const bad of [Number.NaN, Infinity, -Infinity, 0, -5, 0.5]) {
      const geo = bumpGeometry({ ...base, ranks: [1, 3, 5], maxRank: bad });
      expect(geo.d, `maxRank=${bad}`).toBe(auto.d);
      expect(geo.d).not.toMatch(/NaN|Infinity/);
    }
  });

  // Rank 1 used to be a hard top anchor, so a run that never placed better than
  // #4 spent the top half of the box on ranks it never held.
  it("the occupied rank band fills the plot", () => {
    const geo = bumpGeometry({ ...base, ranks: [4, 6, 5, 7] });
    const ys = geo.points.map((p) => p.y);
    expect(Math.min(...ys)).toBeCloseTo(1.5, 2); // best rank (#4) at the top band
    expect(Math.max(...ys)).toBeCloseTo(14.5, 2); // worst rank (#7) at the bottom
    // …and the order is still rank order: #4 above #5 above #6 above #7.
    const y = (rank: number) => geo.points.find((p) => p.rank === rank)!.y;
    expect(y(4)).toBeLessThan(y(5));
    expect(y(5)).toBeLessThan(y(6));
    expect(y(6)).toBeLessThan(y(7));
  });

  it("a band with no extent rides the midline", () => {
    for (const ranks of [[3], [3, 3, 3]]) {
      const geo = bumpGeometry({ ...base, ranks });
      for (const p of geo.points) expect(p.y).toBe(8);
    }
  });

  it("maxRank is the escape hatch: it pins #1 back at the top", () => {
    const geo = bumpGeometry({ ...base, ranks: [4, 6, 5, 7], maxRank: 10 });
    expect(geo.points[0]!.y).toBeCloseTo(1.5 + (3 / 9) * 13, 2); // #4 of 10, not at the top
    // small multiples on that scale share it, whatever band each series occupies
    const other = bumpGeometry({ ...base, ranks: [1, 2], maxRank: 10 });
    expect(other.points[0]!.y).toBeCloseTo(1.5, 2);
  });

  it("maxRank fixes the band scale; ranks beyond clamp to the bottom", () => {
    const fixed = bumpGeometry({ ...base, ranks: [1, 2], maxRank: 10 });
    const auto = bumpGeometry({ ...base, ranks: [1, 2] });
    expect(fixed.points[1]!.y).toBeLessThan(auto.points[1]!.y); // rank 2 of 10 sits higher
    const over = bumpGeometry({ ...base, ranks: [12], maxRank: 10 });
    expect(over.points[0]!.y).toBeCloseTo(16 - 1.5, 1);
  });

  test.prop([
    fc.array(fc.option(fc.integer({ min: 1, max: 20 }), { nil: null }), { maxLength: 30 }),
  ])("containment: points + labels inside the box", (ranks) => {
    const geo = bumpGeometry({ ...base, ranks });
    for (const p of [...geo.points, ...geo.changes, ...geo.isolated]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(60);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(16);
    }
  });
});
