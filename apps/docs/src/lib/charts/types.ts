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
  variantOf?: string;
  tagline: string;
  staticImport: string;
  interactiveImport?: string;
  /**
   * `false` ⇒ the interactive entry has no `animate` prop (HTML-based marks,
   * or motion already IS the encoding) — prop table + playground omit it.
   */
  animates?: boolean;
  /**
   * `false` ⇒ no unit picker (`onActive`, `selectedIndex`, roving keyboard).
   * Lean scalars still take whole-chart `onSelect`; `minimap-strip` and
   * `token-confidence` are deliberate exceptions with their own props.
   * Omitted ⇒ picker. No `interactiveImport` ⇒ outside the split.
   */
  picker?: false;
  /**
   * `false` ⇒ no readout chip — value on the glyph, count-by-counting marks,
   * or named state. Enforced by `src/test/readout-presence.test.ts`.
   */
  readout?: false;
  dataShape: string;
  encoding: { channel: string; precision: string };
  nodeBudget: string;
  /**
   * Authored maximum box, viewBox units — the largest `width`/`height` the
   * chart is drawn and reviewed at. Derived as 4× the intrinsic default box,
   * floored at the largest size the library's own examples use, so it is
   * reproducible rather than a judgment call (`authored-box.test.ts` gates the
   * floor). Past it the geometry stops scaling: caps hold marks at their
   * authored size and the rest of the box becomes whitespace, which is how an
   * `<EventTimeline>` at 823×658 drew a 6-unit bar in 658 units of nothing.
   * Omitted on the charts whose box is set by `cell`, by content, or by CSS —
   * each of those says so in `gotchas`.
   */
  maxWidth?: number;
  maxHeight?: number;
  /**
   * Facts that do not fit a prop description and that a reader has no other way
   * to learn: documented caps, derived inputs, sign and unit handling, sizing
   * knobs that are not `width`/`height`. Shipped in `catalog.json`, where an
   * agent picking a chart will meet them.
   */
  gotchas?: string[];
  bestFor: string[];
  avoidFor: string[];
  props: ChartProp[];
  demo: number[];
  example: { title: string; code: string };
  /** Named literals for snippet variables (`data={accounts}` → definition). */
  sampleData?: SampleData[];
}

export type KnobValue = string | number | boolean;

export type Knob =
  | { kind: "segmented"; key: string; label?: string; options: readonly string[]; init: string }
  | { kind: "toggle"; key: string; label?: string; init: boolean }
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
    ui: { animate: boolean },
  ) => ReactNode;
  codeInteractive?: (
    state: Record<string, KnobValue>,
    data: number[],
    ui: { animate: boolean },
  ) => string;
  interactiveHint?: string;
  /** `false` ⇒ no entrance motion — playground hides the animate toggle. */
  animates?: boolean;
}

/** Named sample-data literal referenced by snippets (`data={accounts}`). */
export interface SampleData {
  name: string;
  code: string;
}

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
  fluid?: boolean;
}

/**
 * Static half — gallery `Preview`, sizing recipes, four-contexts `Mark`.
 *
 * Lives in `lib/charts/<slug>.tsx` and MUST NOT import any `…/interactive`
 * entry. Those are `'use client'`: Next registers every reachable import as an
 * eager client reference for that route — tree-shaking does not cross the boundary.
 * `registry.ts` pulls all 106 static halves; one interactive import here puts
 * ~100 kB gzip of interactive code on `/charts` and every chart doc page.
 * Interactive half: `<slug>.live.tsx`.
 */
export interface ChartModuleStatic {
  entry: ChartEntry;
  Preview: ComponentType;
  playground: PlaygroundSpec;
  recipes: Recipe[];
  Mark: ComponentType<{ data: number[]; width?: number; height?: number }>;
  markCode: (width?: number, height?: number) => string;
  contexts?: ChartContexts;
}

/**
 * Static half plus interactive twin. Composed in `<slug>.live.tsx`; reachable
 * ONLY via lazy maps (`modules.generated`, `preview-live.generated`)
 * so interactive entries land in async chunks, not the route's eager graph.
 */
export interface ChartModule extends ChartModuleStatic {
  /**
   * Interactive twin of `Preview` at the same size/props. Gallery/hero prefer it
   * unless the visitor chooses static or prefers reduced motion.
   *
   * Entrance is opt-in (`animate` defaults false): boards show many charts at
   * once; doc hero (`EntryDemoDual`) passes `animate` for exactly one.
   */
  PreviewLive?: ComponentType<{ animate?: boolean }>;
  /** Static component in authored `contexts` JSX — paired with `ChartLive`. */
  Chart?: ElementType;
  /** Interactive twin of `Chart`; at rest must match static fill/seat parity. */
  ChartLive?: ElementType;
}
