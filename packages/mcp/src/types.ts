/**
 * Local mirror of catalog shapes — not imported from `apps/docs`. `catalog-sync`
 * test keeps `catalog.generated.json` aligned with the live registry.
 */

export interface ChartProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
  /** `true` ⇒ only on the `…/interactive` entry (callbacks, announce config). */
  interactive?: boolean;
}

export interface ChartEntry {
  name: string;
  slug: string;
  status: "stable" | "planned";
  collection: "core" | "decision" | "expressive" | "frontier";
  variantOf?: string;
  tagline: string;
  staticImport: string;
  interactiveImport?: string;
  animates?: boolean;
  picker?: false;
  dataShape: string;
  encoding: { channel: string; precision: string };
  nodeBudget: string;
  bestFor: string[];
  avoidFor: string[];
  props: ChartProp[];
  example: { title: string; code: string };
  /**
   * JSON prop bag from `example` at gen time — what `render_microchart` takes.
   * Absent when the example is not fully serializable.
   */
  sample?: Record<string, unknown>;
}

/** Committed snapshot + library version stamp. */
export interface Catalog {
  library: string;
  sharedProps: ChartProp[];
  charts: ChartEntry[];
}
