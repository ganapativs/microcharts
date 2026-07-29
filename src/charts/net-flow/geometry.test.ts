import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { netFlowGeometry, type NetFlowPeriod } from "./geometry.js";

const inside = (y: number) => y >= 1.99 && y <= 18.01;

const base = { width: 80, height: 20 };
const SAMPLE: NetFlowPeriod[] = [
  { in: 4, out: 3 },
  { in: 5, out: 4 },
  { in: 6, out: 4 },
  { in: 5, out: 6 },
  { in: 7, out: 5 },
];

describe("netFlowGeometry", () => {
  it("mirrors in above / out below one shared zero baseline", () => {
    const geo = netFlowGeometry({ ...base, data: SAMPLE })!;
    expect(geo.zeroY).toBe(10);
    // inflow area sits above the baseline, outflow below
    expect(geo.inArea.d).toMatch(/^M/);
    expect(geo.outArea.d).toMatch(/^M/);
    // a bigger inflow reaches higher (smaller y) than a smaller one, same scale
    const b = netFlowGeometry({ ...base, data: SAMPLE })!;
    expect(b.inBars[4]!.y).toBeLessThan(b.inBars[0]!.y); // in 7 taller than in 4
  });

  it("in and out share ONE scale (never independently balanced)", () => {
    const geo = netFlowGeometry({
      ...base,
      data: [
        { in: 10, out: 5 },
        { in: 5, out: 10 },
      ],
    })!;
    // in=10 up-height == out=10 down-height (symmetric magnitude scale)
    expect(geo.inBars[0]!.height).toBeCloseTo(geo.outBars[1]!.height, 5);
  });

  it("net line = in − out; last carries the signed net", () => {
    const geo = netFlowGeometry({ ...base, data: SAMPLE })!;
    expect(geo.last!.net).toBe(2); // 7 − 5
    expect(geo.netLine.d).toMatch(/^M/);
    expect(geo.netPositive).toBe(4); // only period 4 (5 vs 6) is net-negative
  });

  it("negative inputs are invalid → coerced to 0 (flows are magnitudes)", () => {
    const geo = netFlowGeometry({
      ...base,
      data: [
        { in: -5, out: 3 },
        { in: 4, out: -2 },
      ],
    })!;
    expect(geo.inBars[0]!.height).toBe(0); // in -5 → 0
    expect(geo.outBars[1]!.height).toBe(0); // out -2 → 0
  });

  it("all-zero → degenerate (baseline only, empty paths)", () => {
    const geo = netFlowGeometry({
      ...base,
      data: [
        { in: 0, out: 0 },
        { in: 0, out: 0 },
      ],
    })!;
    expect(geo.degenerate).toBe(true);
    expect(geo.inArea.d).toBe("");
    expect(geo.netLine.d).toBe("");
    expect(geo.last!.net).toBe(0);
  });

  it("single period → bars mode regardless of prop (no area through one point)", () => {
    const geo = netFlowGeometry({ ...base, data: [{ in: 6, out: 4 }], mode: "area" })!;
    expect(geo.mode).toBe("bars");
    expect(geo.inBars).toHaveLength(1);
    expect(geo.last!.net).toBe(2);
  });

  it("empty → null", () => {
    expect(netFlowGeometry({ ...base, data: [] })).toBeNull();
  });

  // `Chart` clamps the box it puts in the viewBox. Geometry laid its marks out
  // against the RAW prop, so a host that passed `Number(input)` from an empty
  // field painted NaN — or, for a negative width, x=-42 inside a valid
  // `viewBox="0 0 1 20"`, and `.mc-root` is overflow: visible.
  it.each([
    ["width NaN", { width: Number.NaN, height: 20 }],
    ["height NaN", { width: 80, height: Number.NaN }],
    ["width Infinity", { width: Number.POSITIVE_INFINITY, height: 20 }],
    ["negative width", { width: -40, height: 20 }],
    ["zero height", { width: 80, height: 0 }],
    ["height below 2*pad (the padded plot inverts)", { width: 80, height: 3 }],
  ])("clamps a hostile box: %s stays finite and inside the frame", (_name, box) => {
    const geo = netFlowGeometry({ ...box, data: SAMPLE })!;
    const w = Number.isFinite(box.width) && box.width > 0 ? box.width : 1;
    const h = Number.isFinite(box.height) && box.height > 0 ? box.height : 1;

    const coords = [...geo.inArea.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)];
    expect(coords.length).toBeGreaterThan(0);
    for (const m of coords) {
      const [x, y] = [Number(m[1]), Number(m[2])];
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(-0.01);
      expect(x).toBeLessThanOrEqual(w + 0.01);
      expect(y).toBeGreaterThanOrEqual(-0.01);
      expect(y).toBeLessThanOrEqual(h + 0.01);
    }
    for (const b of [...geo.inBars, ...geo.outBars]) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(w + 0.01);
      expect(b.y).toBeGreaterThanOrEqual(-0.01);
      expect(b.y + b.height).toBeLessThanOrEqual(h + 0.01);
    }
    expect(Number.isFinite(geo.yFor(1))).toBe(true);
  });

  // `Math.max(0, ...ins, ...outs)` threw RangeError here — the spread puts one
  // argument per period on the stack, and a long ledger crashed the render.
  it("a ledger past the spread's argument limit still scales", () => {
    const data = Array.from({ length: 150_000 }, (_, i) => ({ in: i % 97, out: i % 53 }));
    const geo = netFlowGeometry({ ...base, data })!;
    expect(geo.n).toBe(150_000);
    expect(geo.degenerate).toBe(false);
    expect(Number.isFinite(geo.last!.net)).toBe(true);
  });

  test.prop([
    fc.array(
      fc.record({
        in: fc.double({ noNaN: true, min: 0, max: 1e5 }),
        out: fc.double({ noNaN: true, min: 0, max: 1e5 }),
      }),
      { minLength: 1, maxLength: 40 },
    ),
  ])("containment: areas + net line + bars inside the plot", (data) => {
    const geo = netFlowGeometry({ ...base, data, gutterCh: 4, fontSize: 8 });
    if (!geo) return;
    for (const b of [...geo.inBars, ...geo.outBars]) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(80.01);
      expect(inside(b.y)).toBe(true);
      expect(inside(b.y + b.height)).toBe(true);
    }
    // net line y-coords parsed from the path stay in the plot
    const ys = [...geo.netLine.d.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((m) => Number(m[1]));
    for (const y of ys) expect(inside(y)).toBe(true);
  });
});
