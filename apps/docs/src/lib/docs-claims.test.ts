import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG } from "./docs-facts";

// Guide MDX = the top-level docs pages (charts/** is owned by the chart shells).
const dir = resolve(process.cwd(), "content/docs");
const guides = readdirSync(dir)
  .filter((f) => f.endsWith(".mdx"))
  .map((f) => ({ f, src: readFileSync(resolve(dir, f), "utf8") }));

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
});
