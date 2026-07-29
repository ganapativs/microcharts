import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import {
  changePointGeometry,
  detectBreaks,
  BREAK_SS_RATIO,
  BREAK_EFFECT_SIZE,
  BREAK_MIN_SEG_DIVISOR,
} from "./geometry.js";

const base = { width: 80, height: 16 };
const step = (a: number, na: number, b: number, nb: number): number[] => [
  ...Array(na).fill(a),
  ...Array(nb).fill(b),
];

describe("detectBreaks — a labelled heuristic", () => {
  it("finds the exact index on a clean step", () => {
    expect(detectBreaks(step(10, 10, 50, 10))).toEqual([10]);
  });

  it("no break on a constant series", () => {
    expect(detectBreaks(Array(40).fill(7))).toEqual([]);
  });

  it("no break on low-amplitude iid noise (effect-size gate)", () => {
    // deterministic pseudo-noise around a constant mean, small amplitude
    const noise = Array.from({ length: 60 }, (_, i) => 50 + ((i * 7) % 5) - 2);
    expect(detectBreaks(noise)).toEqual([]);
  });

  it("never returns more than `max` breaks", () => {
    const three = [...step(10, 8, 40, 8).flat(), ...Array(8).fill(70), ...Array(8).fill(20)];
    expect(detectBreaks(three, 2).length).toBeLessThanOrEqual(2);
    expect(detectBreaks(three, 1).length).toBeLessThanOrEqual(1);
    expect(detectBreaks(three, 3).length).toBeLessThanOrEqual(3);
  });

  it("finds two breaks on a two-step series", () => {
    const two = [...Array(10).fill(10), ...Array(10).fill(50), ...Array(10).fill(20)];
    const b = detectBreaks(two, 2);
    expect(b.length).toBe(2);
    expect(b).toContain(10);
    expect(b).toContain(20);
  });

  it("n < 2·minSeg → no breaks", () => {
    expect(detectBreaks([1, 2, 3, 4, 5])).toEqual([]);
  });

  it("break indices are in the CALLER's index space, not the gap-filtered one", () => {
    const clean = [...Array(20).fill(10), ...Array(20).fill(50)];
    expect(detectBreaks(clean)).toEqual([20]);
    // four leading gaps push the same shift to index 24
    expect(detectBreaks([NaN, NaN, NaN, NaN, ...clean])).toEqual([24]);
    // …and gaps INSIDE the first regime shift it just as far
    const inner = [...Array(20).fill(10), ...Array(20).fill(50)];
    inner.splice(5, 0, NaN, NaN);
    expect(detectBreaks(inner)).toEqual([22]);
  });

  it("a non-finite `max` falls back to the documented default of 2", () => {
    const three = [
      ...Array(8).fill(10),
      ...Array(8).fill(40),
      ...Array(8).fill(70),
      ...Array(8).fill(20),
    ];
    expect(detectBreaks(three, NaN).length).toBe(2);
    expect(detectBreaks(three, NaN)).toEqual(detectBreaks(three, 2));
  });

  it("constants are exported and sane", () => {
    expect(BREAK_SS_RATIO).toBe(0.2);
    expect(BREAK_EFFECT_SIZE).toBe(0.8);
    expect(BREAK_MIN_SEG_DIVISOR).toBe(10);
  });

  test.prop([fc.integer({ min: 0, max: 100 }), fc.integer({ min: 8, max: 40 })])(
    "a constant series never breaks",
    (v, n) => {
      expect(detectBreaks(Array(n).fill(v))).toEqual([]);
    },
  );
});

describe("changePointGeometry", () => {
  it("segments + break carry the regime means and signed delta", () => {
    const geo = changePointGeometry({ ...base, data: step(10, 10, 15, 10) })!;
    expect(geo.breaks.length).toBe(1);
    expect(geo.breaks[0]!.index).toBe(10);
    expect(geo.breaks[0]!.before).toBe(10);
    expect(geo.breaks[0]!.after).toBe(15);
    expect(geo.breaks[0]!.delta).toBe(0.5); // +50%
    expect(geo.segments.length).toBe(2);
  });

  it("explicit breaks override detection entirely", () => {
    const geo = changePointGeometry({ ...base, data: Array(40).fill(7), breaks: [20] })!;
    expect(geo.breaks.map((b) => b.index)).toEqual([20]);
  });

  it("explicit out-of-range breaks are dropped", () => {
    const geo = changePointGeometry({ ...base, data: Array(20).fill(3), breaks: [5, 99, -2] })!;
    expect(geo.breaks.map((b) => b.index)).toEqual([5]);
  });

  it("n < 8 → detection off (explicit still honored)", () => {
    const auto = changePointGeometry({ ...base, data: step(1, 3, 9, 3) })!;
    expect(auto.breaks).toEqual([]);
    const forced = changePointGeometry({ ...base, data: step(1, 3, 9, 3), breaks: [3] })!;
    expect(forced.breaks.length).toBe(1);
  });

  it("nulls excluded from segment stats, line gaps", () => {
    const data = [10, 10, NaN, 10, 50, 50, 50, 50];
    const geo = changePointGeometry({ ...base, data, breaks: [4] })!;
    expect(geo.segments[0]!.mean).toBe(10); // NaN excluded
    expect(geo.line.d).toContain("M"); // has at least one run
  });

  it("segment means follow the caller's indices once gaps shift the break", () => {
    const geo = changePointGeometry({
      ...base,
      data: [NaN, NaN, NaN, NaN, ...Array(20).fill(10), ...Array(20).fill(50)],
    })!;
    expect(geo.breaks.map((b) => b.index)).toEqual([24]);
    expect(geo.breaks[0]!.before).toBe(10);
    expect(geo.breaks[0]!.after).toBe(50); // was 43.33 — four 10s leaked across
  });

  it("an unusable domain lands mid-plot; it never emits NaN coords", () => {
    const data = step(10, 10, 50, 10);
    for (const domain of [
      [NaN, NaN],
      [-Infinity, Infinity],
      [0, Infinity],
      [5, 5],
    ] as [number, number][]) {
      const geo = changePointGeometry({ ...base, data, domain })!;
      expect(geo.line.d).not.toContain("NaN");
      for (const s of geo.segments) expect(Number.isFinite(s.meanY)).toBe(true);
    }
  });

  it("a span that overflows to Infinity lands mid-plot, not on NaN", () => {
    const geo = changePointGeometry({
      ...base,
      data: [...Array(10).fill(1e308), ...Array(10).fill(-1e308)],
    })!;
    expect(geo.line.d).not.toContain("NaN");
  });

  it("empty / all-NaN → null", () => {
    expect(changePointGeometry({ ...base, data: [] })).toBeNull();
    expect(changePointGeometry({ ...base, data: [NaN, NaN] })).toBeNull();
  });

  test.prop([fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 80 })])(
    "coords within the viewBox; at most 2 breaks by default",
    (data) => {
      const geo = changePointGeometry({ ...base, data });
      if (geo === null) return;
      expect(geo.breaks.length).toBeLessThanOrEqual(2);
      for (const b of geo.breaks) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x).toBeLessThanOrEqual(base.width);
      }
    },
  );
});
