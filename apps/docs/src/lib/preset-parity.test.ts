import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The library stylesheet is the single source for preset token bundles.
// global.css re-declares them at :root[data-mc-preset] specificity only because
// the docs' unlayered base --mc-* binding would beat the library's layered
// :where() rules. This test keeps the copies from diverging.

const lib = readFileSync(resolve(process.cwd(), "../../styles.css"), "utf8");
const docs = readFileSync(resolve(process.cwd(), "src/app/global.css"), "utf8");

const PRESETS = ["editorial", "mono", "vivid", "print", "eink"] as const;

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

  // print/eink are light-surface output contexts; both files carry a dark twin
  // that re-tunes the pinned ink so they stay legible on dark viewers. Keep the
  // twins in lockstep too. The library's same-element dark selector
  // `:where([data-mc-theme="dark"][data-mc-preset="X"])` is unique to the twin
  // block (its @media copy shares the twin's exact body), so anchor on it — the
  // light block's selector text would otherwise collide.
  const DARK_TWINS = ["print", "eink"] as const;
  it.each(DARK_TWINS)("%s dark twin declares identical --mc-* tokens in both files", (preset) => {
    const libTwin = declarations(
      lib,
      new RegExp(
        `:where\\(\\[data-mc-theme="dark"\\]\\[data-mc-preset="${preset}"\\]\\)\\s*\\{([^}]*)\\}`,
      ),
    );
    const docsTwin = declarations(
      docs,
      new RegExp(`:root\\.dark\\[data-mc-preset="${preset}"\\]\\s*\\{([^}]*)\\}`),
    );
    expect(docsTwin).toEqual(libTwin);
  });
});
