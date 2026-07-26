/** Deterministic per-chart relatedness — drives the "Related charts" block on
 *  every /docs/charts/<slug> page. Pure metadata scoring over `entries` (the
 *  data-only registry snapshot), so importing it can never drag the component
 *  graph into a route. No randomness anywhere: same catalog in → same links
 *  out, every build (stable internal linking is the SEO point).
 *
 *  A candidate scores against the current chart on four axes:
 *   - collection      (+3) — same catalog collection (core/decision/…)
 *   - data shape      (+3 exact, +2 coarse class) — charts that eat the same
 *     data are the ones a reader is actually choosing between
 *   - encoding channel (+2) — any shared channel keyword (position, length,
 *     color, arc, glyph, …); full channel strings are unique by design, so
 *     token overlap is the signal
 *   - bestFor overlap (+1 per shared keyword, cap +2) — shared documented use
 *     cases. Tokenised like the channel, for the same reason: `bestFor` entries
 *     are hand-written phrases ("an inline trend", "a table-cell trend"), so
 *     comparing whole strings almost never matched and the term was dead
 *     weight — 17 charts appeared in nobody's rail because the fourth slot
 *     degenerated to registry order.
 *  Ties break on registry order, which is itself stable.
 */
import type { ChartEntry } from "./types";
import { STABLE_CHARTS } from "./entries";

/** Cards per page — keep within 3–5; the grid is designed for 4. */
export const RELATED_COUNT = 4;

/** Exact-shape key: drop parentheticals/alternates, fold value→number, strip
 *  spacing — "number of max (optionally segmented)" and "value of max" agree. */
function shapeKey(dataShape: string): string {
  return dataShape
    .toLowerCase()
    .split(" or ")[0]
    .replace(/\(.*?\)/g, "")
    .replace(/\bvalue\b/g, "number")
    .replace(/[^a-z[\]{},|]+/g, "");
}

/** Coarse family: labeled series, plain series, or scalar/config. */
function shapeClass(dataShape: string): string {
  const s = dataShape.toLowerCase();
  if (s.includes("label") && s.includes("[]")) return "labeled";
  if (s.includes("[]")) return "series";
  return "scalar";
}

const CHANNEL_STOPWORDS = new Set(["the", "per", "over", "via", "and", "with", "from"]);

/**
 * Everything in `CHANNEL_STOPWORDS` plus the connective vocabulary that shows up
 * in `bestFor` prose. Channel strings are terse noun phrases; `bestFor` entries
 * are sentences, so without the wider list every pair shares "when" / "exact" /
 * "values" and the term stops discriminating again in the other direction.
 */
const PROSE_STOPWORDS: ReadonlySet<string> = new Set([
  ...CHANNEL_STOPWORDS,
  "for",
  "its",
  "that",
  "this",
  "when",
  "what",
  "how",
  "one",
  "two",
  "few",
  "any",
  "all",
  "not",
  "but",
  "into",
  "onto",
  "out",
  "off",
  "own",
  "too",
  "very",
  "can",
  "has",
  "had",
  "have",
  "use",
  "using",
  "used",
  "than",
  "then",
  "them",
  "they",
  "you",
  "your",
  "are",
  "was",
  "where",
  "which",
  "while",
  "only",
  "just",
  "more",
  "most",
  "less",
  "least",
  "same",
  "other",
  "others",
  "each",
  "both",
  "who",
  "whose",
  "why",
  "already",
  "also",
  "yet",
  "still",
  "such",
  "been",
  "being",
]);

/** Content words of a phrase: lowercase, punctuation-stripped, stopwords out. */
function tokens(text: string, stopwords: ReadonlySet<string>): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w)),
  );
}

function channelTokens(channel: string): Set<string> {
  return tokens(channel, CHANNEL_STOPWORDS);
}

/** Union of the content words across every `bestFor` phrase on an entry. */
function bestForTokens(bestFor: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const phrase of bestFor) for (const t of tokens(phrase, PROSE_STOPWORDS)) out.add(t);
  return out;
}

function score(self: ChartEntry, candidate: ChartEntry): number {
  let s = 0;
  if (candidate.collection === self.collection) s += 3;
  if (shapeKey(candidate.dataShape) === shapeKey(self.dataShape)) s += 3;
  if (shapeClass(candidate.dataShape) === shapeClass(self.dataShape)) s += 2;
  const selfTokens = channelTokens(self.encoding.channel);
  const candTokens = channelTokens(candidate.encoding.channel);
  let shared = false;
  for (const t of candTokens) if (selfTokens.has(t)) shared = true;
  if (shared) s += 2;
  const selfBest = bestForTokens(self.bestFor);
  const candBest = bestForTokens(candidate.bestFor);
  let bestFor = 0;
  for (const t of candBest) if (selfBest.has(t)) bestFor += 1;
  s += Math.min(bestFor, 2);
  return s;
}

/** Top-`count` related stable charts for a slug, best first. Unknown slug → []. */
export function relatedCharts(slug: string, count: number = RELATED_COUNT): ChartEntry[] {
  const self = STABLE_CHARTS.find((c) => c.slug === slug);
  if (!self) return [];

  const scored = STABLE_CHARTS.filter((c) => c.slug !== slug)
    .map((c, i) => ({ c, s: score(self, c), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i);

  const picked = scored.filter((x) => x.s > 0).slice(0, count);
  // Backfill from the remaining scored order (zero-scorers fall back to
  // registry order) so a sparse future catalog still yields a full block.
  // Today every chart clears `count` on score alone (guarded in the test).
  if (picked.length < count) {
    for (const x of scored) {
      if (picked.length >= count) break;
      if (!picked.includes(x)) picked.push(x);
    }
  }
  return picked.map((x) => x.c);
}
