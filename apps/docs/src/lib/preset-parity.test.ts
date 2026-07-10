import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The library stylesheet is the single source for preset token bundles.
// global.css re-declares them at :root[data-mc-preset] specificity only because
// the docs' unlayered base --mc-* binding would beat the library's layered
// :where() rules. This test keeps the copies from diverging.

const lib = readFileSync(resolve(process.cwd(), "../../styles.css"), "utf8");
const docs = readFileSync(resolve(process.cwd(), "src/app/global.css"), "utf8");

const PRESETS = ["editorial", "mono", "vivid"] as const;

/** Extract `--mc-*: value` declarations from the block whose selector matches. */
function declarations(css: string, selectorPattern: RegExp): Record<string, string> {
  const match = css.match(selectorPattern);
  expect(match, `selector ${selectorPattern} present`).toBeTruthy();
  const body = match![1]!;
  const out: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--mc-[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name!] = value!.replace(/\s+/g, " ").trim();
  }
  return out;
}

describe("preset parity — docs mirrors the library bundles", () => {
  it.each(PRESETS)("%s declares identical --mc-* tokens in both files", (preset) => {
    const libBlock = declarations(
      lib,
      new RegExp(`:where\\(\\[data-mc-theme="${preset}"\\][^)]*\\)\\s*\\{([^}]*)\\}`),
    );
    const docsBlock = declarations(
      docs,
      new RegExp(`:root\\[data-mc-preset="${preset}"\\]\\s*\\{([^}]*)\\}`),
    );
    expect(docsBlock).toEqual(libBlock);
  });

  it("library preset blocks answer to both data-mc-theme and data-mc-preset", () => {
    for (const preset of PRESETS) {
      expect(lib).toMatch(
        new RegExp(`\\[data-mc-theme="${preset}"\\],\\s*\\[data-mc-preset="${preset}"\\]`),
      );
    }
  });
});
