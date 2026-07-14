// Visual source for the theming page's token swatches. These MIRROR the library
// stylesheet (`../../styles.css`) — the single source of truth for the shipped
// `--mc-*` defaults, hand-tuned dark values, and preset bundles. The docs site
// re-tints these tokens for its own glass surface (see global.css), so a live
// `getComputedStyle` read here would show the SITE's brand values, not the
// library contract this page documents. We therefore paint the library values
// directly and keep them honest with `mc-tokens.test.ts`, which parses
// styles.css and fails if any value below drifts.

export type ColorToken = {
  /** Custom-property name, e.g. `--mc-positive`. */
  cssVar: string;
  /** What it controls, one line. */
  role: string;
  /** Default (light) value from the library `:root`. */
  light: string;
  /** Hand-tuned dark value from `[data-mc-theme="dark"]`. */
  dark: string;
  /** Optional tone name for categorical hues. */
  tone?: string;
  /** True when the value is a derived expression (color-mix), not a flat hex. */
  derived?: boolean;
};

// Semantic ink — meaning is fixed; a preset restyles but never reassigns these.
export const SEMANTIC_TOKENS: ColorToken[] = [
  {
    cssVar: "--mc-stroke",
    role: "Default ink — lines, bars, labels",
    light: "#1a1917",
    dark: "#eae9e6",
  },
  {
    cssVar: "--mc-positive",
    role: "Good direction — pair with ▲",
    light: "#0e7a5f",
    dark: "#45a385",
  },
  {
    cssVar: "--mc-negative",
    role: "Bad direction — pair with ▼",
    light: "#bd4b2d",
    dark: "#df7856",
  },
  { cssVar: "--mc-neutral", role: "No-signal marks, baselines", light: "#8a8986", dark: "#9a9a97" },
  {
    cssVar: "--mc-accent",
    role: "Emphasis — rebind to your brand",
    light: "#1f6091",
    dark: "#5ea1cf",
  },
  {
    cssVar: "--mc-band",
    role: "Normal-range shading, derived from ink",
    light: "color-mix(in oklab, #1a1917 8%, transparent)",
    dark: "color-mix(in oklab, #eae9e6 8%, transparent)",
    derived: true,
  },
  {
    cssVar: "--mc-moon",
    role: "MoonPhase lit area — warm amber",
    light: "#c1922f",
    dark: "#e0be6f",
  },
];

// Categorical palette — matte jewel tones, lightness-ordered, multi-series only.
export const CATEGORICAL_TOKENS: ColorToken[] = [
  { cssVar: "--mc-cat-1", role: "", tone: "Gold", light: "#d2982f", dark: "#e2b45c" },
  { cssVar: "--mc-cat-2", role: "", tone: "Azure", light: "#5b9fd4", dark: "#6fb0e0" },
  { cssVar: "--mc-cat-3", role: "", tone: "Emerald", light: "#2e8c66", dark: "#4fb08d" },
  { cssVar: "--mc-cat-4", role: "", tone: "Sapphire", light: "#285788", dark: "#6e9bd1" },
  { cssVar: "--mc-cat-5", role: "", tone: "Terracotta", light: "#c2543a", dark: "#e07e5e" },
  { cssVar: "--mc-cat-6", role: "", tone: "Mauve", light: "#a85c8c", dark: "#c486b0" },
];

export type Preset = {
  id: string;
  label: string;
  /** One-line summary of what the preset retunes. */
  note: string;
  /** Token deltas vs. the default (modern). Empty for modern. */
  changes: { cssVar: string; value: string }[];
};

// Presets are token bundles applied with `data-mc-theme` / `data-mc-preset`.
// modern is the default (no attribute). These mirror the library preset blocks.
export const PRESETS: Preset[] = [
  { id: "modern", label: "Modern", note: "The default — nothing to override.", changes: [] },
  {
    id: "editorial",
    label: "Editorial",
    note: "Hairline ink, a signature claret endpoint.",
    changes: [
      { cssVar: "--mc-accent", value: "#a32236" },
      { cssVar: "--mc-stroke-width", value: "1" },
    ],
  },
  {
    id: "mono",
    label: "Mono",
    note: "One ink — direction carries by shape, never colour.",
    changes: [
      { cssVar: "--mc-positive", value: "var(--mc-stroke)" },
      { cssVar: "--mc-negative", value: "var(--mc-stroke)" },
      { cssVar: "--mc-accent", value: "var(--mc-stroke)" },
      { cssVar: "--mc-neutral", value: "var(--mc-stroke)" },
    ],
  },
  {
    id: "vivid",
    label: "Vivid",
    note: "Bolder ink and punchier valence; accent stays yours.",
    changes: [
      { cssVar: "--mc-positive", value: "#0f9e78" },
      { cssVar: "--mc-negative", value: "#e24d2e" },
      { cssVar: "--mc-stroke-width", value: "2" },
    ],
  },
  {
    id: "print",
    label: "Print",
    note: "Paper output — near-black ink, hairline weight, valence deepened for CMYK.",
    changes: [
      { cssVar: "--mc-stroke", value: "#1a1a1a" },
      { cssVar: "--mc-neutral", value: "#666666" },
      { cssVar: "--mc-positive", value: "#0c6249" },
      { cssVar: "--mc-negative", value: "#a33f22" },
      { cssVar: "--mc-accent", value: "#14507a" },
      { cssVar: "--mc-moon", value: "#7a5a12" },
      { cssVar: "--mc-band", value: "color-mix(in oklab, #1a1a1a 9%, transparent)" },
      { cssVar: "--mc-stroke-width", value: "1.25" },
    ],
  },
  {
    id: "eink",
    label: "E-ink",
    note: "Grayscale e-paper — sign rides lightness, heavier strokes for low refresh.",
    changes: [
      { cssVar: "--mc-stroke", value: "#000000" },
      { cssVar: "--mc-positive", value: "#000000" },
      { cssVar: "--mc-negative", value: "#595959" },
      { cssVar: "--mc-neutral", value: "#8c8c8c" },
      { cssVar: "--mc-accent", value: "#000000" },
      { cssVar: "--mc-moon", value: "#000000" },
      { cssVar: "--mc-band", value: "color-mix(in oklab, #000000 14%, transparent)" },
      { cssVar: "--mc-stroke-width", value: "2" },
    ],
  },
];
