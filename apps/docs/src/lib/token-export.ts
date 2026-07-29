// Pure serializer behind the theming page's "Copy the tokens" studio and the
// appearance menu's copy action. Given a style (preset) + optional brand accent
// + mode, it emits a paste-ready `--mc-*` block — light and hand-tuned dark
// together — exactly as the library ships it.
//
// The values below MIRROR the library stylesheet (`../../../styles.css`) and the
// docs accent bundles (`src/app/global.css`). `token-export.test.ts` parses both
// files and fails the moment any value here drifts, so a copied theme is always
// the real contract, never an approximation.

import { defineTheme, type ThemePreset } from "@microcharts/react/theme";
import { PRESETS, type Preset } from "./mc-tokens";

export type TokenCategory = "ink" | "cat" | "geometry" | "type" | "surface" | "motion";

// The six categorical slots, in order — the only tokens the accent-seeded
// derivation touches.
export const CAT_VARS = [
  "--mc-cat-1",
  "--mc-cat-2",
  "--mc-cat-3",
  "--mc-cat-4",
  "--mc-cat-5",
  "--mc-cat-6",
] as const;

// mono/print/eink own their whole ink set, so they carry a fixed categorical
// ramp in their own family rather than an accent-derived one. `defineTheme`
// takes these verbatim for light and derives the dark twins. One source for the
// site CSS (global.css), the studio, the home widget, and the drift tests.
export const INK_PRESET_CATS: Record<string, readonly string[]> = {
  mono: ["#111111", "#555555", "#8c8c8c", "#bfbfbf", "#dedede", "#737373"],
  eink: ["#000000", "#4d4d4d", "#8c8c8c", "#c4c4c4", "#e0e0e0", "#666666"],
  print: ["#14507a", "#0c6249", "#a33f22", "#7a5a12", "#666666", "#1a1a1a"],
};

const isInkPreset = (preset: string): preset is "mono" | "eink" | "print" =>
  preset in INK_PRESET_CATS;

/**
 * The real `defineTheme` output for a (preset, accent) selection, reduced to the
 * categorical slots — the exact contract the site's [data-accent] /
 * [data-mc-preset] CSS bakes. Returns `null` when nothing is derived (no accent
 * on a non-ink preset → the curated default palette stands).
 *
 * This is THE shared engine: the global picker (baked to CSS), the theming
 * studio's preview + copy, and the home widget all resolve categoricals through
 * it, so a brand accent looks identical everywhere and matches what you copy.
 */
export function deriveCatPalette(
  preset: string,
  accent: string | null,
): { light: Record<string, string>; dark: Record<string, string> } | null {
  const pick = (vars: Readonly<Record<string, string>>) =>
    Object.fromEntries(CAT_VARS.filter((v) => v in vars).map((v) => [v, vars[v]!]));

  if (isInkPreset(preset)) {
    const t = defineTheme({ extends: preset, cat: INK_PRESET_CATS[preset] });
    return { light: pick(t.vars), dark: pick(t.darkVars) };
  }
  // Every brand accent — the default included — derives its own matched
  // categorical palette, so the categories always lead with the accent's own hue
  // (cobalt → blue, ember → warm, …). Consistent across the studio, menu, site,
  // and home widget. `null` only when no accent at all (bare library defaults).
  if (!accent) return null;
  const seed = ACCENTS.find((a) => a.id === accent);
  if (!seed) return null;
  const t = defineTheme(
    preset === "modern"
      ? { accent: seed.light }
      : { extends: preset as ThemePreset, accent: seed.light },
  );
  return { light: pick(t.vars), dark: pick(t.darkVars) };
}

type BaseToken = {
  cssVar: string;
  /** Built-in light value from the library `:where(:root)`. */
  light: string;
  /** Hand-tuned dark value from `[data-mc-theme="dark"]`, when it differs. */
  dark?: string;
  category: TokenCategory;
  /** One-line role, shown as a trailing comment in the "annotated" copy. */
  note: string;
};

