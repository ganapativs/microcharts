import { describe, expect, it } from "vitest";
import { sproutRowGeometry, stageGlyph } from "./geometry.js";

// topmost y from M/L segments only (arc params aren't x,y pairs)
const topY = (d: string): number => {
  const ys = [...d.matchAll(/[ML](-?\d+\.?\d*) (-?\d+\.?\d*)/g)].map((m) => Number(m[2]));
  return Math.min(...ys);
};

describe("sproutRowGeometry — ordinal growth", () => {
  it("stages are rounded + clamped to 0–3; null passes through", () => {
    const geo = sproutRowGeometry({ stages: [null, -1, 2.6, 5], height: 20, step: 16, pad: 2 });
    expect(geo.slots.map((s) => s.stage)).toEqual([null, 0, 3, 3]);
  });

  it("glyph height is STRICTLY monotonic in stage (taller = further along)", () => {
    const by = 17;
    const tops = [0, 1, 2, 3].map((s) => topY(stageGlyph(s, 10, by, 15)));
    // higher stage → smaller y (taller). Strictly decreasing.
    expect(tops[0]!).toBeGreaterThan(tops[1]!);
    expect(tops[1]!).toBeGreaterThan(tops[2]!);
    expect(tops[2]!).toBeGreaterThan(tops[3]!);
  });

  it("slots march left to right; soil spans the row", () => {
    const geo = sproutRowGeometry({ stages: [0, 1, 2], height: 20, step: 16, pad: 2 });
    expect(geo.slots[0]!.x).toBeLessThan(geo.slots[1]!.x);
    expect(geo.slots[1]!.x).toBeLessThan(geo.slots[2]!.x);
    expect(geo.soil.x1).toBeLessThan(geo.soil.x2);
  });

  it("labels reserve a bottom band (soil rises)", () => {
    const plain = sproutRowGeometry({ stages: [1, 2], height: 20, step: 16, pad: 2 });
    const labelled = sproutRowGeometry({
      stages: [1, 2],
      height: 20,
      step: 16,
      pad: 2,
      bottomReserve: 7,
    });
    expect(labelled.soil.y1).toBeLessThan(plain.soil.y1);
  });
});
