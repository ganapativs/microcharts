import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { ohlcGeometry } from "./geometry.js";

const base = { width: 80, height: 16, gutterCh: 0, fontSize: 6 };
const p = (open: number, high: number, low: number, close: number) => ({ open, high, low, close });

describe("ohlcGeometry", () => {
  it("wick spans high-low; body spans open-close; up/doji flags", () => {
    const geo = ohlcGeometry({
      ...base,
      periods: [p(10, 15, 8, 13), p(13, 14, 11, 11), p(12, 13, 11, 12)],
    });
    expect(geo.marks.length).toBe(3);
    expect(geo.marks[0]!.up).toBe(true);
    expect(geo.marks[1]!.up).toBe(false);
    expect(geo.marks[2]!.doji).toBe(true);
    expect(geo.marks[0]!.yH).toBeLessThan(geo.marks[0]!.yL); // inverted y
  });

  it("corrupt periods are refused, never rendered plausibly", () => {
    const geo = ohlcGeometry({ ...base, periods: [p(10, 8, 12, 9), p(10, 15, 8, 13)] });
    expect(geo.invalid.length).toBe(1);
    expect(geo.marks.length).toBe(1);
  });

  it("mark.index is the SOURCE period, not a position among the painted marks", () => {
    // period 1 is corrupt (high < low): the marks after it must keep naming
    // their own period, or every read back into the caller's array shifts left.
    const geo = ohlcGeometry({
      ...base,
      periods: [p(10, 15, 8, 13), p(10, 8, 12, 9), p(12, 14, 11, 13), p(13, 16, 12, 15)],
    });
    expect(geo.invalid).toEqual([1]);
    expect(geo.marks.map((m) => m.index)).toEqual([0, 2, 3]);
  });

  it("past maxPeriods → most recent N, flagged truncated (never averaged)", () => {
    const many = Array.from({ length: 30 }, (_, i) => p(i, i + 2, i - 1, i + 1));
    const geo = ohlcGeometry({ ...base, periods: many, maxPeriods: 20 });
    expect(geo.truncated).toBe(true);
    expect(geo.marks.length).toBe(20);
  });

  test.prop([
    fc.array(
      fc
        .tuple(
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          fc.double({ min: 0, max: 1, noNaN: true }),
          fc.double({ min: 0, max: 1, noNaN: true }),
        )
        .map(([a, b, to, tc]) => {
          const low = Math.min(a, b);
          const high = Math.max(a, b);
          return { open: low + (high - low) * to, high, low, close: low + (high - low) * tc };
        }),
      { minLength: 1, maxLength: 20 },
    ),
  ])("containment: marks inside the box", (periods) => {
    const geo = ohlcGeometry({ ...base, periods });
    for (const m of geo.marks) {
      expect(m.x).toBeGreaterThanOrEqual(0);
      expect(m.x).toBeLessThanOrEqual(80);
      for (const y of [m.yH, m.yL, m.yO, m.yC]) {
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(16);
      }
    }
  });
});