// The complete shipped token set, in stylesheet order. `--mc-band` stays an
// expression over `--mc-stroke`, so it re-tints for free in dark and under
// mono/print/eink — we never redeclare it in the dark delta.
export const BASE_TOKENS: BaseToken[] = [
  // semantic ink — meaning is fixed across every theme
  { cssVar: "--mc-stroke", light: "#1a1917", dark: "#eae9e6", category: "ink", note: "Default ink — lines, bars, labels" }, // prettier-ignore
  { cssVar: "--mc-positive", light: "#0e7a5f", dark: "#45a385", category: "ink", note: "Good direction — pair with ▲" }, // prettier-ignore
  { cssVar: "--mc-negative", light: "#bd4b2d", dark: "#df7856", category: "ink", note: "Bad direction — pair with ▼" }, // prettier-ignore
  { cssVar: "--mc-neutral", light: "#8a8986", dark: "#9a9a97", category: "ink", note: "No-signal marks, baselines" }, // prettier-ignore
  { cssVar: "--mc-accent", light: "#1f6091", dark: "#5ea1cf", category: "ink", note: "Emphasis — rebind to your brand" }, // prettier-ignore
  { cssVar: "--mc-band", light: "color-mix(in oklab, var(--mc-stroke) 8%, transparent)", category: "ink", note: "Normal-range shading, derived from ink" }, // prettier-ignore
  { cssVar: "--mc-moon", light: "#c1922f", dark: "#e0be6f", category: "ink", note: "MoonPhase lit area — warm amber" }, // prettier-ignore
  // categorical — multi-series only, lightness-ordered
  {
    cssVar: "--mc-cat-1",
    light: "#d2982f",
    dark: "#e2b45c",
    category: "cat",
    note: "Gold",
  },
  {
    cssVar: "--mc-cat-2",
    light: "#5b9fd4",
    dark: "#6fb0e0",
    category: "cat",
    note: "Azure",
  },
  {
    cssVar: "--mc-cat-3",
    light: "#2e8c66",
    dark: "#4fb08d",
    category: "cat",
    note: "Emerald",
  },
  {
    cssVar: "--mc-cat-4",
    light: "#285788",
    dark: "#6e9bd1",
    category: "cat",
    note: "Sapphire",
  },
  {
    cssVar: "--mc-cat-5",
    light: "#bc5138",
    dark: "#e07e5e",
    category: "cat",
    note: "Terracotta",
  },
  {
    cssVar: "--mc-cat-6",
    light: "#a55a89",
    dark: "#c486b0",
    category: "cat",
    note: "Mauve",
  },
  // geometry
  { cssVar: "--mc-stroke-width", light: "1.5", category: "geometry", note: "Stroke weight (~2 standalone)" }, // prettier-ignore
  {
    cssVar: "--mc-gap",
    light: "0.25em",
    category: "geometry",
    note: "Gap between grouped marks",
  },
  { cssVar: "--mc-density", light: "1", category: "geometry", note: "Uniform density scale (<1 compact)" }, // prettier-ignore
  // type
  {
    cssVar: "--mc-font",
    light: "inherit",
    category: "type",
    note: "Adopts the host UI font",
  },
  { cssVar: "--mc-font-numeric", light: "var(--mc-font)", category: "type", note: "Figures + labels face" }, // prettier-ignore
  { cssVar: "--mc-label-size", light: "0.75em", category: "type", note: "Direct-label text size" }, // prettier-ignore
  {
    cssVar: "--mc-label-weight",
    light: "400",
    category: "type",
    note: "Direct-label weight",
  },
  { cssVar: "--mc-inline-nudge", light: "0em", category: "type", note: "Optional inline optical shift" }, // prettier-ignore
  { cssVar: "--mc-glyph-nudge", light: "0em", category: "type", note: "Centred-glyph optical lift" }, // prettier-ignore
  // interactive readout surface
  {
    cssVar: "--mc-surface",
    light: "Canvas",
    category: "surface",
    note: "Readout chip backing",
  },
  {
    cssVar: "--mc-surface-ink",
    light: "CanvasText",
    category: "surface",
    note: "Readout chip ink",
  },
  { cssVar: "--mc-surface-edge", light: "color-mix(in oklab, CanvasText 16%, transparent)", category: "surface", note: "Readout chip edge" }, // prettier-ignore
  {
    cssVar: "--mc-on-fill",
    light: "rgba(255, 255, 255, 0.96)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on a saturated semantic fill",
  },
  {
    cssVar: "--mc-on-cat",
    light: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on a categorical fill (mid-tone, so it wants the opposite ink)",
  },
  {
    cssVar: "--mc-on-cat-1",
    light: "rgba(0, 0, 0, 0.9)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on --mc-cat-1 (generated: whichever ink clears AA on that fill)",
  },
  {
    cssVar: "--mc-on-cat-2",
    light: "rgba(0, 0, 0, 0.9)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on --mc-cat-2 (generated: whichever ink clears AA on that fill)",
  },
  {
    cssVar: "--mc-on-cat-3",
    light: "rgba(0, 0, 0, 0.9)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on --mc-cat-3 (generated: whichever ink clears AA on that fill)",
  },
  {
    cssVar: "--mc-on-cat-4",
    light: "rgba(255, 255, 255, 0.96)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on --mc-cat-4 (generated: whichever ink clears AA on that fill)",
  },
  {
    cssVar: "--mc-on-cat-5",
    light: "rgba(255, 255, 255, 0.96)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on --mc-cat-5 (generated: whichever ink clears AA on that fill)",
  },
  {
    cssVar: "--mc-on-cat-6",
    light: "rgba(255, 255, 255, 0.96)",
    dark: "rgba(0, 0, 0, 0.9)",
    category: "surface",
    note: "Label ink on --mc-cat-6 (generated: whichever ink clears AA on that fill)",
  },
  {
    cssVar: "--mc-on-fill-dim",
    light: "var(--mc-stroke)",
    category: "surface",
    note: "Label that steps back from the on-fill treatment",
  },
  // motion
  { cssVar: "--mc-duration", light: "300ms", category: "motion", note: "Entrance timing (interactive only)" }, // prettier-ignore
  { cssVar: "--mc-easing", light: "cubic-bezier(0.22, 1, 0.36, 1)", category: "motion", note: "Ease-out entrance" }, // prettier-ignore
];

