// Naming templates for series whose units carry a `labels` name (a month, a
// build, a cohort). A separate MODULE so charts that never take `labels` don't
// bundle the wording. Aggregate: strings.ts `EN`.
//
// Both templates JOIN a name to text the chart already composed, so one pair
// serves every chart instead of a labeled variant of each chart's own sentence.
import type { SummaryStrings } from "./summary.js";

export type NamedStrings = Pick<SummaryStrings, "named" | "namedChip">;

// Declared as bare functions, not read off `EN_NAMED`: a chart that never
// localizes these tree-shakes the dictionary object away and keeps only the one
// template it actually calls.
const DEF_NAMED: NamedStrings["named"] = (name, body) => `${name}. ${body}`;
const DEF_CHIP: NamedStrings["namedChip"] = (name, body) => `${name} · ${body}`;

export const EN_NAMED: NamedStrings = { named: DEF_NAMED, namedChip: DEF_CHIP };

/**
 * The two tokens are OPTIONAL on a chart's `strings` prop, and these helpers fall
 * back to `EN_NAMED`. A chart keeps its existing zero-cost `strings = EN_SERIES`
 * default instead of allocating a merged dictionary it only needs when a caller
 * both passes `labels` and localizes — which is what kept the byte cost of this
 * feature off `sparkline`, the entry pinned at the interactive wall.
 */
type Tokens = Partial<NamedStrings> | undefined;

// Both take the raw `labels?.[i]` lookup: a hole, an out-of-range index and an
// empty string are all "unnamed", so the truthy check here saves every caller a
// guard (and saves the catalog a shared `nameAt` helper).

/** Live-region sentence for a unit, named when `labels` supplied one. */
export function announceNamed(body: string, name: string | undefined, s: Tokens): string {
  return name ? (s?.named ?? DEF_NAMED)(name, body) : body;
}

/** Visible chip text for a unit, named when `labels` supplied one. */
export function chipNamed(body: string, name: string | undefined, s: Tokens): string {
  return name ? (s?.namedChip ?? DEF_CHIP)(name, body) : body;
}
