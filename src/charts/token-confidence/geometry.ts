// TokenConfidence: No
// SVG: the tiering is the only computation. Per-token confidence maps to THREE
// discrete tiers, never a continuous gradient — people calibrate categorically,
// and a gradient prop will never exist (color-alone would fail a11y anyway).
export type Tier = "confident" | "unsure" | "guessing";

/** Default confidence cutoffs. Shared by BOTH entries so their defaults are
 *  one object: a literal default is a fresh array per render, which defeats
 *  the interactive entry's tiering memo (and drifts the two entries apart). */
export const DEFAULT_TIERS: readonly [number, number] = [0.5, 0.8];

export interface TokenDatum {
  token: string;
  confidence: number;
}

export interface TieredToken {
  token: string;
  tier: Tier;
  confidence: number;
}

/** Split a token into [leading space, word, trailing space]: the underline marks
 *  the WORD only, so a mark never bleeds under the space between two tokens.
 *  Shared so the static and interactive markups cannot drift apart. */
export function splitToken(token: string): [string, string, string] {
  const trimmed = token.trimStart();
  const core = trimmed.trimEnd();
  return [token.slice(0, token.length - trimmed.length), core, trimmed.slice(core.length)];
}

/** confidence ≥ hi → confident · lo ≤ c < hi → unsure · c < lo → guessing.
 *  Non-finite confidence → guessing (the safe, flag-it default).
 *
 *  A cutoff that is not a finite number falls back to its default rather than
 *  silently redefining the tiering: `tiers={[null, null]}` off a JSON config
 *  compared as `[0, 0]` and called every token confident, so a chart whose whole
 *  job is flagging text to double-check flagged nothing and looked right doing
 *  it. `[NaN, NaN]` failed the other way and flagged everything as unsure. */
export function tokenTiers(opts: {
  data: readonly TokenDatum[];
  tiers: readonly [number, number];
}): TieredToken[] {
  const lo = Number.isFinite(opts.tiers[0]) ? opts.tiers[0]! : DEFAULT_TIERS[0];
  const hi = Number.isFinite(opts.tiers[1]) ? opts.tiers[1]! : DEFAULT_TIERS[1];
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
