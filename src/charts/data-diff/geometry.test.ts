import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dataDiffGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
const DIFF = [
  { key: "users", added: 340, removed: 120 },
  { key: "orders", added: 88, removed: 30 },
  { key: "items", added: 40, removed: 20 },
  { key: "tags", added: 24, removed: 8 },
  { key: "notes", added: 12, removed: 6 },
  { key: "flags", added: 8, removed: 3 },
];

describe("dataDiffGeometry (plan/23 #16)", () => {
  it("both directions always drawn on one symmetric shared scale", () => {
    const geo = dataDiffGeometry({ ...base, data: DIFF })!;
    expect(geo.rows.length).toBe(6);
    // every row with a magnitude renders BOTH bars (added right, removed left)
    for (const r of geo.rows) {
      expect(r.added.width).toBeGreaterThan(0);
      expect(r.removed.width).toBeGreaterThan(0);
      expect(r.added.x).toBe(geo.centerX);
      expect(r.removed.x).toBeLessThanOrEqual(geo.centerX);
    }
    // the biggest magnitude (users added 340) maps to the full half-width
    const half = geo.centerX - 2;
    expect(geo.rows[0]!.added.width).toBeCloseTo(half, 0);
  });

  it("churn never looks like a trickle — a +500/−480 row towers over +20/−0", () => {
    const geo = dataDiffGeometry({
      ...base,
      data: [
        { key: "churn", added: 500, removed: 480 },
        { key: "trickle", added: 20, removed: 0 },
      ],
    })!;
    // both churn bars are near full half-width; trickle's added is tiny
    expect(geo.rows[0]!.added.width).toBeGreaterThan(geo.rows[1]!.added.width * 5);
    expect(geo.rows[0]!.removed.width).toBeGreaterThan(0);
    expect(geo.rows[1]!.removed.width).toBe(0);
  });

  it("totals sum all rows (not just the shown cap)", () => {
    const geo = dataDiffGeometry({ ...base, data: DIFF })!;
    expect(geo.totals.added).toBe(340 + 88 + 40 + 24 + 12 + 8);
    expect(geo.totals.removed).toBe(120 + 30 + 20 + 8 + 6 + 3);
  });

  it("largest change is by |net|, signed", () => {
    const geo = dataDiffGeometry({ ...base, data: DIFF })!;
    expect(geo.largest).toEqual({ key: "users", net: 220 });
  });

  it("negatives are magnitudes → clamped to 0 (never invert a bar)", () => {
    const geo = dataDiffGeometry({
      ...base,
      data: [{ key: "bad", added: -5, removed: 10 }],
    })!;
    expect(geo.rows[0]!.added.width).toBe(0);
    expect(geo.rows[0]!.removed.width).toBeGreaterThan(0);
    expect(geo.rows[0]!.net).toBe(-10);
  });

  it("a 0/0 key stays visible as a placeholder (absence of change ≠ absent key)", () => {
    const geo = dataDiffGeometry({
      ...base,
      data: [
        { key: "changed", added: 10, removed: 4 },
        { key: "same", added: 0, removed: 0 },
      ],
    })!;
    expect(geo.rows[1]!.placeholder).toBe(true);
    expect(geo.rows[1]!.added.width).toBe(0);
    expect(geo.rows[1]!.removed.width).toBe(0);
  });

  it("all-zero data → degenerate, no largest", () => {
    const geo = dataDiffGeometry({
      ...base,
      data: [{ key: "a", added: 0, removed: 0 }],
    })!;
    expect(geo.degenerate).toBe(true);
    expect(geo.largest).toBeNull();
  });

  it("sort='net' orders by descending net; 'none' keeps input order", () => {
    const data = [
      { key: "a", added: 10, removed: 8 }, // net +2
      { key: "b", added: 50, removed: 5 }, // net +45
      { key: "c", added: 5, removed: 30 }, // net −25
    ];
    const none = dataDiffGeometry({ ...base, data, sort: "none" })!;
    expect(none.rows.map((r) => r.key)).toEqual(["a", "b", "c"]);
    const net = dataDiffGeometry({ ...base, data, sort: "net" })!;
    expect(net.rows.map((r) => r.key)).toEqual(["b", "a", "c"]);
    const mag = dataDiffGeometry({ ...base, data, sort: "magnitude" })!;
    expect(mag.rows.map((r) => r.key)).toEqual(["b", "c", "a"]);
  });

  it("caps at 12 rows, never silently more", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      key: `k${i}`,
      added: 20 - i,
      removed: i,
    }));
    const geo = dataDiffGeometry({ ...base, data: many })!;
    expect(geo.rows.length).toBe(12);
    // totals still reflect ALL input rows
    expect(geo.totals.added).toBe(many.reduce((s, d) => s + d.added, 0));
  });

  it("empty → null", () => {
    expect(dataDiffGeometry({ ...base, data: [] })).toBeNull();
  });

  it("domain override fixes the shared scale (cross-chart comparison)", () => {
    const small = dataDiffGeometry({
      ...base,
      data: [{ key: "a", added: 10, removed: 0 }],
      domain: [0, 100],
    })!;
    // 10 of a 100-domain half-width, not full
    const half = small.centerX - 2;
    expect(small.rows[0]!.added.width).toBeCloseTo(half * 0.1, 1);
  });

  test.prop([
    fc.array(
      fc.record({
        key: fc.string({ minLength: 1, maxLength: 4 }),
        added: fc.integer({ min: 0, max: 1000 }),
        removed: fc.integer({ min: 0, max: 1000 }),
      }),
      { minLength: 1, maxLength: 12 },
    ),
  ])("bars never escape the plot and net = added − removed", (data) => {
    const geo = dataDiffGeometry({ ...base, data })!;
    for (const r of geo.rows) {
      expect(r.removed.x).toBeGreaterThanOrEqual(0);
      expect(r.added.x + r.added.width).toBeLessThanOrEqual(base.width + 0.01);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y + r.height).toBeLessThanOrEqual(base.height + 0.01);
      expect(r.net).toBe(r.addedValue - r.removedValue);
    }
  });
});
