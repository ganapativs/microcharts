import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { dotPlotGeometry, truncateLabel } from "./geometry.js";

const base = { width: 60, height: 40, gutterCh: 5, fontSize: 6, stem: false };

describe("dotPlotGeometry", () => {
  it("one row per value; dots positioned on a shared scale", () => {
    const geo = dotPlotGeometry({ ...base, values: [10, 20, 30] });
    expect(geo.rows.length).toBe(3);
    expect(geo.rows[0]!.x!).toBeLessThan(geo.rows[1]!.x!);
    expect(geo.rows[1]!.x!).toBeLessThan(geo.rows[2]!.x!);
  });

  it("stem forces the domain through zero (magnitude read)", () => {
    const plain = dotPlotGeometry({ ...base, values: [50, 60] });
    const stemmed = dotPlotGeometry({ ...base, stem: true, values: [50, 60] });
    // data-fit: 50 sits at the left edge; zero-anchored: 50 sits mid-plot
    expect(stemmed.rows[0]!.x!).toBeGreaterThan(plain.rows[0]!.x!);
    expect(stemmed.zeroX).toBe(stemmed.x0);
  });

  it("coincident dots on adjacent rows de-overlap by 0.5 units (deterministic)", () => {
    const geo = dotPlotGeometry({ ...base, values: [50, 50] });
    expect(geo.rows[1]!.nudge).toBe(0.5);
    const spread = dotPlotGeometry({ ...base, values: [10, 90] });
    expect(spread.rows[1]!.nudge).toBe(0);
  });

  it("null values keep their row (no dot)", () => {
    const geo = dotPlotGeometry({ ...base, values: [5, null, 9] });
    expect(geo.rows[1]!.x).toBeNull();
    expect(geo.rows.length).toBe(3);
  });

  it("truncateLabel cuts by character count, never measures", () => {
    expect(truncateLabel("Berlin")).toBe("Berlin");
    expect(truncateLabel("Amsterdam")).toBe("Amster…");
  });

  test.prop([
    fc.array(fc.option(fc.double({ noNaN: true, min: -1e4, max: 1e4 }), { nil: null }), {
      minLength: 1,
      maxLength: 7,
    }),
    fc.boolean(),
  ])("containment: dots + labels inside the box", (values, stem) => {
    const geo = dotPlotGeometry({ ...base, values, stem });
    for (const row of geo.rows) {
      if (row.x !== null) {
        expect(row.x).toBeGreaterThanOrEqual(geo.x0 - 0.01);
        expect(row.x).toBeLessThanOrEqual(geo.x1 + 0.01);
      }
      expect(row.y).toBeGreaterThanOrEqual(0);
      expect(row.y).toBeLessThanOrEqual(40);
    }
    expect(geo.labelX).toBeGreaterThanOrEqual(0);
    expect(geo.labelX).toBeLessThan(geo.x0);
  });
});
