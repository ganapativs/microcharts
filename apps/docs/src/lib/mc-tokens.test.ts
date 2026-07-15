import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SEMANTIC_TOKENS, CATEGORICAL_TOKENS, PRESETS } from "./mc-tokens";

// The library stylesheet is the single source of truth for the shipped `--mc-*`
// values. `mc-tokens.ts` mirrors them so the theming page can paint swatches
// without a live (docs-tinted) `getComputedStyle` read. This test fails the
// moment a mirrored value drifts from styles.css.

const lib = readFileSync(resolve(process.cwd(), "../../styles.css"), "utf8");

/** Extract `--mc-*: value` declarations from the block whose selector matches. */
function declarations(selectorPattern: RegExp): Record<string, string> {
  const match = lib.match(selectorPattern);
  expect(match, `selector ${selectorPattern} present in styles.css`).toBeTruthy();
  const out: Record<string, string> = {};
  for (const [, name, value] of match![1]!.matchAll(/(--mc-[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name!] = value!.replace(/\s+/g, " ").trim();
  }
  return out;
}

// Library light defaults live in the base `:where(:root) { ... }` block (the
// first one — a second, identical selector sits inside the dark media query);
// the dark twins live in `:where([data-mc-theme="dark"]) { ... }`.
const light = declarations(/:where\(:root\)\s*\{([\s\S]*?)\n {2}\}/);
const dark = declarations(/:where\(\[data-mc-theme="dark"\]\)\s*\{([^}]*)\}/);

describe("mc-tokens mirrors the library stylesheet", () => {
  it.each([...SEMANTIC_TOKENS, ...CATEGORICAL_TOKENS])("$cssVar light matches styles.css", (t) => {
    if (t.cssVar === "--mc-band") {
      // Derived: library keeps it as an expression over --mc-stroke; our mirror
      // substitutes the resolved stroke hex. Assert the library shape + that our
      // substitution used the real stroke value.
      expect(light["--mc-band"]).toBe("color-mix(in oklab, var(--mc-stroke) 8%, transparent)");
      const stroke = SEMANTIC_TOKENS.find((s) => s.cssVar === "--mc-stroke")!;
      expect(t.light).toBe(`color-mix(in oklab, ${stroke.light} 8%, transparent)`);
      return;
    }
    expect(light[t.cssVar]).toBe(t.light);
  });

  it.each([...SEMANTIC_TOKENS, ...CATEGORICAL_TOKENS])("$cssVar dark matches styles.css", (t) => {
    if (t.cssVar === "--mc-band") {
      const stroke = SEMANTIC_TOKENS.find((s) => s.cssVar === "--mc-stroke")!;
      expect(t.dark).toBe(`color-mix(in oklab, ${stroke.dark} 8%, transparent)`);
      return;
    }
    expect(dark[t.cssVar]).toBe(t.dark);
  });

  it.each(PRESETS.filter((p) => p.changes.length > 0))(
    "$id preset deltas match styles.css",
    (p) => {
      const block = declarations(
        new RegExp(`\\[data-mc-theme="${p.id}"\\][^)]*\\)\\s*\\{([^}]*)\\}`),
      );
      for (const change of p.changes) {
        expect(block[change.cssVar], `${p.id} ${change.cssVar}`).toBe(change.value);
      }
      // Bidirectional: every delta the library declares must be documented, so a
      // preset that quietly retunes an extra token (e.g. mono → --mc-moon) can't
      // slip past the swatch table. Guards the under-reporting direction the
      // per-change loop above can't see.
      expect(Object.keys(block).sort(), `${p.id} documented deltas match styles.css`).toEqual(
        p.changes.map((c) => c.cssVar).sort(),
      );
    },
  );
});
