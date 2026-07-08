import type { ComponentType, ReactNode } from "react";

/**
 * Per-chart registry contract (plan/21 §6.0.A). Every chart contributes ONE
 * module under `lib/charts/‹slug›.tsx` implementing `ChartModule`; the shared
 * shells (gallery, playground, interactive demo, sizing, four-contexts,
 * showcase) interpret it. No per-slug switches anywhere else.
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
  /** Full interactive-demo panel (compose the shared `DemoPanel`). */
  InteractiveDemo: ComponentType;
  playground: PlaygroundSpec;
  recipes: Recipe[];
  /** The chart at context scale, for the four-contexts grid. */
  Mark: ComponentType<{ data: number[]; width?: number; height?: number }>;
  /** JSX string mirroring `Mark` at a given size (docs-as-tests). */
  markCode: (width?: number, height?: number) => string;
}
