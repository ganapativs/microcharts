// Palette constants + categorical resolution. Runtime color comes
// from CSS custom properties at paint time; this module supplies the canonical
// hex values (for the stylesheet + non-CSS renderers) and index → token mapping.

/** Matte palette — Okabe-Ito hue geometry (colorblind-safe: bluish-green vs
 * vermillion split, lightness-ordered blues) deepened to an editorial, matte
 * finish. Every tone reads richer and less "poppy" than the source Okabe-Ito
 * hues while clearing ≥ 3:1 on the default white surface. Mirror of the light
 * `--mc-*` tokens in styles.css; dark values are hand-tuned there. */
export const PALETTE = {
  gold: "#D2982F",
  azure: "#5B9FD4",
  emerald: "#2E8C66",
  sapphire: "#285788",
  terracotta: "#C2543A",
  mauve: "#A85C8C",
} as const;

/** Semantic defaults (light). Dark values are hand-tuned in styles.css. */
export const SEMANTIC = {
  stroke: "#1A1917",
  positive: "#0E7A5F", // deep viridian
  negative: "#BD4B2D", // burnt terracotta
  neutral: "#8A8986",
  accent: "#1F6091", // deep steel blue
} as const;

/** Categorical order — gold leads (true yellow is too low-contrast on light).
 * Lightness-ordered for grayscale/CVD separation; the two blues (azure light,
 * sapphire deep) split cleanly. Dark twins are hand-tuned in styles.css. Micro
 * charts rarely need > 3 series. */
export const CATEGORICAL = [
  PALETTE.gold,
  PALETTE.azure,
  PALETTE.emerald,
  PALETTE.sapphire,
  PALETTE.terracotta,
  PALETTE.mauve,
] as const;

/** Label ink for text sitting ON a saturated data fill (dense cells, wedges).
 *  Near-white with a hair of translucency so it reads on any --mc-cat-* fill
 *  in light and dark; the one sanctioned literal for this job. */
export const ON_FILL_INK = "rgba(255,255,255,0.96)";

/** The `--mc-cat-N` CSS variable for a series index (1-based, cycles). */
export function categoricalToken(index: number): string {
  const n = (((index % CATEGORICAL.length) + CATEGORICAL.length) % CATEGORICAL.length) + 1;
  return `var(--mc-cat-${n})`;
}
