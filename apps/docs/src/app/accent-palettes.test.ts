import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENTS, CAT_VARS, deriveCatPalette } from "@/lib/token-export";

// The global picker re-hues the whole site's categorical charts through pure
// CSS: each [data-accent] bundle carries a defineTheme-derived --mc-cat-*
// palette, and each ink preset (mono/print/eink) carries its own in-family ramp
// that beats the accent. Those baked values must be the REAL library output —
// this test recomputes them via the shared `deriveCatPalette` engine (the same
// one the studio + home widget use) and fails on any drift.
//
// "ember" is the site default and writes no attribute — its derived palette
// lives in the base :root / .dark blocks and is checked separately below.

const css = readFileSync(resolve(process.cwd(), "src/app/global.css"), "utf8");
const NON_DEFAULT_ACCENTS = ACCENTS.filter((a) => a.id !== "ember");

/** Pull one selector block's declarations into a name→value map. */
function block(selector: string): Record<string, string> {
  const pattern = new RegExp(`${selector.replace(/[.[\]]/g, "\\$&")}\\s*\\{([^}]*)\\}`);
  const match = css.match(pattern);
  expect(match, `selector ${selector} present in global.css`).toBeTruthy();
  const out: Record<string, string> = {};
  for (const [, name, value] of match![1]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name!] = value!.trim();
  }
  return out;
}

describe("Ember (default) categorical palette is real defineTheme output", () => {
  // Ember is the site default and carries no attribute — its derived palette
  // lives in the base :root (light) and .dark (dark) blocks.
  const derived = deriveCatPalette("modern", "ember")!;
  const light = block(":root");
  const dark = block(".dark");

  it.each([...CAT_VARS])("ember light %s matches defineTheme", (cat) => {
    expect(light[cat]).toBe(derived.light[cat]);
  });
  it.each([...CAT_VARS])("ember dark %s matches defineTheme", (cat) => {
    expect(dark[cat]).toBe(derived.dark[cat]);
  });
});

describe("[data-accent] categorical palettes are real defineTheme output", () => {
  for (const a of NON_DEFAULT_ACCENTS) {
    const derived = deriveCatPalette("modern", a.id)!;
    const light = block(`:root[data-accent="${a.id}"]`);
    const dark = block(`.dark[data-accent="${a.id}"]`);

    it.each([...CAT_VARS])(`${a.id} light %s matches defineTheme`, (cat) => {
      expect(light[cat]).toBe(derived.light[cat]);
    });
    it.each([...CAT_VARS])(`${a.id} dark %s matches defineTheme`, (cat) => {
      expect(dark[cat]).toBe(derived.dark[cat]);
    });
  }
});

describe("ink-preset categorical ramps are real defineTheme output", () => {
  for (const preset of ["mono", "eink", "print"] as const) {
    const derived = deriveCatPalette(preset, null)!;
    // Doubled attribute selector — the deliberate specificity bump in global.css.
    const light = block(`:root[data-mc-preset="${preset}"][data-mc-preset="${preset}"]`);
    const dark = block(`.dark[data-mc-preset="${preset}"][data-mc-preset="${preset}"]`);

    it.each([...CAT_VARS])(`${preset} light %s matches defineTheme`, (cat) => {
      expect(light[cat]).toBe(derived.light[cat]);
    });
    it.each([...CAT_VARS])(`${preset} dark %s matches defineTheme`, (cat) => {
      expect(dark[cat]).toBe(derived.dark[cat]);
    });
  }
});
