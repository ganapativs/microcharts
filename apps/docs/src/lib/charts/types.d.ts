import type { ComponentType, ElementType, ReactNode } from "react";
/** Per-chart registry contract. One module per slug under `lib/charts/`. */
export type ChartStatus = "stable" | "planned";
export type ChartCollection = "core" | "decision" | "expressive" | "frontier";
export interface ChartProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
  /**
   * `true` ⇒ this prop exists only on the `…/interactive` entry (callbacks,
   * date/announce config). The static default component does not accept it.
   */
  interactive?: boolean;
}
export interface ChartEntry {
  name: string;
  slug: string;
  status: ChartStatus;
  /** Catalog collection — metadata only, never an import-path boundary. */
  collection: ChartCollection;
  /** Set when this catalog entry is a mode of a parent component. */
  variantOf?: string;
  /** One line — what decision it answers. */
  tagline: string;
  staticImport: string;
  interactiveImport?: string;
  /**
   * `false` ⇒ the interactive entry has no `animate` prop (HTML-based marks,
   * or motion already IS the encoding) — prop table + playground omit it.
   */
  animates?: boolean;
  /**
   * `false` ⇒ the interactive entry has NO unit picker, so it does not accept
   * the shared picker props (`onActive`, `onSelect`, `selectedIndex`,
   * `defaultSelectedIndex`) and has no roving keyboard navigation. Two reasons a
   * chart is marked `false`:
   *  - **lean scalar charts** — one value, nothing to rove between (`delta`,
   *    `status-dot`, `progress`, `orbit-status`, …). Selection is whole-chart.
   *  - **deliberate exceptions** — `minimap-strip` is a range/slider primitive
   *    (`onWindowChange`) and `token-confidence` flows inline in text; both keep
   *    their own interaction props instead.
   *
   * Omitted (⇒ `true`) on every multi-unit chart. Charts with no
   * `interactiveImport` at all (`wind-barb`) are outside the split entirely.
   */
  picker?: false;
  dataShape: string;
  /** Primary encoding channel + precision rating. */
  encoding: {
    channel: string;
    precision: string;
  };
  /** Documented SVG node budget for a typical render, e.g. "≤ 6" or "1 per cell". */
  nodeBudget: string;
  bestFor: string[];
  avoidFor: string[];
  props: ChartProp[];
  /** Representative series for live demos + OG + summary quoting. */
  demo: number[];
  example: {
    title: string;
    code: string;
  };
  /** Named literals for snippet variables (`data={accounts}` → definition). */
  sampleData?: SampleData[];
}
export type KnobValue = string | number | boolean;
export type Knob =
  | {
      kind: "segmented";
      key: string;
      label?: string;
      options: readonly string[];
      init: string;
    }
  | {
      kind: "toggle";
      key: string;
      label?: string;
      init: boolean;
    }
  | {
      kind: "range";
      key: string;
      label?: string;
      min: number;
      max: number;
      step?: number;
      init: number;
    };
export interface PlaygroundSpec {
  knobs: Knob[];
  /** Initial demo series (charts whose knobs are the whole story omit it). */
  data?: number[];
  /** Present ⇒ the shell shows a shuffle button; returns the next series. */
  shuffle?: (seed: number) => number[];
  render: (state: Record<string, KnobValue>, data: number[]) => ReactNode;
  code: (state: Record<string, KnobValue>, data: number[]) => string;
  /**
   * Same playground state via the `…/interactive` entry — present ⇒ static ↔
   * interactive switch, animate toggle, and replay. Keep props identical to `render`.
   */
  renderInteractive?: (
    state: Record<string, KnobValue>,
    data: number[],
    ui: {
      animate: boolean;
    },
  ) => ReactNode;
  /** JSX mirroring `renderInteractive` (includes `animate` when on). */
  codeInteractive?: (
    state: Record<string, KnobValue>,
    data: number[],
    ui: {
      animate: boolean;
    },
  ) => string;
  /** Affordance hint under the interactive preview. */
  interactiveHint?: string;
  /**
   * `false` ⇒ no entrance motion — playground hides the animate toggle.
   */
  animates?: boolean;
}
/** Named sample-data literal referenced by snippets (`data={accounts}`). */
export interface SampleData {
  /** Variable name, e.g. `"accounts"`. */
  name: string;
  /** Full definition, e.g. `const accounts = […]`. */
  code: string;
}
/** One placement: sentence, cell, KPI, or tab. */
export interface ContextHome {
  render: () => ReactNode;
  /** Copy-complete JSX; vars resolve via `sampleData`. */
  code: string;
}
export interface ChartContexts {
  sentence: ContextHome;
  cell: ContextHome;
  kpi: ContextHome;
  tab: ContextHome;
  /** Muted caveat under the four-homes grid when a placement is a stretch. */
  note?: string;
}
export interface Recipe {
  label: string;
  code: string;
  node: ReactNode;
  /** Render inside the visibly-constrained fluid frame. */
  fluid?: boolean;
}
/**
 * Static half of a chart module — everything the SERVER needs (gallery
 * `Preview`, `sizing` recipes, the four-contexts `Mark`).
 *
 * Lives in `lib/charts/<slug>.tsx` and MUST NOT import any `…/interactive`
 * entry. Those are `'use client'` modules: Next registers every one reachable
 * from a server component's import graph as an eager client reference for that
 * route — importing is enough, it never has to render, and tree-shaking does
 * not cross the boundary. `registry.ts` pulls all 106 of these, so a single
 * interactive import here puts the whole catalog's interactive code on the
 * critical path of `/charts` and every chart doc page (~100 kB gzip, measured).
 * The interactive half lives in `<slug>.live.tsx`.
 */
export interface ChartModuleStatic {
  entry: ChartEntry;
  /** Static render for the gallery card. */
  Preview: ComponentType;
  playground: PlaygroundSpec;
  recipes: Recipe[];
  /** Chart at context scale, for the four-contexts grid. */
  Mark: ComponentType<{
    data: number[];
    width?: number;
    height?: number;
  }>;
  /** JSX string mirroring `Mark` at a given size. */
  markCode: (width?: number, height?: number) => string;
  /** Authored placements; absent ⇒ generic fallback. */
  contexts?: ChartContexts;
}
/**
 * Full chart module — the static half plus its interactive twin. Composed in
 * `lib/charts/<slug>.live.tsx` and reachable ONLY through the lazy maps
 * (`modules.generated`, `preview-live.generated`, `home/hero-modules`), so the
 * interactive entries land in async chunks instead of a route's eager graph.
 */
export interface ChartModule extends ChartModuleStatic {
  /**
   * Interactive-entry twin of `Preview` at the SAME size/props. Gallery +
   * homepage hero prefer it unless the visitor chooses static or prefers reduced
   * motion (then they stay on `Preview`).
   *
   * The entrance is OPT-IN (`animate` defaults to false): the boards that render
   * these — the /charts gallery, the homepage catalog tiles — show many charts at
   * once, and a hundred simultaneous entrances read as noise. The chart-doc hero
   * (`EntryDemoDual`) passes `animate` because it renders exactly one.
   */
  PreviewLive?: ComponentType<{ animate?: boolean }>;
  /**
   * Static chart component identity used inside authored `contexts` JSX — paired
   * with `ChartLive` so four-homes can swap to the interactive twin in place.
   */
  Chart?: ElementType;
  /**
   * Interactive twin of `Chart` (same props). Four-homes prefer this when set;
   * at rest it must match the static footprint (library fill/seat parity).
   */
  ChartLive?: ElementType;
}
