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
 *   - bestFor overlap (+1 each, cap +2) — shared documented use cases
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

function channelTokens(channel: string): Set<string> {
  return new Set(
    channel
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !CHANNEL_STOPWORDS.has(w)),
  );
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
  let bestFor = 0;
  for (const b of candidate.bestFor) if (self.bestFor.includes(b)) bestFor += 1;
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
