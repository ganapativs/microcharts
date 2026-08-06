import { describe, it, expect } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  seatLabels,
  spreadLabels,
  rowLabelFont,
  rowLabelChars,
  ROW_LABEL_MAX_CHARS,
  ROW_LABEL_MIN_CHARS,
} from "./labels.js";

describe("spreadLabels", () => {
  it("leaves already-spaced labels alone", () => {
    expect(spreadLabels([10, 30, 50], 6, 0, 60)).toEqual([10, 30, 50]);
  });

  it("nudges colliding labels apart, preserving input order", () => {
    const out = spreadLabels([20, 22, 24], 6, 0, 60)!;
    expect(out[1]! - out[0]!).toBeGreaterThanOrEqual(6);
    expect(out[2]! - out[1]!).toBeGreaterThanOrEqual(6);
  });

  it("pulls overflow back from the bottom edge", () => {
    const out = spreadLabels([55, 57, 59], 6, 0, 60)!;
    expect(Math.max(...out)).toBeLessThanOrEqual(60);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });

  it("returns null when the band cannot hold them", () => {
    expect(spreadLabels([1, 2, 3, 4, 5], 10, 0, 20)).toBeNull();
  });

  it("empty input → empty output", () => {
    expect(spreadLabels([], 5, 0, 10)).toEqual([]);
  });

  test.prop([
    fc.array(fc.double({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 12 }),
    fc.double({ min: 0.5, max: 10, noNaN: true }),
  ])("output honors pitch, band, and rank order", (ys, pitch) => {
    const out = spreadLabels(ys, pitch, 0, 100);
    if ((ys.length - 1) * pitch > 100) {
      expect(out).toBeNull();
      return;
    }
    expect(out).not.toBeNull();
    const sortedIdx = ys.map((y, i) => i).sort((a, b) => ys[a]! - ys[b]! || a - b);
    for (let k = 1; k < sortedIdx.length; k++) {
      const gap = out![sortedIdx[k]!]! - out![sortedIdx[k - 1]!]!;
      expect(gap).toBeGreaterThanOrEqual(pitch - 0.02); // 2-dp rounding
    }
    for (const v of out!) {
      expect(v).toBeGreaterThanOrEqual(-0.01);
      expect(v).toBeLessThanOrEqual(100.01);
    }
  });
});

describe("seatLabels", () => {
  it("leaves already-spaced labels exactly where they are", () => {
    expect(seatLabels([10, 30, 50], 6, 0, 60)).toEqual([10, 30, 50]);
  });

  it("nudges a colliding label at most half a pitch, then drops it", () => {
    // 22 clears 20 by 2, so it moves to 26 — 4 units, past half of 6.
    expect(seatLabels([20, 22], 6, 0, 60)).toEqual([20, null]);
    // 24 only needs 2 units to clear, which it is allowed.
    expect(seatLabels([20, 24], 6, 0, 60)).toEqual([20, 26]);
  });

  it("passes null slots through, so a caller can read back by row", () => {
    expect(seatLabels([10, null, 30], 6, 0, 60)).toEqual([10, null, 30]);
  });

  it("clamps into the band, and drops what cannot be clamped into it", () => {
    // 4 units of clamping is more than half a 6-unit pitch, so both drop.
    expect(seatLabels([-4, 64], 6, 0, 60)).toEqual([null, null]);
    // 2 units is inside the allowance: the outermost label rides the edge.
    expect(seatLabels([-2, 62], 6, 0, 60)).toEqual([0, 60]);
  });

  it("a dropped label leaves its room to the next one", () => {
    // 21 cannot seat (it would move 5 of a 6-unit pitch); 28 can, at 28.
    expect(seatLabels([20, 21, 28], 6, 0, 60)).toEqual([20, null, 28]);
  });

  it("empty input → empty output", () => {
    expect(seatLabels([], 5, 0, 10)).toEqual([]);
  });

  test.prop([
    fc.array(fc.oneof(fc.double({ min: -20, max: 120, noNaN: true }), fc.constant(null)), {
      minLength: 1,
      maxLength: 12,
    }),
    fc.double({ min: 0.5, max: 20, noNaN: true }),
  ])("a kept label is inside the band, in order, and near its own datum", (ys, pitch) => {
    const out = seatLabels(ys, pitch, 0, 100);
    expect(out.length).toBe(ys.length);
    const kept: { want: number; seat: number }[] = [];
    ys.forEach((y, i) => {
      if (out[i] === null) return;
      expect(y).not.toBeNull();
      kept.push({ want: y!, seat: out[i]! });
    });
    kept.sort((a, b) => a.want - b.want);
    for (let k = 0; k < kept.length; k++) {
      const { want, seat } = kept[k]!;
      // inside the band
      expect(seat).toBeGreaterThanOrEqual(-0.01);
      expect(seat).toBeLessThanOrEqual(100.01);
      // near its own datum — the bound that keeps a label on its own mark
      expect(Math.abs(seat - want)).toBeLessThanOrEqual(pitch / 2 + 0.01);
      // rank order survives, at a full pitch
      if (k > 0) expect(seat - kept[k - 1]!.seat).toBeGreaterThanOrEqual(pitch - 0.02);
    }
    // …and therefore no kept label is closer to another kept label's datum
    for (const a of kept) {
      for (const b of kept) {
        if (a === b) continue;
        expect(Math.abs(a.seat - a.want)).toBeLessThanOrEqual(Math.abs(a.seat - b.want) + 0.01);
      }
    }
  });
});

describe("row labels (one policy for the whole stacked family)", () => {
  it("sizes off the row pitch, not the chart height", () => {
    // The bug this replaces: Dumbbell fed the HEIGHT to labelFont, so adding
    // rows grew the type while the room per row stayed put.
    const pitch = 12;
    for (const rows of [2, 3, 5, 8]) {
      expect(rowLabelFont(pitch)).toBe(rowLabelFont(pitch));
      // height grows with rows; the answer must not
      expect(rowLabelFont((rows * pitch) / rows)).toBe(rowLabelFont(pitch));
    }
  });

  it("holds the library's own floor and ceiling", () => {
    expect(rowLabelFont(0)).toBe(7);
    expect(rowLabelFont(1000)).toBe(11);
  });

  it("drops the label rather than truncating it to a stub", () => {
    const fs = rowLabelFont(12);
    // A gutter too narrow for a useful truncation returns 0 = drop, and the
    // caller hands the space back to the plot.
    expect(rowLabelChars(10, fs, 13)).toBe(0);
    // Roomy enough → a real truncation, capped.
    expect(rowLabelChars(200, fs, 40)).toBe(ROW_LABEL_MAX_CHARS);
  });

  it("never asks for more characters than the label has", () => {
    expect(rowLabelChars(200, rowLabelFont(12), 4)).toBe(4);
  });

  it("a short label still shows when it fits whole, even in a narrow gutter", () => {
    // "AB" is 2 chars; the min-useful floor is about truncation, not about
    // refusing labels that need no truncating at all.
    const fs = rowLabelFont(12);
    expect(rowLabelChars(30, fs, 2)).toBe(2);
  });

  test.prop([
    fc.double({ min: 0, max: 400, noNaN: true }),
    fc.integer({ min: 1, max: 60 }),
    fc.double({ min: 1, max: 60, noNaN: true }),
  ])(
    "never returns a stub: the answer is 0, or at least the useful floor",
    (room, longest, pitch) => {
      const n = rowLabelChars(room, rowLabelFont(pitch), longest);
      expect(n === 0 || n >= Math.min(ROW_LABEL_MIN_CHARS, longest)).toBe(true);
      expect(n).toBeLessThanOrEqual(Math.min(ROW_LABEL_MAX_CHARS, longest));
    },
  );
});
