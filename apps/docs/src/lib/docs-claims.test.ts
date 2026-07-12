import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG, SIZE, BENCH } from "./docs-facts";

// Guide MDX = the top-level docs pages (charts/** is owned by the chart shells).
const dir = resolve(process.cwd(), "content/docs");
const guides = readdirSync(dir)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => ({ f, src: readFileSync(resolve(dir, f), "utf8") }));
const bySrc = (name: string) => guides.find((g) => g.f === name)?.src ?? "";
const round1 = (n: number) => Math.round(n * 10) / 10;

// Literals that were true once and silently rotted. If any reappears, a claim
// has drifted from the measured catalog again — regenerate, don't hand-edit.
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /~?1\s*kB each/i, why: "false size claim — sizes span ~0.9–3.6 kB" },
  { pattern: /\b98\s+charts\b/, why: "stale catalog count" },
  { pattern: /\b100\s+chart(?: type)?s?\b/, why: "stale catalog count" },
  { pattern: /^#+\s+The five\s*$/m, why: "heading mismatched its four-context grid" },
];

describe("docs guide claims stay true", () => {
  for (const { f, src } of guides) {
    for (const { pattern, why } of FORBIDDEN) {
      it(`${f}: no "${pattern.source}" (${why})`, () => {
        expect(src).not.toMatch(pattern);
      });
    }
  }

  it("the catalog count quoted in prose matches the registry", () => {
    // Every "<N> chart types" claim in the guides must be the real total.
    const claim = /\b(\d+)\s+chart types\b/g;
    for (const { f, src } of guides) {
      for (const m of src.matchAll(claim)) {
        expect(Number(m[1]), `${f} quotes "${m[0]}"`).toBe(CATALOG.total);
      }
    }
  });

  // performance.mdx quotes the precise measured size stats (min/max/median);
  // index.mdx quotes the same numbers rounded to one decimal for prose. Both
  // are hand-typed literals (frontmatter/prose can't import docs-facts), so
  // this test is what keeps them from silently rotting — regenerate the
  // literal from SIZE, never hand-edit past a drift.
  it("performance.mdx quotes the precise measured size stats", () => {
    const src = bySrc("performance.mdx");
    expect(src).toContain(`${SIZE.min} kB and ${SIZE.max} kB`);
    expect(src).toContain(`median of ${SIZE.median} kB`);
    // The interactive-entry median is hand-typed in prose too — guard it so it
    // can't silently drift from the measured value the way it did once before.
    expect(src).toContain(`median ${SIZE.interactiveMedian} kB`);
  });

  it("index.mdx quotes the size stats rounded to one decimal", () => {
    const src = bySrc("index.mdx");
    const min = round1(SIZE.min);
    const max = round1(SIZE.max);
    const median = round1(SIZE.median);
    expect(src).toContain(`${min}–${max} kB gzip`);
    expect(src).toContain(`median ${median}`);
  });

  it("performance.mdx quotes the measured per-chart SSR median in both frontmatter and body", () => {
    const src = bySrc("performance.mdx");
    const msPer = BENCH.medianMsPer;
    const occurrences = src.match(new RegExp(`${msPer}\\s*ms`, "g")) ?? [];
    // frontmatter description + body sentence — must agree, never drift apart.
    expect(occurrences.length, `expected 2 occurrences of "${msPer} ms"`).toBe(2);
  });

  it("performance.mdx quotes the measured describeSeries throughput, rounded", () => {
    const src = bySrc("performance.mdx");
    const claim = /roughly \*\*([\d,]+) calls per second\*\*/;
    const m = src.match(claim);
    expect(m, "expected a describeSeries throughput claim").not.toBeNull();
    const quoted = Number(m![1]!.replace(/,/g, ""));
    expect(quoted).toBe(BENCH.describeSeriesOpsPerSecRounded);
  });
});
