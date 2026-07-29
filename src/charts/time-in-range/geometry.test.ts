import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { presentZones, timeInRangeGeometry, zonePercents, ZONE_ORDER } from "./geometry.js";

describe("timeInRangeGeometry", () => {
  it("zones tile the strip in fixed semantic order", () => {
    const geo = timeInRangeGeometry({
      data: { below: 9, in: 72, above: 19 },
      width: 80,
      height: 12,
      orientation: "horizontal",
    });
    expect(geo.zones.map((z) => z.key)).toEqual(["below", "in", "above"]);
    // in-range is the widest
    const inZone = geo.zones.find((z) => z.key === "in")!;
    expect(inZone.width).toBeGreaterThan(geo.zones[0]!.width);
    const end = geo.zones.at(-1)!;
    expect(end.x + end.width).toBeLessThanOrEqual(80.01);
  });

  it("order is never sorted by size — small zone can lead", () => {
    const geo = timeInRangeGeometry({
      data: { severeBelow: 1, below: 4, in: 90, above: 4, severeAbove: 1 },
      width: 80,
      height: 12,
      orientation: "horizontal",
    });
    expect(geo.zones.map((z) => z.key)).toEqual(ZONE_ORDER as string[]);
    // ascending x — positional, not magnitude
    for (let i = 1; i < geo.zones.length; i++) {
      expect(geo.zones[i]!.x).toBeGreaterThan(geo.zones[i - 1]!.x);
    }
  });

  it("vertical stacks severe-low at the bottom, severe-high on top", () => {
    const geo = timeInRangeGeometry({
      data: { severeBelow: 10, below: 10, in: 60, above: 10, severeAbove: 10 },
      width: 12,
      height: 80,
      orientation: "vertical",
    });
    const low = geo.zones.find((z) => z.key === "severeBelow")!;
    const high = geo.zones.find((z) => z.key === "severeAbove")!;
    expect(low.y).toBeGreaterThan(high.y);
  });

  it("all zeros → empty", () => {
    const geo = timeInRangeGeometry({
      data: { below: 0, in: 0, above: 0 },
      width: 80,
      height: 12,
      orientation: "horizontal",
    });
    expect(geo.zones.length).toBe(0);
  });

  it("a total past the double range still tiles and still sums to 100", () => {
    // Three zones at 1e308 summed to Infinity, every share came back 0, and the
    // chart painted a blank strip under an aria-label reading "1% / 1% / 1%".
    const data = { below: 1e308, in: 1e308, above: 1e308 };
    const { values } = presentZones(data);
    expect(values.every((v) => Number.isFinite(v) && v > 0)).toBe(true);
    expect(zonePercents(values).reduce((a, b) => a + b)).toBe(100);
    const geo = timeInRangeGeometry({ data, width: 80, height: 12, orientation: "horizontal" });
    expect(geo.zones.length).toBe(3);
    for (const z of geo.zones) expect(z.width).toBeGreaterThan(0);
  });

  it("presentZones is the single source of which zones are present", () => {
    const { keys } = presentZones({
      severeBelow: NaN,
      below: 0,
      in: 72,
      above: 19,
      severeAbove: Infinity,
    });
    expect(keys).toEqual(["in", "above"]);
  });

  it("a box too small to draw in emits no negative rect side", () => {
    // A rect with a negative height is an SVG error the browser drops, so the
    // zones vanished rather than degrading.
    for (const height of [0, 1, 2]) {
      const geo = timeInRangeGeometry({
        data: { below: 9, in: 72, above: 19 },
        width: 80,
        height,
        orientation: "horizontal",
      });
      for (const z of geo.zones) expect(z.height).toBeGreaterThanOrEqual(0);
    }
  });

  it("gaps never push a zone past the frame on a strip too short to seat them", () => {
    // The separators used to be taken off the top: below ~4 units the zone
    // lengths were 0 and `pos` advanced on gap alone, parking the trailing
    // zones outside the viewBox.
    const data = { severeBelow: 2, below: 7, in: 72, above: 15, severeAbove: 4 };
    for (const width of [1, 2, 3, 4, 6]) {
      const geo = timeInRangeGeometry({ data, width, height: 12, orientation: "horizontal" });
      for (const z of geo.zones) {
        expect(z.x).toBeGreaterThanOrEqual(0);
        expect(z.x + z.width).toBeLessThanOrEqual(width + 0.01);
      }
    }
  });

  it("zonePercents sum to exactly 100", () => {
    expect(zonePercents([9, 72, 19]).reduce((a, b) => a + b)).toBe(100);
    expect(zonePercents([1, 1, 1]).reduce((a, b) => a + b)).toBe(100);
  });

  test.prop([
    fc.record({
      below: fc.double({ min: 0, max: 1e4, noNaN: true }),
      in: fc.double({ min: 0.01, max: 1e4, noNaN: true }),
      above: fc.double({ min: 0, max: 1e4, noNaN: true }),
    }),
  ])("containment: every zone inside the viewBox", (data) => {
    const geo = timeInRangeGeometry({ data, width: 80, height: 12, orientation: "horizontal" });
    for (const z of geo.zones) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.x + z.width).toBeLessThanOrEqual(80.01);
      expect(z.y + z.height).toBeLessThanOrEqual(12.01);
    }
  });
});
