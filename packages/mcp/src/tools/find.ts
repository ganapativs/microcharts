import { STABLE_CHARTS } from "../catalog";
import { score, tokenize } from "../keywords";

export interface FindResult {
  slug: string;
  name: string;
  tagline: string;
  dataShape: string;
  why: string;
}

export interface FindOptions {
  dataShape?: string;
  limit?: number;
}

/** Rank stable charts against a question — pure over the snapshot, no render. */
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
