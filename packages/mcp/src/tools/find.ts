import { STABLE_CHARTS } from "../catalog";
import { score, tokenize } from "../keywords";

export interface FindResult {
  slug: string;
  name: string;
  tagline: string;
  dataShape: string;
  /** Why this chart matched — the bestFor phrase or tagline that hit. */
  why: string;
}

export interface FindOptions {
  /** Filter to charts whose dataShape contains this substring (e.g. "number[]"). */
  dataShape?: string;
  /** Max results (default 6). */
  limit?: number;
}

/**
 * Rank the catalog against a natural-language question ("is it trending?",
 * "error budget", "part to whole"). Pure over the committed snapshot — no
 * rendering, no library import. Returns only stable charts (the wireable set),
 * best first; empty when nothing scores.
 */
export function findChart(question: string, opts: FindOptions = {}): FindResult[] {
  const terms = tokenize(question);
  const limit = Math.min(Math.max(opts.limit ?? 6, 1), 20);
  const shape = opts.dataShape?.toLowerCase();

  const scored = STABLE_CHARTS.filter((c) => !shape || c.dataShape.toLowerCase().includes(shape))
    .map((c) => ({ c, ...score(c, terms, STABLE_CHARTS) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ c, why }) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    dataShape: c.dataShape,
    why,
  }));
}
