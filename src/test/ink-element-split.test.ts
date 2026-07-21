// Cascade contract for valence/accent ink element-split.
// Both fill and stroke families use `:where()` (zero specificity), so source
// order is the only thing keeping dumbbell connectors / queue-depth breaches
// from being wiped to `stroke: none` by the fill rule.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(import.meta.dirname, "../../styles.css"), "utf8");

describe("ink element-split cascade (styles.css)", () => {
  it("stroked valence rules come after the generic fill rules", () => {
    const fillPos = css.indexOf(':where(.mc-root [data-mc-ink="positive"])');
    const strokePos = css.indexOf(':where(.mc-root :is(line, polyline)[data-mc-ink="positive"])');
    const pathOptIn = css.indexOf('path[data-mc-ink="positive"][fill="none"]');
    expect(fillPos).toBeGreaterThan(-1);
    expect(strokePos).toBeGreaterThan(fillPos);
    expect(pathOptIn).toBeGreaterThan(fillPos);
  });

  it("stroked rules do not target bare path (would wipe DepthWedge/NetFlow fills)", () => {
    // Forbidden: :is(path, line, polyline)[data-mc-ink="positive"] without [fill="none"]
    expect(css).not.toMatch(
      /:is\(\s*path\s*,\s*line\s*,\s*polyline\s*\)\[data-mc-ink="positive"\](?!\[fill)/,
    );
    expect(css).not.toMatch(
      /:is\(\s*path\s*,\s*line\s*,\s*polyline\s*\)\[data-mc-ink="negative"\](?!\[fill)/,
    );
  });

  it("chart-only table cells kill the font strut (line-height: 0)", () => {
    expect(css).toMatch(/td:has\(>\s*\.mc-root:only-child\)/);
    expect(css).toMatch(/td:has\(>\s*\[data-mc-host\]:only-child\)/);
    expect(css).toMatch(/td:has\(>\s*\[class\$="-live"\]:only-child\)/);
    expect(css).toMatch(/td:has\(>\s*\[class\$="-interactive"\]:only-child\)/);
  });
});
