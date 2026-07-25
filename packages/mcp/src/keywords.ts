import type { ChartEntry } from "./types";

/**
 * Search index + scorer for `find_microchart`. The field set mirrors the docs
 * gallery's `keywords()` (name, tagline, dataShape, encoding channel,
 * collection, bestFor) — the same text the site's chart search indexes — with
 * bestFor + tagline + name weighted highest, since those carry the "what
 * decision does this answer" signal the finder is built on.
 *
 * Matching is stem-level: two words match when their stems are equal, or when
 * the shorter stem is a prefix of the longer. Substring-anywhere matching was
 * tried and removed — at this vocabulary size it mapped "per" onto *percentile
 * / temperature / experiments*, "commits" onto *common* and *its*, "confident"
 * onto *con*, and "uptime" onto *time*, which is how "how many commits per day"
 * used to rank BenchmarkStrip first.
 *
 * Terms are IDF-weighted, so a word carried by half the catalog ("value",
 * "time", "row") moves the ranking far less than one carried by two charts
 * ("hypnogram", "budget").
 */

const STOP = new Set([
  "a",
  "an",
  "the",
  "is",
  "it",
  "of",
  "to",
  "for",
  "in",
  "on",
  "and",
  "or",
  "my",
  "how",
  "what",
  "which",
  "where",
  "does",
  "do",
  "show",
  "me",
  "chart",
  "charts",
  "microchart",
  "with",
  "by",
  "that",
  "this",
  "i",
  "want",
  "need",
  "over",
  "vs",
  "am",
  "are",
  "be",
  "can",
  "many",
  "much",
]);

/**
 * Longest-first, so "distributions" loses "ions" rather than "s". Applied only
 * when at least 3 characters survive, so short words keep their shape.
 */
const SUFFIXES = [
  "ations",
  "ation",
  "ions",
  "ence",
  "ance",
  "ing",
  "ion",
  "ent",
  "ant",
  "ly",
  "es",
  "ed",
  "s",
];

function stem(word: string): string {
  for (const suffix of SUFFIXES)
    if (word.length - suffix.length >= 3 && word.endsWith(suffix))
      return word.slice(0, word.length - suffix.length);
  return word;
}

/** Break `camelCase` apart so `FoldedDayBand` indexes as three searchable words. */
function split(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function words(text: string): string[] {
  return split(text).map(stem);
}

export function tokenize(text: string): string[] {
  return [
    ...new Set(
      split(text)
        .filter((t) => t.length > 1 && !STOP.has(t))
        .map(stem),
    ),
  ];
}

/** Stems match when equal, or when the shorter is a prefix of the longer. */
function wordMatch(term: string, word: string): boolean {
  if (term === word) return true;
  const [short, long] = term.length < word.length ? [term, word] : [word, term];
  return short.length >= 4 && long.startsWith(short);
}

interface Field {
  words: string[];
  weight: number;
}

function fields(c: ChartEntry): Field[] {
  return [
    { words: [...words(c.name), ...words(c.slug)], weight: 3 },
    { words: words(c.tagline), weight: 3 },
    { words: c.bestFor.flatMap(words), weight: 4 },
    { words: words(c.dataShape), weight: 1 },
    { words: words(c.encoding.channel), weight: 1 },
    { words: words(c.collection), weight: 1 },
  ];
}

/**
 * Document frequency per stem across the catalog, built once per corpus. A term
 * present in most charts says almost nothing about *which* chart to pick.
 */
let cache: { size: number; df: Map<string, number> } | undefined;

function frequencies(charts: ChartEntry[]): { size: number; df: Map<string, number> } {
  if (cache && cache.size === charts.length) return cache;
  const df = new Map<string, number>();
  for (const c of charts) {
    const seen = new Set(fields(c).flatMap((f) => f.words));
    for (const w of seen) df.set(w, (df.get(w) ?? 0) + 1);
  }
  cache = { size: charts.length, df };
  return cache;
}

/** Inverse document frequency, floored so even a ubiquitous term still counts. */
function idf(term: string, { size, df }: { size: number; df: Map<string, number> }): number {
  // A query stem may only appear as a *prefix* of indexed words, so fall back to
  // the broadest form it matches rather than treating it as unseen (and rare).
  let n = df.get(term) ?? 0;
  if (n === 0) for (const [w, count] of df) if (wordMatch(term, w)) n = Math.max(n, count);
  if (n === 0) return 1;
  return Math.max(0.2, Math.log(size / n));
}

/**
 * Score a chart against pre-tokenized query terms, and name the top hit.
 * `corpus` supplies the IDF statistics — pass the full candidate set.
 */
export function score(
  c: ChartEntry,
  terms: string[],
  corpus: ChartEntry[] = [c],
): { score: number; why: string } {
  const stats = frequencies(corpus);
  let total = 0;
  for (const f of fields(c)) {
    // Count each query term at most once per field, so a long field can't
    // dominate purely by length.
    for (const term of terms)
      if (f.words.some((w) => wordMatch(term, w))) total += f.weight * idf(term, stats);
  }
  const why =
    c.bestFor.find((b) => words(b).some((w) => terms.some((t) => wordMatch(t, w)))) ?? c.tagline;
  return { score: total, why };
}
