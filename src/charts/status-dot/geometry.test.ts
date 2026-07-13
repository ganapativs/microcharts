import { describe, expect, it } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { statusDotGeometry, type StatusGlyph } from "./geometry.js";

const GLYPHS: StatusGlyph[] = ["circle", "triangle", "diamond", "ring", "half"];

describe("statusDotGeometry", () => {
  it("every glyph renders a distinct silhouette (the a11y pairing contract)", () => {
    const marks = GLYPHS.map((glyph) => statusDotGeometry({ width: 8, height: 8, glyph }));
    const keys = marks.map((m) =>
      m.kind === "circle" ? `circle:${m.r}:${m.hollow}` : m.kind === "half" ? `half` : m.d,
    );
    expect(new Set(keys).size).toBe(GLYPHS.length);
  });

  test.prop([fc.integer({ min: 6, max: 48 }), fc.constantFrom(...GLYPHS)])(
    "marks stay inside the box, 2-dp (containment)",
    (size, glyph) => {
      const m = statusDotGeometry({ width: size, height: size, glyph });
      if (m.kind === "circle" || m.kind === "half") {
        expect(m.cx - m.r).toBeGreaterThanOrEqual(0);
        expect(m.cx + m.r).toBeLessThanOrEqual(size);
        expect(m.r).toBe(Math.round(m.r * 100) / 100);
      }
      const d = m.kind === "circle" ? "" : m.d;
      for (const match of d.matchAll(/-?\d+(?:\.\d+)?/g)) {
        const n = Number(match[0]);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(size);
      }
    },
  );
});
