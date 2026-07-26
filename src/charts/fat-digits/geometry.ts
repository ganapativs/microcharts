// FatDigits: The numeral itself is
// the exact channel; font-WEIGHT is a redundant preattentive tier (5 or 3
// ordinal steps) so big numbers in a dense column pop before you read them.
// DEVIATION from FatFonts: the source encodes magnitude as glyph ink
// AREA via a custom font; shipping a font would break zero-dep, so magnitude
// maps to discrete font-weight tiers on the inherited font. Weight is ordinal,
// never continuous; the numeral is always the exact value.
import { clamp } from "../../core/scale.js";
import { isFiniteValue, round2 } from "../../core/types.js";

export type FatTiers = 3 | 5;

// Documented weight tables (index 0 = lightest → highest = boldest).
const WEIGHTS: Record<FatTiers, readonly number[]> = {
  3: [400, 550, 750],
  5: [300, 450, 600, 750, 900],
};

/**
 * value → { weight, tier } (1-based tier). No USABLE domain → the middle tier.
 * "Usable" means a finite, non-degenerate pair: a short array (`domain[1]`
 * undefined) or a non-finite bound would make the ratio NaN, and a NaN index
 * silently reads an undefined weight AND leaks "tier NaN" into the summary.
 * The domain is validated once, here, where the numbers enter.
 */
export function fatTier(
  value: number,
  domain: readonly [number, number] | undefined,
  tiers: FatTiers,
): { weight: number; tier: number } {
  const steps = WEIGHTS[tiers];
  const usable =
    domain !== undefined &&
    isFiniteValue(domain[0]) &&
    isFiniteValue(domain[1]) &&
    domain[0] !== domain[1];
  let idx: number;
  if (!usable || !isFiniteValue(value)) {
    idx = Math.floor((tiers - 1) / 2); // middle tier
  } else {
    const t = clamp((value - domain[0]!) / (domain[1]! - domain[0]!), 0, 1);
    idx = Math.round(t * (tiers - 1));
  }
  return { weight: steps[idx]!, tier: idx + 1 };
}

/** digit 0–9 → weight via ⌈(d+1)/(10/tiers)⌉ (documented). */
function digitWeight(d: number, tiers: FatTiers): number {
  const idx = Math.max(1, Math.ceil((d + 1) / (10 / tiers))) - 1;
  return WEIGHTS[tiers][Math.min(idx, tiers - 1)]!;
}

export interface FatDigitsGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  /** value mode: one weighted numeral. */
  text?: { str: string; weight: number };
  /** digit mode: per-digit weights. */
  glyphs?: { char: string; weight: number }[];
  tier: number;
}

export function fatDigitsGeometry(opts: {
  /** Already-formatted numeral (grouping applied by the component). */
  formatted: string;
  value: number;
  domain: readonly [number, number] | undefined;
  tiers: FatTiers;
  encode: "value" | "digit";
  fontSize: number;
  pad: number;
}): FatDigitsGeometry {
  const { formatted, value, domain, tiers, encode, fontSize, pad } = opts;
  const height = Math.ceil(fontSize * 1.4);
  const width = Math.max(1, Math.ceil(formatted.length * 0.62 * fontSize + 2 * pad));
  const x = pad;
  const y = round2(height / 2);
  const { tier } = fatTier(value, domain, tiers);

  if (encode === "digit") {
    const glyphs = [...formatted].map((char) => ({
      char,
      weight: /[0-9]/.test(char) ? digitWeight(Number(char), tiers) : WEIGHTS[tiers][0]!,
    }));
    return { x, y, width, height, glyphs, tier };
  }
  return {
    x,
    y,
    width,
    height,
    text: { str: formatted, weight: fatTier(value, domain, tiers).weight },
    tier,
  };
}
