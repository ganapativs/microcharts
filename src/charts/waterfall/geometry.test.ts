import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { waterfallGeometry, placeWaterfallLabels } from "./geometry.js";

const base = { width: 70, height: 18, start: 0, total: true };

describe("waterfallGeometry", () => {
  it("bars float at the running level; total bar anchors at zero", () => {
    const geo = waterfallGeometry({ ...base, start: 1200, deltas: [300, -140, 180] });
    expect(geo.levels).toEqual([1500, 1360, 1540]);
    expect(geo.totalBar).not.toBeNull();
    // the total spans zero → its level: y(0) is one edge
    const t = geo.totalBar!;
    expect(Math.abs(t.y + t.h - geo.zeroY) < 0.6 || Math.abs(t.y - geo.zeroY) < 0.6).toBe(true);
  });

  it("zero delta → a visible 1-unit tick at the level", () => {
    const geo = waterfallGeometry({ ...base, deltas: [100, 0, 50] });
    expect(geo.bars[1]!.h).toBe(1);
    expect(geo.bars[1]!.sign).toBe(0);
  });

  it("running level crossing zero straddles correctly", () => {
    const geo = waterfallGeometry({ ...base, deltas: [50, -120] });
    expect(geo.levels).toEqual([50, -70]);
    const b = geo.bars[1]!;
    expect(b.y).toBeLessThan(geo.zeroY);
    expect(b.y + b.h).toBeGreaterThan(geo.zeroY);
  });

  test.prop([
    fc.array(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { minLength: 1, maxLength: 7 }),
    fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
    fc.boolean(),
  ])("containment: bars + connectors + total inside the box", (deltas, start, total) => {
    const geo = waterfallGeometry({ width: 70, height: 18, deltas, start, total });
    for (const b of [...geo.bars, ...(geo.totalBar ? [geo.totalBar] : [])]) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(70.01);
      expect(b.y).toBeGreaterThanOrEqual(-0.6);
      expect(b.y + b.h).toBeLessThanOrEqual(18.6);
    }
    for (const c of geo.connectors) {
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeLessThanOrEqual(18.01);
    }
  });
});

describe("placeWaterfallLabels — deterministic magnitude drop-out", () => {
  const items = [
    { index: 0, cx: 10, w: 18, priority: 300 },
    { index: 1, cx: 22, w: 18, priority: 40 },
    { index: 2, cx: 50, w: 18, priority: 140 },
  ];

  it("keeps the biggest movers when neighbours collide", () => {
    // cols 0 and 1 overlap (12 apart, boxes 18 wide); the bigger (0) survives.
    const kept = placeWaterfallLabels(items, 70).map((l) => l.index);
    expect(kept).toEqual([0, 2]);
  });

  it("returns survivors in index order regardless of priority", () => {
    const kept = placeWaterfallLabels(items, 70);
    expect(kept.map((l) => l.index)).toEqual([...kept].map((l) => l.index).sort((a, b) => a - b));
  });

  it("is a pure function of its inputs (stable across runs)", () => {
    expect(placeWaterfallLabels(items, 70)).toEqual(placeWaterfallLabels(items, 70));
  });

  it("wide labels drop until they fit; none overrun the box", () => {
    const placed = placeWaterfallLabels(items, 70);
    for (const l of placed) {
      expect(l.x).toBeGreaterThanOrEqual(0);
      expect(l.x).toBeLessThanOrEqual(70);
    }
  });

  test.prop([
    fc.array(
      fc.record({
        cx: fc.double({ noNaN: true, min: 0, max: 70 }),
        w: fc.double({ noNaN: true, min: 4, max: 30 }),
        priority: fc.double({ noNaN: true, min: 0, max: 1e4 }),
      }),
      { minLength: 0, maxLength: 8 },
    ),
  ])("kept labels never overlap and stay in the box", (raw) => {
    const rows = raw.map((r, index) => ({ index, ...r }));
    const placed = placeWaterfallLabels(rows, 70);
    const byIndex = new Map(rows.map((r) => [r.index, r]));
    const boxes = placed.map((l) => {
      const half = Math.min(byIndex.get(l.index)!.w / 2, 35);
      return { lo: l.x - half, hi: l.x + half };
    });
    for (const b of boxes) {
      expect(b.lo).toBeGreaterThanOrEqual(-0.01);
      expect(b.hi).toBeLessThanOrEqual(70.01);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++)
        expect(boxes[i]!.hi <= boxes[j]!.lo || boxes[j]!.hi <= boxes[i]!.lo).toBe(true);
  });
});
