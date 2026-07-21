import type { ChartCollection } from "@/lib/charts/types";
import { CATALOG } from "@/lib/docs-facts";

export type CollectionDef = {
  key: ChartCollection;
  label: string;
  /** One-line shelf label in the full-catalog grid. */
  blurb: string;
  /** SEO + hub H1 support. */
  title: string;
  description: string;
  /** Short editorial intro on the hub page. */
  intro: string;
  goodFor: string;
  notFor: string;
};

/** Catalog shelves — shared by /charts, /charts/[collection], and the dock. */
export const COLLECTIONS: readonly CollectionDef[] = [
  {
    key: "core",
    label: "Core",
    blurb: "Everyday charts.",
    title: "Core React microcharts",
    description: `Everyday word-sized React charts — sparklines, bars, bullets, deltas, and the marks you reach for first. ${CATALOG.collections.core} core types in @microcharts/react.`,
    intro:
      "Core is the everyday shelf: trends, magnitudes, change, attainment, and the small comparisons that sit in a sentence, a table cell, or a KPI. Start here when you know the shape of the answer and just need the mark.",
    goodFor: "Sparklines, bars, bullets, deltas, heat strips, calendars — the common inline jobs.",
    notFor:
      "One-question decision instruments (Decision) or unusual encodings (Expressive / Frontier).",
  },
  {
    key: "decision",
    label: "Decision",
    blurb: "Tuned to one question.",
    title: "Decision React microcharts",
    description: `Word-sized React charts tuned to one decision — budgets, benchmarks, forecasts, A/B, and control. ${CATALOG.collections.decision} decision types in @microcharts/react.`,
    intro:
      "Decision charts answer one question at a glance: are we on track, above the line, beating the control, burning the budget. Reach for this shelf when the mark should resolve a choice, not just show a shape.",
    goodFor: "Error budgets, burn charts, benchmarks, forecasts, A/B strips, control charts.",
    notFor:
      "General trends without a decision line (Core) or decorative / exploratory forms (Expressive).",
  },
  {
    key: "expressive",
    label: "Expressive",
    blurb: "Unusual, apt encodings.",
    title: "Expressive React microcharts",
    description: `Unusual, apt word-sized encodings for React — when a familiar sparkline is the wrong metaphor. ${CATALOG.collections.expressive} expressive types in @microcharts/react.`,
    intro:
      "Expressive charts use an uncommon shape on purpose: the encoding fits the story better than a line or bar would. Still word-sized, still honest — just not the default shelf.",
    goodFor: "Metaphors that earn their keep — when the form matches the domain.",
    notFor: "Default KPI trends (Core) or single-question ops instruments (Decision).",
  },
  {
    key: "frontier",
    label: "Frontier",
    blurb: "Newer word-sized forms.",
    title: "Frontier React microcharts",
    description: `Newer word-sized React chart forms — calibration, traces, windows, and marks still earning their place in the catalog. ${CATALOG.collections.frontier} frontier types in @microcharts/react.`,
    intro:
      "Frontier is the newer shelf: forms that passed the admission bar and are still proving themselves in real UIs. Same grammar and size budgets as the rest of the catalog.",
    goodFor: "Calibration, trace folds, dual windows, and other recent word-sized instruments.",
    notFor: "If a Core or Decision chart already answers the question — prefer the calmer shelf.",
  },
] as const;

export const COLLECTION_KEYS = COLLECTIONS.map((c) => c.key);

export function getCollection(key: string): CollectionDef | undefined {
  return COLLECTIONS.find((c) => c.key === key);
}

export function isChartCollection(key: string): key is ChartCollection {
  return COLLECTION_KEYS.includes(key as ChartCollection);
}

export const COLLECTION_ORDER: Record<ChartCollection, number> = {
  core: 0,
  decision: 1,
  expressive: 2,
  frontier: 3,
};
