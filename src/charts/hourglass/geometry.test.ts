import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { hourglassGeometry, resolveGlassWidth, resolveHeight } from "./geometry.js";

const g = (value: number) => hourglassGeometry({ value, width: 16, height: 24, pad: 1 });

const fromPath = (d: string) => (d.match(/-?\d+\.?\d*/g) ?? []).map(Number);

/** Every coordinate the geometry emits, path commands flattened to numbers. */
function coordsOf(geo: ReturnType<typeof hourglassGeometry>): number[] {
  return [
    ...fromPath(geo.frame),
    ...fromPath(geo.topSand),
    ...fromPath(geo.bottomSand),
    ...geo.caps.flatMap((c) => [c.x, c.y, c.width, c.height, c.r]),
    ...(geo.stream ? [geo.stream.x, geo.stream.y1, geo.stream.y2] : []),
    geo.y0,
    geo.y1,
  ];
}

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

describe("hourglassGeometry — area-true sand", () => {
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

  it("the neck stream stays inside the glass at every size", () => {
    for (const height of [6, 8, 10, 12, 16, 24, 48, 200]) {
      const geo = hourglassGeometry({ value: 0.5, height, pad: 1 });
      // frame = "M{L} {glassTop}…Z" + "M{L} {glassBottom}…Z"
      const [glassTop, glassBottom] = [...geo.frame.matchAll(/M[\d.]+ ([\d.]+)/g)].map((m) =>
        Number(m[1]),
      );
      expect(geo.stream, `height ${height}`).not.toBeNull();
      // A fixed 5-unit cue ran past the viewBox floor under height 9 and past
      // the glass bottom under 14; both ends are chamber-relative now.
      expect(geo.stream!.y1, `height ${height}`).toBeGreaterThanOrEqual(glassTop!);
      expect(geo.stream!.y2, `height ${height}`).toBeLessThanOrEqual(glassBottom!);
    }
  });

  it("the tuned 24-unit glass is unchanged", () => {
    expect(g(0.5).stream).toEqual({ x: 8, y1: 11, y2: 16 });
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

describe("hourglassGeometry — a host-computed box", () => {
  it("falls back to the documented default rather than emitting NaN", () => {
    expect(resolveHeight(undefined)).toBe(24);
    expect(resolveHeight(NaN)).toBe(24);
    expect(resolveHeight(Infinity)).toBe(24);
    expect(resolveHeight(40)).toBe(40);
    // Under the chrome floor the cap plates cross the viewBox edge.
    expect(resolveHeight(0)).toBe(6);
    expect(resolveHeight(-20)).toBe(6);
    // Unset, the glass tracks height; set, it clears the plate overhang.
    expect(resolveGlassWidth(undefined, 24)).toBe(16);
    expect(resolveGlassWidth(NaN, 24)).toBe(16);
    expect(resolveGlassWidth(-20, 24)).toBe(4);
    expect(resolveGlassWidth(30, 24)).toBe(30);
  });

  it("keeps every coordinate finite and inside the resolved box", () => {
    for (const box of [
      { width: NaN, height: 24 },
      { width: Infinity, height: 24 },
      { width: -20, height: 24 },
      { width: 16, height: NaN },
      { width: 16, height: -20 },
      { width: 16, height: Infinity },
    ]) {
      const geo = hourglassGeometry({ value: 0.5, pad: 1, ...box });
      const height = resolveHeight(box.height);
      const width = resolveGlassWidth(box.width, height);
      for (const n of coordsOf(geo)) {
        expect(Number.isFinite(n), `${JSON.stringify(box)} emitted ${n}`).toBe(true);
        expect(n, `${JSON.stringify(box)}`).toBeGreaterThanOrEqual(0);
        expect(n, `${JSON.stringify(box)}`).toBeLessThanOrEqual(Math.max(width, height));
      }
    }
  });
});
