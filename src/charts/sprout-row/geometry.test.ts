import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { sproutRowGeometry, stageGlyph, stageGlyphBox } from "./geometry.js";

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

  it("a box too short for the pad keeps the soil on the frame", () => {
    // `height - pad - 1` went negative under ~3 units, so the soil — and every
    // glyph standing on it — painted above the top edge of a valid viewBox.
    for (const height of [1, 2, 3, 4]) {
      const geo = sproutRowGeometry({ stages: [3], height, step: 16, pad: 2 });
      expect(geo.soil.y1).toBeGreaterThanOrEqual(0);
      expect(geo.soil.y1).toBeLessThanOrEqual(height);
    }
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

// Every point `stageGlyph` actually paints, sampled. Handles the three commands
// it emits: M/L (points), Q (quadratic, sampled), and `a` — which it only ever
// uses to close a FULL circle back onto its own start, so the arc is the circle
// of radius r centred one radius below the start point.
const glyphPoints = (d: string): [number, number][] => {
  const out: [number, number][] = [];
  let x = 0;
  let y = 0;
  const re = /([MLQaZ])((?:\s*-?\d*\.?\d+){0,7})/g;
  for (const m of d.matchAll(re)) {
    const n = (m[2] ?? "").trim().split(/\s+/).filter(Boolean).map(Number);
    if (m[1] === "M" || m[1] === "L") {
      x = n[0]!;
      y = n[1]!;
      out.push([x, y]);
    } else if (m[1] === "Q") {
      const [qx, qy, ex, ey] = n as [number, number, number, number];
      for (let t = 0; t <= 1.0001; t += 0.02) {
        const u = 1 - t;
        out.push([
          u * u * x + 2 * u * t * qx + t * t * ex,
          u * u * y + 2 * u * t * qy + t * t * ey,
        ]);
      }
      x = ex;
      y = ey;
    } else if (m[1] === "a") {
      const r = n[0]!;
      for (let a = 0; a < 6.284; a += 0.05) {
        out.push([x + r * Math.cos(a), y + r + r * Math.sin(a)]);
      }
    }
  }
  return out;
};

describe("stageGlyphBox — the ring's box is the glyph's box", () => {
  // `gh` runs below zero because callers derive it as `baselineY - pad`, and a
  // collapsed box makes that negative: the glyph used to flip and emit a
  // NEGATIVE arc radius. Floored at 0 it simply has no room to grow.
  test.prop([fc.integer({ min: 0, max: 3 }), fc.double({ min: -6, max: 60, noNaN: true })])(
    "contains every painted point, and touches it on all four sides",
    (stage, gh) => {
      const by = gh + 2;
      const box = stageGlyphBox(stage, 20, by, gh);
      const pts = glyphPoints(stageGlyph(stage, 20, by, gh));
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      // contains (2-dp rounding is the only slack allowed)
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(box.x0 - 0.02);
      expect(Math.max(...xs)).toBeLessThanOrEqual(box.x1 + 0.02);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(box.y0 - 0.02);
      expect(Math.max(...ys)).toBeLessThanOrEqual(box.y1 + 0.02);
      // tight — a box that merely contains the glyph would still let a ring
      // built from it sit off-centre.
      expect(Math.min(...xs) - box.x0).toBeLessThan(0.1);
      expect(box.x1 - Math.max(...xs)).toBeLessThan(0.1);
      expect(Math.min(...ys) - box.y0).toBeLessThan(0.1);
      expect(box.y1 - Math.max(...ys)).toBeLessThan(0.1);
    },
  );

  // Containment is a hard rule, and the leaf's 1.4-unit floor was the one part
  // of the glyph that ignored the room it had: at height 4 it painted 2.3 units
  // above the frame. Heights below ~6 shed the plant instead of spilling.
  test.prop([fc.integer({ min: 0, max: 3 }), fc.integer({ min: 1, max: 64 })])(
    "the glyph stays inside a row of any height",
    (stage, height) => {
      const pad = 2; // mirrors <SproutRow>'s PAD
      const geo = sproutRowGeometry({ stages: [stage], height, step: 16, pad });
      const slot = geo.slots[0]!;
      const box = stageGlyphBox(slot.stage!, slot.x, slot.baselineY, slot.baselineY - pad);
      expect(box.x0).toBeGreaterThanOrEqual(0);
      expect(box.y0).toBeGreaterThanOrEqual(0);
      expect(box.x1).toBeLessThanOrEqual(geo.width);
      expect(box.y1).toBeLessThanOrEqual(height);
    },
  );
});
