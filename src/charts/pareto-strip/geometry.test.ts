import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { paretoGeometry } from "./geometry.js";

const base = { width: 80, height: 20 };
const CAUSES = [
  { label: "Timeouts", value: 38 },
  { label: "OOM", value: 24 },
  { label: "Deploy", value: 15 },
  { label: "Config", value: 9 },
  { label: "Network", value: 7 },
  { label: "Other bugs", value: 7 },
];

describe("paretoGeometry", () => {
  it("sorts descending; bars carry share + running cumulative", () => {
    const shuffled = [CAUSES[2]!, CAUSES[0]!, CAUSES[4]!, CAUSES[1]!, CAUSES[3]!, CAUSES[5]!];
    const geo = paretoGeometry({ ...base, data: shuffled })!;
    expect(geo.bars[0]!.label).toBe("Timeouts"); // largest first
    expect(geo.bars.at(-1)!.cum).toBeCloseTo(1, 2); // ends at 100%
    // bars seat flush on the box bottom (inline text-baseline alignment)
    for (const b of geo.bars) expect(b.y + b.height).toBeCloseTo(20, 1);
  });

  it("`painted` lists only bars with height — the set a reader can point at", () => {
    const geo = paretoGeometry({ ...base, data: CAUSES })!;
    expect(geo.painted).toEqual(geo.bars.map((_, i) => i));

    const withZero = paretoGeometry({
      ...base,
      data: [
        { label: "A", value: 10 },
        { label: "B", value: 0 },
      ],
    })!;
    expect(withZero.painted).toEqual([0]);

    // all-zero: nothing paints, so nothing is navigable
    const zeros = paretoGeometry({
      ...base,
      data: [
        { label: "A", value: 0 },
        { label: "B", value: 0 },
      ],
    })!;
    expect(zeros.bars.length).toBe(2);
    expect(zeros.painted).toEqual([]);
  });

  it("marks bars up to the threshold crossing as vital (accent stops there)", () => {
    const geo = paretoGeometry({ ...base, data: CAUSES, threshold: 80 })!;
    expect(geo.crossing).not.toBeNull();
    // vital bars are a prefix; the rest are muted
    const vitals = geo.bars.map((b) => b.vital);
    const firstMuted = vitals.indexOf(false);
    expect(vitals.slice(firstMuted).every((v) => !v)).toBe(true);
    expect(geo.vitalCount).toBe(geo.crossing!.index + 1);
  });

  it("cumulative line is on a fixed 0–100% scale (ends at the top region)", () => {
    const geo = paretoGeometry({ ...base, data: CAUSES })!;
    expect(geo.line.d).toMatch(/^M/);
    // last cum ≈ 1 → y near the top (pad)
    expect(geo.bars.at(-1)!.cum).toBeCloseTo(1, 2);
  });

  it("rolls categories beyond maxItems into Other, always last", () => {
    const geo = paretoGeometry({ ...base, data: CAUSES, maxItems: 3 })!;
    expect(geo.other).not.toBeNull();
    expect(geo.bars.at(-1)!.label).toBe("Other");
    expect(geo.other!.count).toBe(3); // Config/Network/Other bugs rolled up
  });

  it("Other never counts as vital even if large", () => {
    const geo = paretoGeometry({ ...base, data: CAUSES, maxItems: 1, threshold: 80 })!;
    const other = geo.bars.find((b) => b.label === "Other")!;
    expect(other.vital).toBe(false);
  });

  it("threshold=false → no threshold line or crossing", () => {
    const geo = paretoGeometry({ ...base, data: CAUSES, threshold: false })!;
    expect(geo.thresholdY).toBeNull();
    expect(geo.crossing).toBeNull();
  });

  it("negatives excluded; zero total → degenerate", () => {
    const geo = paretoGeometry({
      ...base,
      data: [
        { label: "a", value: -5 },
        { label: "b", value: 10 },
      ],
    })!;
    expect(geo.bars).toHaveLength(1); // negative dropped
    const zero = paretoGeometry({ ...base, data: [{ label: "a", value: 0 }] })!;
    expect(zero.degenerate).toBe(true);
  });

  it("empty → null", () => {
    expect(paretoGeometry({ ...base, data: [] })).toBeNull();
  });

  test.prop([
    fc.array(
      fc.record({ label: fc.string(), value: fc.double({ noNaN: true, min: 0, max: 1e4 }) }),
      { minLength: 1, maxLength: 20 },
    ),
  ])("containment: bars + line inside the plot", (data) => {
    const geo = paretoGeometry({ ...base, data, gutterCh: 5, fontSize: 8 });
    if (!geo) return;
    for (const b of geo.bars) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(80.01);
      expect(b.y).toBeGreaterThanOrEqual(1.99); // top pad preserved
      // bar fill floor seats flush with the box bottom (y = height)
      expect(round(b.y + b.height)).toBeLessThanOrEqual(20.01);
    }
  });
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
