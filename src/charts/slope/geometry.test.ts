import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { slopeGeometry } from "./geometry.js";

const base = { width: 40, height: 40, gutterLeftCh: 0, gutterRightCh: 0, fontSize: 6 };

describe("slopeGeometry", () => {
  it("both columns share ONE y-domain (no fake convergence)", () => {
    const geo = slopeGeometry({
      ...base,
      pairs: [
        { from: 0, to: 100 },
        { from: 100, to: 0 },
      ],
    });
    // line 0 rises exactly where line 1 falls — symmetric on one scale
    expect(geo.lines[0]!.y0).toBe(geo.lines[1]!.y1);
    expect(geo.lines[0]!.y1).toBe(geo.lines[1]!.y0);
  });

  it("coincident endpoints de-overlap by 0.5 within the column", () => {
    const geo = slopeGeometry({
      ...base,
      pairs: [
        { from: 50, to: 10 },
        { from: 50, to: 90 },
      ],
    });
    expect(geo.lines[1]!.nudge0).toBe(0.5);
    expect(geo.lines[1]!.y0! - geo.lines[0]!.y0!).toBeCloseTo(0.5, 5);
  });

  it("labelsFit is a pure density rule (count × height)", () => {
    const tall = slopeGeometry({
      ...base,
      height: 40,
      pairs: [
        { from: 1, to: 2 },
        { from: 3, to: 4 },
      ],
    });
    expect(tall.labelsFit).toBe(true);
    const cramped = slopeGeometry({
      ...base,
      height: 24,
      pairs: Array.from({ length: 5 }, (_, i) => ({ from: i, to: i + 1 })),
    });
    expect(cramped.labelsFit).toBe(false);
  });

  it("missing ends → null y, dir 0", () => {
    const geo = slopeGeometry({ ...base, pairs: [{ from: Number.NaN, to: 5 }] });
    expect(geo.lines[0]!.y0).toBeNull();
    expect(geo.lines[0]!.y1).not.toBeNull();
    expect(geo.lines[0]!.dir).toBe(0);
  });

  test.prop([
    fc.array(
      fc.record({
        from: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
        to: fc.double({ noNaN: true, min: -1e4, max: 1e4 }),
      }),
      { minLength: 1, maxLength: 7 },
    ),
  ])("containment: endpoints inside the box", (pairs) => {
    const geo = slopeGeometry({ ...base, pairs });
    for (const line of geo.lines) {
      for (const y of [line.y0, line.y1]) {
        if (y !== null) {
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(40);
        }
      }
      expect(line.x0).toBeGreaterThanOrEqual(0);
      expect(line.x1).toBeLessThanOrEqual(40);
    }
  });
});
