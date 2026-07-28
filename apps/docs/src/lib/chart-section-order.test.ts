import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Every chart page answers the same questions in the same order, so a reader who
// has read one knows where to look on the other 105 — and so an agent scraping
// the `.md` mirrors can rely on the shape. Nothing enforced it before, and three
// pages had quietly drifted (polar-clock and star-spoke put "Why this default"
// before "Edge cases"; spiral-year swapped "Sizing" and "Variants").
//
// The order is RELATIVE: a page may add its own sections wherever they belong
// ("Motion, and reduced motion", "Reading the barb", "The state contract"), and
// several do. What it may not do is reshuffle the ten it shares with every other
// page, or drop one.
// "Why this default" was dissolved in the 2026-07 voice pass: its
// behavior-relevant rationale folded into each page's opener or Edge cases,
// so it is no longer part of the shared shape.
const CANONICAL = [
  "Install",
  "Try it",
  "When to use it",
  "Sizing",
  "Variants",
  "Edge cases",
  "Four homes",
  "Accessibility",
  "Props",
] as const;

const chartsDir = resolve(process.cwd(), "content/docs/charts");

/** Every chart page's slug — the index is the chooser, not a chart. */
const pages = readdirSync(chartsDir)
  .filter((f) => f.endsWith(".mdx") && f !== "index.mdx")
  .map((f) => f.slice(0, -".mdx".length))
  .sort();

/** Top-level (`##`) headings, in document order, ignoring fenced code. */
function sections(slug: string): string[] {
  const src = readFileSync(join(chartsDir, `${slug}.mdx`), "utf8");
  const out: string[] = [];
  let inFence = false;
  for (const line of src.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    else if (!inFence && line.startsWith("## ")) out.push(line.slice(3).trim());
  }
  return out;
}

describe("chart page section order", () => {
  it("finds every chart page", () => {
    expect(pages.length).toBeGreaterThan(100);
  });

  it.each(pages)("%s", (slug) => {
    const found = sections(slug);
    const canonical = found.filter((h) => (CANONICAL as readonly string[]).includes(h));

    // all ten present, exactly once each
    expect(canonical, `${slug} is missing or repeats a canonical section`).toEqual(
      expect.arrayContaining([...CANONICAL]),
    );
    expect(canonical.length, `${slug} repeats a canonical section`).toBe(CANONICAL.length);

    // …and in the canonical relative order (extras may sit anywhere)
    expect(canonical, `${slug} reorders the shared sections`).toEqual([...CANONICAL]);
  });
});
