import type { ChartEntry, Knob } from "@/lib/charts/types";

/**
 * The serializable slice of a chart's playground spec, extracted server-side
 * (`sections-server.tsx`) so the island can render its complete chrome — knob
 * rail, drawers, mode switch, code block — before the lazy live module lands.
 * Only the chart pixels wait for the module, inside the stage's fixed frame,
 * so the panel's size never changes when it arrives.
 */
export interface PlaygroundSkeleton {
  entry: ChartEntry;
  knobs: Knob[];
  data?: number[] | undefined;
  animates?: boolean | undefined;
  interactiveHint?: string | undefined;
  hasShuffle: boolean;
  /** Prop-level shuffle applies (measurement props on the first-paint render). */
  hasPropShuffle: boolean;
  hasInteractive: boolean;
  /** The island's exact first-paint code block (imports + JSX), from the
   *  drift-tested `DOCS_CODE` snapshot. */
  initialCode: string;
}
