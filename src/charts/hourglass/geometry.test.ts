import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { hourglassGeometry } from "./geometry.js";

const g = (value: number) => hourglassGeometry({ value, width: 16, height: 24, pad: 1 });

/** Shoelace area of a path made of M/L absolute commands. */
function pathArea(d: string): number {
  if (!d) return 0;
  const nums = (d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
  const pts: [number, number][] = [];
  for (let i = 0; i < nums.length; i += 2) pts.push([nums[i]!, nums[i + 1]!]);
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x2, y2] = pts[(i + 1) % pts.length]!;
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

describe("hourglassGeometry (plan/24 #7) — area-true sand", () => {
  it("value 0 → all sand top, no stream", () => {
    const r = g(0);
    expect(r.topSand).not.toBe("");
    expect(r.bottomSand).toBe("");
    expect(r.stream).toBeNull();
  });

  it("value 1 → all sand bottom, no stream (finished is shape-distinct)", () => {
    const r = g(1);
    expect(r.topSand).toBe("");
    expect(r.bottomSand).not.toBe("");
    expect(r.stream).toBeNull();
  });

  it("mid-run shows both chambers + the running stream", () => {
    const r = g(0.5);
    expect(r.topSand).not.toBe("");
    expect(r.bottomSand).not.toBe("");
    expect(r.stream).not.toBeNull();
  });

  it("sand is AREA-TRUE: elapsed:remaining areas match value:(1−value)", () => {
    const r = g(0.75);
    const elapsed = pathArea(r.bottomSand);
    const remaining = pathArea(r.topSand);
    // 0.75 elapsed vs 0.25 remaining → ~3:1 (a linear-height fill would be ~1:1)
    expect(elapsed / remaining).toBeGreaterThan(2.6);
    expect(elapsed / remaining).toBeLessThan(3.4);
  });

  test.prop([fc.double({ min: 0.05, max: 0.95, noNaN: true })])(
    "elapsed area fraction ≈ value (area-true across the range)",
    (value) => {
      const r = hourglassGeometry({ value, width: 16, height: 24, pad: 1 });
      const elapsed = pathArea(r.bottomSand);
      const remaining = pathArea(r.topSand);
      const frac = elapsed / (elapsed + remaining);
      expect(frac).toBeCloseTo(value, 1);
    },
  );
});
