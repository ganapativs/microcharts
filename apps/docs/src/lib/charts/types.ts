import type { ComponentType, ReactNode } from "react";

/**
 * Per-chart registry contract (plan/21 §6.0.A). Every chart contributes ONE
 * module under `lib/charts/‹slug›.tsx` implementing `ChartModule`; the shared
 * shells (gallery, playground, sizing, four-contexts, showcase) interpret it.
 * No per-slug switches anywhere else.
 */

export type ChartStatus = "stable" | "planned";
export type ChartCollection = "core" | "decision" | "expressive" | "frontier";

export interface ChartProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ChartEntry {
  name: string;
  slug: string;
  status: ChartStatus;
  /** Catalog collection — metadata only, never an import-path boundary. */
  collection: ChartCollection;
  /** Set when this catalog entry is a mode of a parent component (plan/21 §2). */
  variantOf?: string;
  /** One line, direct — what decision it answers. */
  tagline: string;
  staticImport: string;
  interactiveImport?: string;
  /**
   * `false` ⇒ the interactive entry has no `animate` prop (HTML-based marks,
   * or motion already IS the encoding) — prop table + playground omit it.
   */
  animates?: boolean;
  dataShape: string;
  /** Primary encoding channel + honest precision rating (plan/21 §4). */
  encoding: { channel: string; precision: string };
  /** Documented SVG node budget for a typical render, e.g. "≤ 6" or "1 per cell". */
  nodeBudget: string;
  bestFor: string[];
  avoidFor: string[];
  props: ChartProp[];
  /** A representative series/values used for live demos + OG + summary quoting. */
  demo: number[];
  example: { title: string; code: string };
  /**
   * Named literals backing every snippet variable across the page's snippets
   * (`data={accounts}` → the `accounts` definition). Powers the sample-data
   * disclosure so copy-paste always runs — no phantom variables. Optional during
   * the per-chart migration; a gate flips it to required once all charts declare it.
   */
  sampleData?: SampleData[];
}

/* ── playground (declarative — the shared engine renders knobs + shell) ──── */

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
  /** Initial demo series (charts whose knobs are the whole story omit it). */
  data?: number[];
  /** Present ⇒ the shell shows a shuffle button; returns the next series. */
  shuffle?: (seed: number) => number[];
  render: (state: Record<string, KnobValue>, data: number[]) => ReactNode;
  code: (state: Record<string, KnobValue>, data: number[]) => string;
  /**
   * The same playground state rendered through the `…/interactive` entry —
   * present ⇒ the shell grows a static ↔ interactive mode switch, an animate
   * toggle, and a replay control. Keep the props identical to `render` so the
   * two modes are visibly the same chart.
   */
  renderInteractive?: (
    state: Record<string, KnobValue>,
    data: number[],
    ui: { animate: boolean },
  ) => ReactNode;
  /** JSX mirroring `renderInteractive` (docs-as-tests; includes `animate` when on). */
  codeInteractive?: (
    state: Record<string, KnobValue>,
    data: number[],
    ui: { animate: boolean },
  ) => string;
  /** One-line affordance hint shown under the interactive preview. */
  interactiveHint?: string;
  /**
   * `false` ⇒ this chart has no entrance motion (HTML-based marks, or motion
   * already IS the encoding) — the playground hides the animate toggle.
   */
  animates?: boolean;
}

/* ── copy-complete snippets ──────────────────────────────────────────────── */

/**
 * A named sample-data literal that a chart's snippets reference (`data={accounts}`).
 * Surfaced once per page in a collapsible "sample data" disclosure so every
 * copy-pasted snippet actually runs — no phantom variables (plan/20 docs-as-tests).
 */
export interface SampleData {
  /** The variable a snippet binds to, e.g. `"accounts"`. */
  name: string;
  /** Its full definition, e.g. `const accounts = [\n  { label: "Acme", value: 3 },\n];`. */
  code: string;
}

/* ── four homes (chart-true placements) ──────────────────────────────────── */

/**
 * One placement home. The host copy is written for THIS chart's job — a StatusDot
 * sits in "the API is ● operational", a SproutRow in an account-health column —
 * never a generic "signups held steady" template.
 */
export interface ContextHome {
  /** Realistic host with the live mark embedded (sentence, row, card, tab). */
  render: () => ReactNode;
  /** Copy-complete JSX for the placement; vars resolve via `sampleData`. */
  code: string;
}

export interface ChartContexts {
  sentence: ContextHome;
  cell: ContextHome;
  kpi: ContextHome;
  tab: ContextHome;
}

/* ── sizing recipes ──────────────────────────────────────────────────────── */

export interface Recipe {
  label: string;
  code: string;
  node: ReactNode;
  /** Render inside the visibly-constrained fluid frame. */
  fluid?: boolean;
}

/* ── the module ──────────────────────────────────────────────────────────── */

export interface ChartModule {
  entry: ChartEntry;
  /** Static render for the gallery card. */
  Preview: ComponentType;
  /** Homepage instrument-strip card (interactive entry, fixed size). */
  showcase: { hint: string; Node: ComponentType };
  playground: PlaygroundSpec;
  recipes: Recipe[];
  /** The chart at context scale, for the four-contexts grid. */
  Mark: ComponentType<{ data: number[]; width?: number; height?: number }>;
  /** JSX string mirroring `Mark` at a given size (docs-as-tests). */
  markCode: (width?: number, height?: number) => string;
  /**
   * The four placement homes, authored for this chart. When present the shared
   * grid renders these; absent, it falls back to a generic template (migration only).
   */
  contexts?: ChartContexts;
}
