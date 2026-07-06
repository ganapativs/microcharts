// Palette constants + categorical resolution (plan/06 §2). Runtime color comes
// from CSS custom properties at paint time; this module supplies the canonical
// hex values (for the stylesheet + non-CSS renderers) and index → token mapping.

/** Okabe-Ito colorblind-safe palette (plan/06). */
export const OKABE_ITO = {
  black: "#000000",
  orange: "#E69F00",
  skyBlue: "#56B4E9",
  bluishGreen: "#009E73",
  yellow: "#F0E442",
  blue: "#0072B2",
  vermillion: "#D55E00",
  reddishPurple: "#CC79A7",
} as const;

/** Semantic defaults (light). Dark values are hand-tuned in styles.css. */
export const SEMANTIC = {
  stroke: "#171717",
  positive: OKABE_ITO.bluishGreen, // #009E73
  negative: OKABE_ITO.vermillion, // #D55E00
  neutral: "#8A8A8A",
  accent: OKABE_ITO.blue, // #0072B2
} as const;

/** Categorical order — yellow excluded from the default (low contrast on light
 *  backgrounds, plan/06/08). Micro charts rarely need > 3 series. */
export const CATEGORICAL = [
  OKABE_ITO.orange,
  OKABE_ITO.skyBlue,
  OKABE_ITO.bluishGreen,
  OKABE_ITO.blue,
  OKABE_ITO.vermillion,
  OKABE_ITO.reddishPurple,
] as const;

/** The `--mc-cat-N` CSS variable for a series index (1-based, cycles). */
export function categoricalToken(index: number): string {
  const n = (((index % CATEGORICAL.length) + CATEGORICAL.length) % CATEGORICAL.length) + 1;
  return `var(--mc-cat-${n})`;
}
