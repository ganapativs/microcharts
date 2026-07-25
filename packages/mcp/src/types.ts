/**
 * Local mirror of the catalog shapes the package consumes. Kept self-contained
 * (not imported from the docs app) so the published package never reaches into
 * `apps/docs`. The `catalog-sync` test guarantees `catalog.generated.json` still
 * matches the live registry, so these types can't silently drift.
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
  /** Copy-runnable snippet — sample-data definitions already prepended. */
  example: { title: string; code: string };
  /**
   * A ready-to-render JSON prop bag derived from `example` at generation time —
   * what `render_microchart` actually takes. Present for every chart whose
   * example is fully serializable; absent when the example is mostly callbacks.
   */
  sample?: Record<string, unknown>;
}

/** The committed snapshot: catalog data + the library version it was cut from. */
export interface Catalog {
  /** `@microcharts/react` version this snapshot was generated from. */
  library: string;
  /** Shared grammar/layout/i18n props every chart accepts. */
  sharedProps: ChartProp[];
  charts: ChartEntry[];
}