// print/eink pin a light-surface ink, so they carry a hand-tuned dark twin that
// re-tunes the pinned colours for a dark viewer. mono/vivid/editorial leave ink
// to the active theme and need no twin. Mirrors the library's dark-twin blocks.
export const PRESET_DARK_TWINS: Record<string, Record<string, string>> = {
  print: {
    "--mc-stroke": "#e8e6e1",
    "--mc-neutral": "#9a958c",
    "--mc-positive": "#4aa588",
    "--mc-negative": "#e08a63",
    "--mc-accent": "#6aa9d3",
    "--mc-moon": "#e0be6f",
    "--mc-band": "color-mix(in oklab, #e8e6e1 9%, transparent)",
  },
  eink: {
    "--mc-stroke": "#ffffff",
    "--mc-positive": "#ffffff",
    "--mc-negative": "#b0b0b0",
    "--mc-neutral": "#808080",
    "--mc-accent": "#ffffff",
    "--mc-moon": "#ffffff",
    "--mc-band": "color-mix(in oklab, #ffffff 14%, transparent)",
  },
};

export type Accent = { id: string; label: string; light: string; dark: string };

// Docs accent bundles (global.css) expressed as the one library token they
// drive: `--mc-accent`. "cobalt" is the docs default (base :root); picking any
// accent emits an explicit override to that hue. Mirrors `:root[data-accent]` /
// `.dark[…]`, with Cobalt also the unscoped base.
export const ACCENTS: Accent[] = [
  { id: "cobalt", label: "Cobalt", light: "#2f52d4", dark: "#528dff" },
  { id: "ember", label: "Ember", light: "#c2410c", dark: "#f7924e" },
  { id: "clay", label: "Clay", light: "#a14a34", dark: "#e08e73" },
  { id: "moss", label: "Moss", light: "#4d7c1e", dark: "#a3c46a" },
  { id: "teal", label: "Teal", light: "#0f766e", dark: "#55c2b3" },
  { id: "rose", label: "Rose", light: "#be123c", dark: "#fb6f89" },
];

export type Mode = "both" | "light" | "dark";
export type Format = "css" | "js";

export type ExportOptions = {
  /** Preset id from `PRESETS` — "modern" is the default (no deltas). */
  preset: string;
  /** Accent id from `ACCENTS`, or null to keep the preset/default accent. */
  accent: string | null;
  mode: Mode;
  /** "color" = ink + categorical only; "all" = every shipped token. */
  include: "color" | "all";
  /** CSS selector the block targets (CSS format only). */
  scope: string;
  format: Format;
  /** Append a `/* role *​/` comment after each declaration. */
  annotate: boolean;
};

const presetById = (id: string): Preset => PRESETS.find((p) => p.id === id) ?? PRESETS[0]!;

const inInclude = (cat: TokenCategory, include: "color" | "all") =>
  include === "all" || cat === "ink" || cat === "cat";

