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

/**
 * The committed snapshot, exactly as `catalog.generated.json` holds it — no
 * version stamp. The stamp is injected at build time instead (see `version.ts`),
 * because the library version is only known after `changeset version` runs, one
 * commit later than every PR that regenerates this file.
 */
export interface CatalogData {
  sharedProps: ChartProp[];
  charts: ChartEntry[];
}

/** The snapshot as it is served: `CatalogData` plus the build-time stamp. */
export interface Catalog extends CatalogData {
  library: string;
}
