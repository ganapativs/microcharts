// TokenConfidence "geometry" — pure, React-free (plan/25 §7, plan/17 F12). No
// SVG: the tiering is the only computation. Per-token confidence maps to THREE
// discrete tiers, never a continuous gradient — people calibrate categorically,
// and a gradient prop will never exist (color-alone would fail a11y anyway).
export type Tier = "confident" | "unsure" | "guessing";

export interface TokenDatum {
  token: string;
  confidence: number;
}

export interface TieredToken {
  token: string;
  tier: Tier;
  confidence: number;
}

/** confidence ≥ hi → confident · lo ≤ c < hi → unsure · c < lo → guessing.
 *  Non-finite confidence → guessing (the safe, flag-it default). */
export function tokenTiers(opts: {
  data: readonly TokenDatum[];
  tiers: [number, number];
}): TieredToken[] {
  const [lo, hi] = opts.tiers;
  return opts.data.map((d) => {
    const c = d.confidence;
    let tier: Tier;
    if (!Number.isFinite(c) || c < lo) tier = "guessing";
    else if (c >= hi) tier = "confident";
    else tier = "unsure";
    return { token: d.token, tier, confidence: c };
  });
}

export function tokenTierCounts(tokens: readonly TieredToken[]): {
  confident: number;
  unsure: number;
  guessing: number;
} {
  let confident = 0;
  let unsure = 0;
  let guessing = 0;
  for (const t of tokens) {
    if (t.tier === "confident") confident++;
    else if (t.tier === "unsure") unsure++;
    else guessing++;
  }
  return { confident, unsure, guessing };
}
