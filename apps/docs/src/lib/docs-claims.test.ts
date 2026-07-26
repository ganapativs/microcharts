import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG, SIZE, BENCH, SIZE_MARKETING } from "./docs-facts";

// Guide MDX = the top-level docs pages (charts/** is owned by the chart shells).
const dir = resolve(process.cwd(), "content/docs");
const guides = readdirSync(dir)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => ({ f, src: readFileSync(resolve(dir, f), "utf8") }));
const bySrc = (name: string) => guides.find((g) => g.f === name)?.src ?? "";

// Literals that were true once and silently rotted. If any reappears, a claim
// has drifted from the measured catalog again — regenerate, don't hand-edit.
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  {
    pattern: /~?1\s*kB each/i,
    why: `false size claim — use "${SIZE_MARKETING}", not '1 kB each'`,
  },
  {
    pattern: /0\.95[–-]/,
    why: `stale size literal — marketing uses "${SIZE_MARKETING}"; measured mins live in performance.mdx`,
  },
  {
    pattern: /1–3\.9\s*kB/i,
    why: `stale rounded size span — use "${SIZE_MARKETING}" in marketing prose`,
  },
  {
    pattern: /~1–4\s*kB(?:\s+gzip)?(?!\s*static)/i,
    why: `stale static-only band — use "${SIZE_MARKETING}" (interactive first)`,
  },
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
    // Catalog-relative counts must stay derived, in every phrasing the guides use:
    //   "N chart types" / "N types"  → the total
    //   "the other N"                → total minus the one you imported
    // (2–3 digit only, so small unrelated numbers like "two types" don't match.)
    for (const { f, src } of guides) {
      for (const m of src.matchAll(/\b(\d{2,3})\s+(?:chart )?types\b/g)) {
        expect(Number(m[1]), `${f} quotes "${m[0]}"`).toBe(CATALOG.total);
      }
      for (const m of src.matchAll(/\bthe other (\d{2,3})\b/g)) {
        expect(Number(m[1]), `${f} quotes "${m[0]}"`).toBe(CATALOG.total - 1);
      }
    }
  });

  // performance.mdx quotes the precise measured size stats (min/max/median);
  // marketing guides use SIZE_MARKETING. Precise literals are hand-typed
  // (frontmatter/prose can't import docs-facts), so this test is what keeps
  // them from silently rotting — regenerate from SIZE, never hand-edit past a drift.
  it("performance.mdx quotes the precise measured size stats", () => {
    const src = bySrc("performance.mdx");
    expect(src).toContain(`${SIZE.interactiveMin} kB and ${SIZE.interactiveMax} kB`);
    expect(src).toContain(`median of ${SIZE.interactiveMedian} kB`);
    expect(src).toContain(`${SIZE.min} kB and ${SIZE.max} kB`);
    expect(src).toContain(`median of ${SIZE.median} kB`);
    const overBy = Math.round((SIZE.max - 3) * 100) / 100;
    expect(src).toContain(`more than ${overBy} kB`);
    expect(SIZE.over3).toHaveLength(25); // keep in lockstep with "Twenty-five charts" prose
  });

  it("index.mdx quotes the durable marketing size band", () => {
    const src = bySrc("index.mdx");
    expect(src).toContain(SIZE_MARKETING);
    expect(src).not.toMatch(/\d\.\d+–\d+(\.\d+)?\s*kB/);
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
