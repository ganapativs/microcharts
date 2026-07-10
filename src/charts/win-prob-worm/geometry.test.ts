import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { winProbWormGeometry, resolveWormGeo, swingMark, PAD } from "./geometry.js";
import { labelFont } from "../../core/labels.js";

const base = { width: 80, height: 16 };
// a game where the lead flips three times, then home pulls away to 98%
const GAME = [50, 48, 45, 52, 60, 58, 42, 38, 55, 68, 82, 90, 88, 94, 98];
// a tight see-saw that keeps swapping the lead right on the midline
const TIGHT = [50, 53, 49, 52, 48, 51, 47, 50, 46, 49, 45, 48, 52];
const num = (n: number): string => String(n);

describe("winProbWormGeometry (plan/26 §4)", () => {
  it("splits at 50 crossings and counts the lead changes", () => {
    const geo = winProbWormGeometry({ ...base, data: GAME })!;
    expect(geo.flips).toBe(3);
    expect(geo.crossings.length).toBe(3);
    // every crossing sits on the midline
    for (const c of geo.crossings) expect(c.y).toBe(geo.midY);
    // both sides get drawn (the worm was above AND below at points)
    expect(geo.aboveD).toContain("M");
    expect(geo.belowD).toContain("M");
  });

  it("endpoint + last carry the clamped current value", () => {
    const geo = winProbWormGeometry({ ...base, data: GAME })!;
    expect(geo.last).toBe(98);
    expect(geo.lastIndex).toBe(14);
    expect(geo.end).not.toBeNull();
    expect(geo.end!.value).toBe(98);
  });

  it("swing is the largest |Δ| step, signed, at the later index", () => {
    const geo = winProbWormGeometry({ ...base, data: GAME })!;
    expect(geo.swing).not.toBeNull();
    expect(geo.swing!.i).toBe(8); // the 38 → 55 jump
    expect(geo.swing!.delta).toBe(17);
  });

  it("interpolates the crossing x at the exact 50 point", () => {
    // 40 → 60 crosses 50 halfway between the two samples
    const geo = winProbWormGeometry({ width: 80, height: 20, data: [40, 60] })!;
    expect(geo.crossings.length).toBe(1);
    const [c0] = geo.crossings;
    const midX = PAD + 0.5 * (80 - 2 * PAD);
    expect(c0!.x).toBeCloseTo(midX, 5);
  });

  it("clamps out-of-range probabilities to 0–100", () => {
    const geo = winProbWormGeometry({ ...base, data: [120, -20, 50] })!;
    expect(geo.minV).toBe(0);
    expect(geo.maxV).toBe(100);
    expect(geo.last).toBe(50);
  });

  it("constant series → no crossings, min === max", () => {
    const flat = winProbWormGeometry({ ...base, data: [64, 64, 64] })!;
    expect(flat.flips).toBe(0);
    expect(flat.minV).toBe(flat.maxV);
    const tied = winProbWormGeometry({ ...base, data: [50, 50, 50] })!;
    expect(tied.flips).toBe(0);
    expect(tied.aboveD).toContain("M"); // sits on the midline, accent side
  });

  it("single point → endpoint only, no line, no swing", () => {
    const geo = winProbWormGeometry({ ...base, data: [72] })!;
    expect(geo.last).toBe(72);
    expect(geo.flips).toBe(0);
    expect(geo.swing).toBeNull();
    expect(geo.aboveD).toBe("");
    expect(geo.belowD).toBe("");
  });

  it("nulls break the worm (no crossing across a gap)", () => {
    const geo = winProbWormGeometry({ ...base, data: [60, null, 40] })!;
    expect(geo.flips).toBe(0);
    expect(geo.aboveD).toBe("");
    expect(geo.belowD).toBe("");
    expect(geo.end!.value).toBe(40); // last finite still marks "now"
  });

  it("empty / all-null → null", () => {
    expect(winProbWormGeometry({ ...base, data: [] })).toBeNull();
    expect(winProbWormGeometry({ ...base, data: [null, null] })).toBeNull();
  });

  // regression: the swing label must stay inside the viewBox and never land on a
  // crossing/endpoint dot — the two craft-gate failures (escape + text-on-mark).
  describe("swingMark containment + dot collision (craft regression)", () => {
    // resolve geometry exactly as the component renders it (label gutter reserved)
    const placed = (data: readonly number[], width: number, height: number) => {
      const font = labelFont(height);
      const { geo } = resolveWormGeo({ width, height, data, label: "last", font, fmt: num });
      return { mark: swingMark(geo!, true, font, num), font, geo: geo! };
    };
    // the audit's 0.62·fontSize text box (text-anchor middle, non-central baseline)
    const box = (text: string, x: number, y: number, font: number) => {
      const w = text.length * 0.62 * font;
      return { x0: x - w / 2, x1: x + w / 2, y0: y - font * 0.78, y1: y + font * 0.22 };
    };
    const collides = (b: ReturnType<typeof box>, cx: number, cy: number, r: number): boolean =>
      Math.min(b.x1, cx + r) - Math.max(b.x0, cx - r) > 1 &&
      Math.min(b.y1, cy + r) - Math.max(b.y0, cy - r) > 1;

    for (const [data, w, h] of [
      [GAME, 160, 24],
      [GAME, 240, 32],
      [GAME, 220, 28],
      [TIGHT, 160, 24],
      [TIGHT, 240, 32],
    ] as const) {
      it(`keeps the swing label inside + off every dot @${w}x${h}`, () => {
        const { mark, font, geo } = placed(data, w, h);
        if (mark === null) return; // seat-gated off is always craft-clean
        const b = box(mark.text, mark.x, mark.labelY, font);
        // fully inside the viewBox (the ESCAPE failure)
        expect(b.x0).toBeGreaterThanOrEqual(-0.3);
        expect(b.x1).toBeLessThanOrEqual(w + 0.3);
        expect(b.y0).toBeGreaterThanOrEqual(-0.3);
        expect(b.y1).toBeLessThanOrEqual(h + 0.3);
        // never on a crossing (r 1.8) or the endpoint (r 2.2) dot (TEXT-ON-MARK)
        for (const c of geo.crossings) expect(collides(b, c.x, c.y, 1.8)).toBe(false);
        expect(collides(b, geo.end!.x, geo.end!.y, 2.2)).toBe(false);
      });
    }

    it("shows +17 at a tall size but drops it at word height", () => {
      expect(placed(GAME, 220, 28).mark?.text).toBe("+17");
      expect(placed(GAME, 160, 16).mark).toBeNull();
    });
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 60 })])(
    "coords stay inside the viewBox; flips === crossings",
    (data) => {
      const geo = winProbWormGeometry({ ...base, data });
      if (geo === null) return;
      expect(geo.flips).toBe(geo.crossings.length);
      expect(geo.end!.x).toBeGreaterThanOrEqual(0);
      expect(geo.end!.x).toBeLessThanOrEqual(base.width);
      expect(geo.end!.y).toBeGreaterThanOrEqual(0);
      expect(geo.end!.y).toBeLessThanOrEqual(base.height);
      for (const c of geo.crossings) {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.x).toBeLessThanOrEqual(base.width);
      }
    },
  );
});
