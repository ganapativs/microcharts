// Pure serializer behind the theming page's "Copy the tokens" studio and the
// appearance menu's copy action. Given a style (preset) + optional brand accent
// + mode, it emits a paste-ready `--mc-*` block — light and hand-tuned dark
// together — exactly as the library ships it.
//
// The values below MIRROR the library stylesheet (`../../../styles.css`) and the
// docs accent bundles (`src/app/global.css`). `token-export.test.ts` parses both
// files and fails the moment any value here drifts, so a copied theme is always
// the real contract, never an approximation.

import { PRESETS, type Preset } from "./mc-tokens";

export type TokenCategory = "ink" | "cat" | "geometry" | "type" | "surface" | "motion";

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
  { cssVar: "--mc-cat-1", light: "#d2982f", dark: "#e2b45c", category: "cat", note: "Gold" },
  { cssVar: "--mc-cat-2", light: "#5b9fd4", dark: "#6fb0e0", category: "cat", note: "Azure" },
  { cssVar: "--mc-cat-3", light: "#2e8c66", dark: "#4fb08d", category: "cat", note: "Emerald" },
  { cssVar: "--mc-cat-4", light: "#285788", dark: "#6e9bd1", category: "cat", note: "Sapphire" },
  { cssVar: "--mc-cat-5", light: "#c2543a", dark: "#e07e5e", category: "cat", note: "Terracotta" },
  { cssVar: "--mc-cat-6", light: "#a85c8c", dark: "#c486b0", category: "cat", note: "Mauve" },
  // geometry
  { cssVar: "--mc-stroke-width", light: "1.5", category: "geometry", note: "Stroke weight (~2 standalone)" }, // prettier-ignore
  { cssVar: "--mc-gap", light: "0.25em", category: "geometry", note: "Gap between grouped marks" },
  { cssVar: "--mc-density", light: "1", category: "geometry", note: "Uniform density scale (<1 compact)" }, // prettier-ignore
  // type
  { cssVar: "--mc-font", light: "inherit", category: "type", note: "Adopts the host UI font" },
  { cssVar: "--mc-font-numeric", light: "var(--mc-font)", category: "type", note: "Figures + labels face" }, // prettier-ignore
  { cssVar: "--mc-label-size", light: "0.75em", category: "type", note: "Direct-label text size" }, // prettier-ignore
  { cssVar: "--mc-label-weight", light: "400", category: "type", note: "Direct-label weight" },
  { cssVar: "--mc-inline-nudge", light: "0em", category: "type", note: "Optional inline optical shift" }, // prettier-ignore
  { cssVar: "--mc-glyph-nudge", light: "-0.04em", category: "type", note: "Centred-glyph optical lift" }, // prettier-ignore
  // interactive readout surface
  { cssVar: "--mc-surface", light: "Canvas", category: "surface", note: "Readout chip backing" },
  { cssVar: "--mc-surface-ink", light: "CanvasText", category: "surface", note: "Readout chip ink" },
  { cssVar: "--mc-surface-edge", light: "color-mix(in oklab, CanvasText 16%, transparent)", category: "surface", note: "Readout chip edge" }, // prettier-ignore
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
// drive: `--mc-accent`. "cobalt" is the docs default; picking it emits an
// explicit override to that hue. Mirrors `:root[data-accent]` / `.dark[…]`.
export const ACCENTS: Accent[] = [
  { id: "cobalt", label: "Cobalt", light: "#2f52d4", dark: "#7f9cf5" },
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

const presetById = (id: string): Preset =>
  PRESETS.find((p) => p.id === id) ?? PRESETS[0]!;

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
  const accent = opts.accent ? ACCENTS.find((a) => a.id === opts.accent) ?? null : null;
  const presetDelta = Object.fromEntries(preset.changes.map((c) => [c.cssVar, c.value]));

  const light: { cssVar: string; value: string; note: string }[] = [];
  const dark: { cssVar: string; value: string; note: string }[] = [];

  for (const t of BASE_TOKENS) {
    if (!inInclude(t.category, opts.include)) continue;

    // light = base → preset → accent
    let lv = t.light;
    if (t.cssVar in presetDelta) lv = presetDelta[t.cssVar]!;
    if (accent && t.cssVar === "--mc-accent") lv = accent.light;
    light.push({ cssVar: t.cssVar, value: lv, note: t.note });

    // dark = base-dark → preset → twin → accent
    let dv = t.dark ?? t.light;
    if (t.cssVar in presetDelta) dv = presetDelta[t.cssVar]!;
    if (t.cssVar in twin) dv = twin[t.cssVar]!;
    if (accent && t.cssVar === "--mc-accent") dv = accent.dark;
    dark.push({ cssVar: t.cssVar, value: dv, note: t.note });
  }
  return { light, dark };
}

const cssLine = (
  e: { cssVar: string; value: string; note: string },
  annotate: boolean,
  pad = 0,
) => {
  const decl = `  ${e.cssVar}: ${e.value};`;
  return annotate ? `${decl.padEnd(pad)} /* ${e.note} */` : decl;
};

function emitCss(opts: ExportOptions): string {
  const { light, dark } = resolveTokens(opts);
  // Dark block only carries tokens whose dark value differs — the honest delta,
  // exactly like the library's `@media` block.
  const darkDelta = dark.filter((d, i) => d.value !== light[i]!.value);

  const pad = opts.annotate
    ? Math.max(...light.map((e) => `  ${e.cssVar}: ${e.value};`.length)) + 1
    : 0;

  if (opts.mode === "dark") {
    // Flatten the resolved dark values under the scope — for hardcoding a dark UI.
    const body = dark.map((e) => cssLine(e, opts.annotate, pad)).join("\n");
    return `${opts.scope} {\n${body}\n}`;
  }

  const lightBody = light.map((e) => cssLine(e, opts.annotate, pad)).join("\n");
  const root = `${opts.scope} {\n${lightBody}\n}`;
  if (opts.mode === "light" || darkDelta.length === 0) return root;

  const dpad = opts.annotate
    ? Math.max(...darkDelta.map((e) => `  ${e.cssVar}: ${e.value};`.length)) + 1
    : 0;
  const darkBody = darkDelta.map((e) => `  ${cssLine(e, opts.annotate, dpad)}`).join("\n");
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
