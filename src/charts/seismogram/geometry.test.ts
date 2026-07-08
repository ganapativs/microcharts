import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { seismogramGeometry } from "./geometry.js";

const base = { width: 60, height: 16, mode: "intensity" as const };

describe("seismogramGeometry (plan/22 #8)", () => {
  it("all-positive → baseline at the bottom edge; ticks rise from it", () => {
    const geo = seismogramGeometry({ ...base, values: [0, 3, 0, 8, 1] });
    expect(geo.baselineY).toBe(15.5);
    for (const t of geo.ticks) expect(t.y1).toBe(geo.baselineY);
    expect(geo.ticks.length).toBe(3); // zeros are quiet
  });

  it("signed data → auto-centered baseline, ticks both ways", () => {
    const geo = seismogramGeometry({ ...base, values: [4, -4] });
    const up = geo.ticks[0]!;
    const down = geo.ticks[1]!;
    expect(up.y0).toBeLessThan(geo.baselineY);
    expect(down.y1).toBeGreaterThan(geo.baselineY);
    expect(geo.dNeg).not.toBe("");
  });

  it("a single spike among zeros renders at FULL height (the chart's whole job)", () => {
    const values = [
      ...Array.from({ length: 40 }, () => 0),
      8,
      ...Array.from({ length: 40 }, () => 0),
    ];
    const geo = seismogramGeometry({ ...base, values });
    expect(geo.ticks.length).toBe(1);
    expect(geo.ticks[0]!.y0).toBe(0.5); // tip at the top pad
    expect(geo.ticks[0]!.y1).toBe(geo.baselineY);
  });

  it("long series collapse via max-per-bucket — the spike survives", () => {
    const values = Array.from({ length: 500 }, (_, i) => (i === 250 ? 9 : i % 7 === 0 ? 1 : 0));
    const geo = seismogramGeometry({ ...base, values });
    expect(geo.downsampled).toBe(true);
    expect(Math.max(...geo.ticks.map((t) => Math.abs(t.v)))).toBe(9);
    expect(geo.ticks.every((t) => t.x <= 60)).toBe(true);
  });

  it("barcode mode → uniform full-length ticks (presence only)", () => {
    const geo = seismogramGeometry({ ...base, mode: "barcode", values: [1, 8, 3] });
    const tips = new Set(geo.ticks.map((t) => t.y0));
    expect(tips.size).toBe(1);
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      maxLength: 200,
    }),
    fc.constantFrom<"intensity" | "barcode">("intensity", "barcode"),
  ])("containment: every tick inside the box, 2-dp", (values, mode) => {
    const geo = seismogramGeometry({ width: 60, height: 16, values, mode });
    for (const t of geo.ticks) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.x).toBeLessThanOrEqual(60);
      expect(t.y0).toBeGreaterThanOrEqual(0);
      expect(t.y1).toBeLessThanOrEqual(16);
      expect(t.y0).toBeLessThanOrEqual(t.y1);
    }
  });
});
