// Guards the CSS-delivery escape hatch (scripts/gen-style-splits.mjs):
// the per-chart `@mc-chart <slug> … @mc-chart-end` markers hand-authored in
// styles.css must stay accurate as the file evolves — a stale/incorrect
// marker would silently ship a broken "one chart" CSS import.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { generateFromSource, unknownSlugs } from "../../scripts/gen-style-splits.mjs";

const root = resolve(import.meta.dirname, "../..");
const stylesSrc = readFileSync(resolve(root, "styles.css"), "utf8");
const chartsDir = resolve(root, "src/charts");

const { files, slugs } = generateFromSource(stylesSrc);

/** `files[name]` is always populated by generateFromSource for these keys;
 * this just satisfies noUncheckedIndexedAccess without weakening the type. */
function file(name: string): string {
  const content = files[name];
  if (content === undefined) throw new Error(`generateFromSource produced no file "${name}"`);
  return content;
}

/**
 * Reduces a CSS text to its "meaningful" lines for set comparison: strips
 * blank lines, `@mc-chart`/`@mc-chart-end` markers, `@layer microcharts.X {`
 * wrapper-open lines, and lone `}` lines (structural — their count
 * legitimately differs between styles.css and its split, since every
 * per-chart file re-declares its own `@layer` wrapper). What's left is
 * comments, selectors, and declarations — the actual rule content.
 */
function meaningfulLines(text: string, skipHeaderLines = 0): string[] {
  return text
    .split("\n")
    .slice(skipHeaderLines)
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .filter((l) => !/^\/\*\s*@mc-chart(-end)?\b.*\*\/$/.test(l))
    .filter((l) => !/^@layer\s+microcharts\.[a-z]+\s*\{$/.test(l))
    .filter((l) => l !== "}");
}

const normalize = (line: string) => line.replace(/\s+/g, " ").trim();

describe("styles.css @mc-chart markers → dist/styles split", () => {
  it("marks at least one chart, and every marked slug matches an existing src/charts dir", () => {
    expect(slugs.length).toBeGreaterThan(0);

    const knownChartDirs = readdirSync(chartsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    expect(unknownSlugs(slugs, knownChartDirs)).toEqual([]);
  });

  it("core.css + every <slug>.css together cover every rule in styles.css", () => {
    const sourceLines = meaningfulLines(stylesSrc).map(normalize).sort();
    const reconstructedLines = [
      ...meaningfulLines(file("core.css")),
      ...slugs.flatMap((slug) => meaningfulLines(file(`${slug}.css`), 2)),
    ]
      .map(normalize)
      .sort();

    expect(reconstructedLines).toEqual(sourceLines);
  });

  it("core.css contains no marked (single-chart) block content", () => {
    const coreLineSet = new Set(
      file("core.css")
        .split("\n")
        .map((l) => l.trim()),
    );

    for (const slug of slugs) {
      // Selector-opening lines from a chart's own split file are unique to
      // that chart's marked block (class names like .mc-progress-live are
      // chart-specific) — none of them should appear in the shared core.
      const selectorLines = meaningfulLines(file(`${slug}.css`), 2).filter((l) => l.endsWith("{"));
      expect(selectorLines.length).toBeGreaterThan(0);
      for (const selector of selectorLines) {
        expect(coreLineSet.has(selector)).toBe(false);
      }
    }
  });

  it("every generated file re-declares the @layer wrapper(s) its rules came from", () => {
    for (const slug of slugs) {
      expect(file(`${slug}.css`)).toMatch(/^@layer microcharts\.[a-z]+ \{/m);
    }
  });
});
