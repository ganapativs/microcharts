import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BASE_TOKENS,
  PRESET_DARK_TWINS,
  ACCENTS,
  resolveTokens,
  serializeTokens,
} from "./token-export";

// token-export.ts mirrors two sources of truth: the library stylesheet
// (`../../styles.css`) for `--mc-*` defaults, dark twins, and preset dark twins;
// and the docs accent bundles (`src/app/global.css`). These tests parse both and
// fail if any mirrored value drifts, so a copied theme is always the real thing.

const lib = readFileSync(resolve(process.cwd(), "../../styles.css"), "utf8");
const docs = readFileSync(resolve(process.cwd(), "src/app/global.css"), "utf8");

function declarations(css: string, selectorPattern: RegExp): Record<string, string> {
  const match = css.match(selectorPattern);
  expect(match, `selector ${selectorPattern} present`).toBeTruthy();
  const out: Record<string, string> = {};
  for (const [, name, value] of match![1]!.matchAll(/(--mc-[\w-]+)\s*:\s*([^;]+);/g)) {
    out[name!] = value!.replace(/\s+/g, " ").trim();
  }
  return out;
}
function accentDecl(css: string, selectorPattern: RegExp): string {
  const match = css.match(selectorPattern);
  expect(match, `selector ${selectorPattern} present`).toBeTruthy();
  return match![1]!.match(/--accent\s*:\s*([^;]+);/)![1]!.trim();
}

const libLight = declarations(lib, /:where\(:root\)\s*\{([\s\S]*?)\n {2}\}/);
const libDark = declarations(lib, /:where\(\[data-mc-theme="dark"\]\)\s*\{([^}]*)\}/);

describe("BASE_TOKENS mirror the library stylesheet", () => {
  it.each(BASE_TOKENS)("$cssVar light matches styles.css", (t) => {
    expect(libLight[t.cssVar]).toBe(t.light);
  });
  it.each(BASE_TOKENS.filter((t) => t.dark))("$cssVar dark matches styles.css", (t) => {
    expect(libDark[t.cssVar]).toBe(t.dark);
  });
  it("covers every token declared in the library :root", () => {
    expect(new Set(BASE_TOKENS.map((t) => t.cssVar))).toEqual(new Set(Object.keys(libLight)));
  });
});

describe("PRESET_DARK_TWINS mirror the library dark twins", () => {
  it.each(Object.keys(PRESET_DARK_TWINS))("%s twin matches styles.css", (preset) => {
    const twin = declarations(
      lib,
      new RegExp(
        `:where\\(\\[data-mc-theme="dark"\\]\\[data-mc-preset="${preset}"\\]\\)\\s*\\{([^}]*)\\}`,
      ),
    );
    expect(PRESET_DARK_TWINS[preset]).toEqual(twin);
  });
});

describe("ACCENTS mirror the docs accent bundles", () => {
  it.each(ACCENTS.filter((a) => a.id !== "cobalt"))("$id light/dark match global.css", (a) => {
    expect(accentDecl(docs, new RegExp(`:root\\[data-accent="${a.id}"\\]\\s*\\{([^}]*)\\}`))).toBe(
      a.light,
    );
    expect(
      accentDecl(docs, new RegExp(`\\.dark\\[data-accent="${a.id}"\\]\\s*\\{([^}]*)\\}`)),
    ).toBe(a.dark);
  });
  it("cobalt matches the default (unscoped) accent in global.css", () => {
    expect(accentDecl(docs, /:root\s*\{([\s\S]*?--accent:[\s\S]*?)\n\}/)).toBe("#2f52d4");
  });
});

describe("serializeTokens", () => {
  const base = {
    preset: "modern",
    accent: null,
    mode: "both",
    include: "color",
    scope: ":root",
    format: "css",
    annotate: false,
  } as const;

  it("emits a :root block and a dark @media delta for modern", () => {
    const out = serializeTokens(base);
    expect(out).toContain(":root {");
    expect(out).toContain("--mc-stroke: #1a1917;");
    expect(out).toContain("@media (prefers-color-scheme: dark) {");
    expect(out).toContain("--mc-stroke: #eae9e6;");
    // --mc-band expression follows --mc-stroke, so it never appears in the delta
    expect(out).not.toMatch(/dark[\s\S]*--mc-band/);
  });

  it("light-only omits the dark block", () => {
    const out = serializeTokens({ ...base, mode: "light" });
    expect(out).not.toContain("@media");
  });

  it("dark-only flattens resolved dark values under the scope", () => {
    const out = serializeTokens({ ...base, mode: "dark" });
    expect(out).not.toContain("@media");
    expect(out).toContain("--mc-accent: #5ea1cf;");
  });

  it("an explicit accent wins in both modes", () => {
    const out = serializeTokens({ ...base, accent: "ember" });
    expect(out).toContain("--mc-accent: #c2410c;"); // light
    expect(out).toContain("--mc-accent: #f7924e;"); // dark delta
  });

  it("mono collapses valence to the ink in both modes", () => {
    const light = resolveTokens({ preset: "mono", accent: null, include: "color" }).light;
    const dark = resolveTokens({ preset: "mono", accent: null, include: "color" }).dark;
    expect(light.find((t) => t.cssVar === "--mc-positive")!.value).toBe("var(--mc-stroke)");
    expect(dark.find((t) => t.cssVar === "--mc-negative")!.value).toBe("var(--mc-stroke)");
  });

  it("eink resolves its dark twin, not the light-pinned ink", () => {
    const out = serializeTokens({ ...base, preset: "eink" });
    expect(out).toContain("--mc-stroke: #000000;"); // light pin
    expect(out).toContain("--mc-stroke: #ffffff;"); // dark twin
  });

  it("include:all adds geometry + motion tokens; color omits them", () => {
    expect(serializeTokens({ ...base, include: "all" })).toContain("--mc-easing:");
    expect(serializeTokens(base)).not.toContain("--mc-easing:");
  });

  it("respects a custom scope and JS format", () => {
    expect(serializeTokens({ ...base, scope: ".brand" })).toContain(".brand {");
    const js = serializeTokens({ ...base, format: "js" });
    expect(js).toContain("const lightTokens = {");
    expect(js).toContain('"--mc-stroke": "#1a1917",');
  });
});
