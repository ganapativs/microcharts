import { describe, it, expect } from "vitest";
import { stepOpacity, valueStepOpacity, stepIndex, cellMetrics } from "./cell.js";

describe("stepOpacity", () => {
  it("level 0 is the faint empty track", () => {
    expect(stepOpacity(0, 5)).toBe(0.06);
  });

  it("spreads 0.25 → 1 across levels 1..steps-1", () => {
    expect(stepOpacity(1, 5)).toBeCloseTo(0.4375, 9);
    expect(stepOpacity(4, 5)).toBe(1);
  });

  it("steps === 1 does not divide by zero (calendar-strip steps={1})", () => {
    // step 0 keeps the empty-track look; a lone filled step is fully opaque
    expect(stepOpacity(0, 1)).toBe(0.06);
    expect(stepOpacity(1, 1)).toBe(1);
    expect(Number.isFinite(stepOpacity(1, 1))).toBe(true);
  });
});

describe("valueStepOpacity", () => {
  it("steps <= 1 → fully opaque (no divide by zero)", () => {
    expect(valueStepOpacity(0, 1)).toBe(1);
    expect(valueStepOpacity(1, 1)).toBe(1);
  });
});

describe("stepIndex", () => {
  it("zero-width domain → single mid step", () => {
    expect(stepIndex(5, 5, 5, 4)).toBe(2);
  });
  it("clamps to 0..steps-1", () => {
    expect(stepIndex(-100, 0, 10, 5)).toBe(0);
    expect(stepIndex(100, 0, 10, 5)).toBe(4);
  });
});

describe("cellMetrics", () => {
  it("square is crisp with rx 1", () => {
    expect(cellMetrics(10, "square")).toEqual({ inset: 0, rx: 1, crisp: true });
  });
  it("round/dot are not crisp", () => {
    expect(cellMetrics(10, "round").crisp).toBe(false);
    expect(cellMetrics(10, "dot").crisp).toBe(false);
  });
});
