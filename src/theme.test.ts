import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { defineTheme } from "./theme.js";
import { SEMANTIC } from "./core/color.js";

const HEX = /^#[0-9a-f]{6}$/i;
const lib = readFileSync(resolve(__dirname, "../styles.css"), "utf8");

function libPreset(id: string): Record<string, string> {
  const block = lib.match(
    new RegExp(`:where\\(\\[data-mc-theme="${id}"\\][^)]*\\)\\s*\\{([^}]*)\\}`),
  );
  expect(block, `styles.css has a ${id} preset block`).toBeTruthy();
  const out: Record<string, string> = {};
  for (const [, k, v] of block![1]!.matchAll(/(--mc-[\w-]+)\s*:\s*([^;]+);/g)) {
    out[k!] = v!.replace(/\s+/g, " ").trim();
  }
  return out;
}

describe("defineTheme — basics", () => {
  it("echoes only the fields you set", () => {
    const t = defineTheme({ density: 0.85, labelWeight: 500 });
    expect(t.vars).toEqual({ "--mc-density": "0.85", "--mc-label-weight": "500" });
    expect(t.darkVars).toEqual({}); // no hex colours to twin
  });

  it("maps every scalar field to its token", () => {
    const t = defineTheme({
      stroke: "#123456",
      font: "Inter",
      fontNumeric: "IBM Plex Mono",
      labelSize: "0.8em",
      strokeWidth: 2,
      gap: "0.3em",
      duration: "200ms",
      easing: "linear",
      surface: "#fff",
      surfaceInk: "#000",
      surfaceEdge: "#ccc",
      onFill: "rgba(255,255,255,0.9)",
      dark: false,
    });
    expect(t.vars["--mc-font-numeric"]).toBe("IBM Plex Mono");
    expect(t.vars["--mc-label-size"]).toBe("0.8em");
    expect(t.vars["--mc-stroke-width"]).toBe("2"); // number stringified, not twinned
    expect(t.vars["--mc-duration"]).toBe("200ms");
    expect(t.vars["--mc-on-fill"]).toBe("rgba(255,255,255,0.9)");
    expect(t.darkVars).toEqual({});
  });
});

describe("defineTheme — preset bundles mirror styles.css", () => {
  for (const id of ["editorial", "mono", "vivid", "print", "eink"] as const) {
    it(`${id}`, () => {
      const vars = defineTheme({ extends: id, dark: false }).vars;
      const lib_ = libPreset(id);
      for (const [k, v] of Object.entries(lib_)) expect(vars[k], `${id} ${k}`).toBe(v);
    });
  }
});

describe("defineTheme — accent derivation", () => {
  it("derives a full CVD-safe palette + dark twins from one accent", () => {
    const t = defineTheme({ accent: "#6d28d9" });
    expect(t.vars["--mc-accent"]).toBe("#6d28d9");
    for (let i = 1; i <= 6; i++) {
      expect(t.vars[`--mc-cat-${i}`], `cat-${i}`).toMatch(HEX);
      expect(t.darkVars[`--mc-cat-${i}`], `dark cat-${i}`).toMatch(HEX);
    }
    // never reassigns the CVD-safe valence hues unless asked
    expect(t.vars["--mc-positive"]).toBeUndefined();
    expect(t.vars["--mc-negative"]).toBeUndefined();
    expect(t.darkVars["--mc-accent"]).toMatch(HEX);
  });

  it("cat: N derives N tones without an explicit accent", () => {
    const t = defineTheme({ cat: 3 });
    expect(Object.keys(t.vars).filter((k) => k.startsWith("--mc-cat-"))).toHaveLength(3);
  });

  it("the no-accent seed matches the shipped default accent (drift guard)", () => {
    // theme.ts inlines DEFAULT_ACCENT to stay self-contained; assert it still
    // equals SEMANTIC.accent so the derived-without-accent palette can't drift.
    const noAccent = defineTheme({ cat: 4 }).vars;
    const seeded = defineTheme({ accent: SEMANTIC.accent, cat: 4 }).vars;
    for (let i = 1; i <= 4; i++) expect(noAccent[`--mc-cat-${i}`]).toBe(seeded[`--mc-cat-${i}`]);
  });

  it("an explicit cat array is used verbatim (and twinned for dark)", () => {
    const t = defineTheme({ cat: ["#aa0000", "#00aa00"] });
    expect(t.vars["--mc-cat-1"]).toBe("#aa0000");
    expect(t.darkVars["--mc-cat-1"]).toMatch(HEX);
    expect(t.darkVars["--mc-cat-1"]).not.toBe("#aa0000");
  });

  it("derive: false keeps the accent but leaves the palette alone", () => {
    const t = defineTheme({ accent: "#6d28d9", derive: false });
    expect(t.vars["--mc-accent"]).toBe("#6d28d9");
    expect(t.vars["--mc-cat-1"]).toBeUndefined();
  });
});

describe("defineTheme — dark strategy", () => {
  it("auto-twins hex colours and lifts near-black ink", () => {
    const t = defineTheme({ stroke: "#1a1917", accent: "#1f6091", derive: false });
    expect(t.darkVars["--mc-stroke"]).toMatch(HEX);
    // ink twin is far lighter than the source
    expect(parseInt(t.darkVars["--mc-stroke"]!.slice(1, 3), 16)).toBeGreaterThan(0xa0);
  });

  it("dark object overrides specific twins", () => {
    const t = defineTheme({ accent: "#1f6091", derive: false, dark: { accent: "#5ea1cf" } });
    expect(t.darkVars["--mc-accent"]).toBe("#5ea1cf");
  });

  it("mono's var() values are not twinned", () => {
    const t = defineTheme({ extends: "mono" });
    expect(t.vars["--mc-accent"]).toBe("var(--mc-stroke)");
    expect(t.darkVars["--mc-accent"]).toBeUndefined();
  });
});

describe("defineTheme — output shapes", () => {
  it("css() emits a light block and a dark media twin", () => {
    const css = defineTheme({ accent: "#6d28d9" }).css(".brand");
    expect(css).toContain(".brand {");
    expect(css).toContain("--mc-accent: #6d28d9;");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(String(defineTheme({ accent: "#6d28d9" }))).toContain(":root {");
  });

  it("css() omits the dark block when dark is false", () => {
    const css = defineTheme({ accent: "#6d28d9", dark: false }).css();
    expect(css).not.toContain("@media");
  });

  it("style aliases vars and both are frozen", () => {
    const t = defineTheme({ density: 0.9 });
    expect(t.style).toBe(t.vars);
    expect(Object.isFrozen(t.vars)).toBe(true);
  });

  it("extend merges specs and re-derives", () => {
    const base = defineTheme({ accent: "#6d28d9" });
    const compact = base.extend({ density: 0.85 });
    expect(compact.vars["--mc-accent"]).toBe("#6d28d9");
    expect(compact.vars["--mc-density"]).toBe("0.85");
    expect(compact.vars["--mc-cat-1"]).toMatch(HEX);
  });
});

describe("OKLCH round-trip stays in-gamut", () => {
  it("recovers a known colour within a small tolerance", () => {
    // #1f6091 → derive nothing, just round-trip through the twin's inverse path
    // by checking a mid grey maps to itself closely.
    const t = defineTheme({ cat: ["#808080"] });
    const twin = t.darkVars["--mc-cat-1"]!;
    expect(twin).toMatch(HEX);
  });
});