/**
 * Resolve the full light + dark token maps for a selection. Cascade order
 * mirrors the stylesheet: base → dark override → preset delta (both modes) →
 * preset dark twin → explicit accent (wins last). Returns ordered entries so
 * the emitted block reads in canonical stylesheet order.
 */
export function resolveTokens(opts: Pick<ExportOptions, "preset" | "accent" | "include">) {
  const preset = presetById(opts.preset);
  const twin = PRESET_DARK_TWINS[preset.id] ?? {};
  const accent = opts.accent ? (ACCENTS.find((a) => a.id === opts.accent) ?? null) : null;
  const presetDelta = Object.fromEntries(preset.changes.map((c) => [c.cssVar, c.value]));
  // Accent-seeded / ink-preset categorical palette from the real defineTheme —
  // the same values the site's [data-accent] CSS bakes, so preview = copy = site.
  const cats = deriveCatPalette(opts.preset, opts.accent);

  const light: { cssVar: string; value: string; note: string }[] = [];
  const dark: { cssVar: string; value: string; note: string }[] = [];

  for (const t of BASE_TOKENS) {
    if (!inInclude(t.category, opts.include)) continue;

    // light = base → preset → derived cat → accent
    let lv = t.light;
    if (t.cssVar in presetDelta) lv = presetDelta[t.cssVar]!;
    if (cats && t.cssVar in cats.light) lv = cats.light[t.cssVar]!;
    if (accent && t.cssVar === "--mc-accent") lv = accent.light;
    light.push({ cssVar: t.cssVar, value: lv, note: t.note });

    // dark = base-dark → preset → twin → derived cat → accent
    let dv = t.dark ?? t.light;
    if (t.cssVar in presetDelta) dv = presetDelta[t.cssVar]!;
    if (t.cssVar in twin) dv = twin[t.cssVar]!;
    if (cats && t.cssVar in cats.dark) dv = cats.dark[t.cssVar]!;
    if (accent && t.cssVar === "--mc-accent") dv = accent.dark;
    dark.push({ cssVar: t.cssVar, value: dv, note: t.note });
  }
  return { light, dark };
}

// One declaration line. The optional comment follows a single space — never
// column-padded: alignment would push comments far right on the long color-mix
// lines, which then wrap badly in the fixed-width copy block.
const cssLine = (e: { cssVar: string; value: string; note: string }, annotate: boolean) => {
  const decl = `  ${e.cssVar}: ${e.value};`;
  return annotate ? `${decl} /* ${e.note} */` : decl;
};

function emitCss(opts: ExportOptions): string {
  const { light, dark } = resolveTokens(opts);
  // Dark block only carries tokens whose dark value differs — the honest delta,
  // exactly like the library's `@media` block.
  const darkDelta = dark.filter((d, i) => d.value !== light[i]!.value);

  if (opts.mode === "dark") {
    // Flatten the resolved dark values under the scope — for hardcoding a dark UI.
    const body = dark.map((e) => cssLine(e, opts.annotate)).join("\n");
    return `${opts.scope} {\n${body}\n}`;
  }

  const lightBody = light.map((e) => cssLine(e, opts.annotate)).join("\n");
  const root = `${opts.scope} {\n${lightBody}\n}`;
  if (opts.mode === "light" || darkDelta.length === 0) return root;

  const darkBody = darkDelta.map((e) => `  ${cssLine(e, opts.annotate)}`).join("\n");
  return `${root}\n\n@media (prefers-color-scheme: dark) {\n  ${opts.scope} {\n${darkBody}\n  }\n}`;
}

const jsObject = (entries: { cssVar: string; value: string }[]) =>
  entries.map((e) => `  "${e.cssVar}": ${JSON.stringify(e.value)},`).join("\n");

function emitJs(opts: ExportOptions): string {
  const { light, dark } = resolveTokens(opts);
  if (opts.mode === "light") return `const tokens = {\n${jsObject(light)}\n};`;
  if (opts.mode === "dark") return `const tokens = {\n${jsObject(dark)}\n};`;
  return `const lightTokens = {\n${jsObject(light)}\n};\n\nconst darkTokens = {\n${jsObject(dark)}\n};`;
}

/** Serialize a theme selection to a paste-ready string in the chosen format. */
export function serializeTokens(opts: ExportOptions): string {
  return opts.format === "js" ? emitJs(opts) : emitCss(opts);
}
