// deltaModel is Delta's whole layout math — the only chart whose "geometry"
// is a display model rather than coordinates, and until now the only one whose
// pure unit went untested. Same node-project home as every geometry.test.ts.
import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { deltaModel } from "./index.js";

describe("deltaModel — value and derived ratio", () => {
  it("value alone is shown as-is (a fraction, formatted as percent)", () => {
    const m = deltaModel({ value: 0.124 });
    expect(m.shown).toBe(0.124);
    expect(m.display).toBe("+12.4%");
    expect(m.valence).toBe("pos");
    expect(m.glyphKey).toBe("up");
  });

  it("with `from`, shows the fractional change from it", () => {
    const m = deltaModel({ value: 128, from: 100 });
    expect(m.shown).toBeCloseTo(0.28);
    expect(m.display).toBe("+28%");
  });

  it("negative base still yields the direction the delta earned", () => {
    // value 50 from -100: delta +150, ratio 150/|-100| = 1.5
    const m = deltaModel({ value: 50, from: -100 });
    expect(m.shown).toBeCloseTo(1.5);
    expect(m.glyphKey).toBe("up");
  });

  it("from = 0 falls back to the raw delta (no division)", () => {
    const m = deltaModel({ value: 0.3, from: 0 });
    expect(m.shown).toBeCloseTo(0.3);
  });
});

describe("deltaModel — degenerate input", () => {
  it("NaN renders the em-dash form, flat glyph, no shown value", () => {
    const m = deltaModel({ value: Number.NaN });
    expect(m.display).toBe("—");
    expect(m.shown).toBeNull();
    expect(m.glyphKey).toBe("flat");
    expect(m.valence).toBe("flat");
  });

  it("a ratio that overflows is judged on the SHOWN number, not the delta", () => {
    // finite delta, infinite ratio — the painted number is the ratio
    const m = deltaModel({ value: 1, from: 1e-320 });
    expect(m.display).toBe("—");
    expect(m.shown).toBeNull();
  });

  it("±Infinity input takes the same em-dash path", () => {
    expect(deltaModel({ value: Number.POSITIVE_INFINITY }).display).toBe("—");
    expect(deltaModel({ value: Number.NEGATIVE_INFINITY }).display).toBe("—");
  });
});

describe("deltaModel — valence and glyph", () => {
  it("glyph follows direction; valence follows `positive`", () => {
    expect(deltaModel({ value: -0.08 }).glyphKey).toBe("down");
    expect(deltaModel({ value: -0.08 }).valence).toBe("neg");
    expect(deltaModel({ value: -0.08, positive: "down" }).valence).toBe("pos");
    expect(deltaModel({ value: -0.08, positive: "down" }).glyphKey).toBe("down");
  });

  it("an untyped `positive` value falls back to the documented default (up)", () => {
    const m = deltaModel({ value: 0.1, positive: "sideways" as never });
    expect(m.valence).toBe("pos");
  });

  it("zero is flat: rectangle glyph, flat wording", () => {
    const m = deltaModel({ value: 0 });
    expect(m.glyphKey).toBe("flat");
    expect(m.valence).toBe("flat");
    expect(m.display).toBe("0%");
  });

  it("a magnitude that rounds to 0% keeps the arrow it earned", () => {
    const m = deltaModel({ value: 0.0001 });
    expect(m.glyphKey).toBe("up");
    expect(m.display).toBe("+0%");
  });
});

describe("deltaModel — sign is this component's job", () => {
  it("a self-signing formatter cannot double the sign", () => {
    const m = deltaModel({ value: 0.07, format: { signDisplay: "always" } });
    expect(m.display).toBe("+7%");
    expect(m.display).not.toContain("++");
  });

  it("a custom format function's own minus is stripped from the magnitude", () => {
    const m = deltaModel({ value: -0.07, format: (n) => `${(n * 100).toFixed(1)} pp` });
    expect(m.display).toBe("−7.0 pp");
  });
});

describe("deltaModel — properties", () => {
  test.prop([fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e6, max: 1e6 })])(
    "display leads with the direction: +, −, or bare zero/dash",
    (value) => {
      const m = deltaModel({ value });
      if (m.shown === null) expect(m.display).toBe("—");
      else if (value > 0) expect(m.display.startsWith("+")).toBe(true);
      else if (value < 0) expect(m.display.startsWith("−")).toBe(true);
      else expect(/^[+−]/.test(m.display)).toBe(false);
    },
  );

  test.prop([fc.double(), fc.option(fc.double(), { nil: undefined })])(
    "shown is finite exactly when the display is not the em-dash",
    (value, from) => {
      const m = deltaModel({ value, from });
      expect(m.shown === null).toBe(m.display === "—");
      if (m.shown !== null) expect(Number.isFinite(m.shown)).toBe(true);
    },
  );
});
