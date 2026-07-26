// Opt-in `animate` gate: inert on SSR/default; engine is a separate import.
// SSR-hydrated first paint must not replay entrance (flash over painted HTML) —
// only fresh client mounts animate. `prefers-reduced-motion` wins.
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";

/**
 * Published motion tokens for consumer UI — not the per-archetype engine tables.
 * WAAPI can't read `--mc-easing`, so the literal is duplicated; theming-contract.test.ts guards drift.
 */
export const MC_EASE_ENTER = "cubic-bezier(0.22, 1, 0.36, 1)";
/** On-screen morphs (a value updating in place), for consumer UI.
 *  @knipignore — published vocabulary; nothing in the library imports it. */
export const MC_EASE_MOVE = "cubic-bezier(0.77, 0, 0.175, 1)";
/** Coarse beats for consumer UI around a chart.
 *  @knipignore — published vocabulary; the engine's own per-archetype `DUR`
 *  table is what the entrances use. */
export const MC_DUR = {
  /** press / hover / focus feedback */ interact: 120,
  /** value + state updates */ update: 240,
  /** entrance base (3 beats — the engine's story spine) */ enter: 360,
} as const;

/** Entrance archetypes — the family a chart's entrance belongs to. */
export type EntranceArchetype =
  | "draw" // line charts: stroke-dashoffset reveal; riding dots pop at the front
  | "wipe" // area charts: left→right clip reveal
  | "rise" // bar charts: scaleY from the baseline, staggered
  | "reveal" // cell grids: staggered fade
  | "settle" // dot/marker charts: staggered fade + scale
  | "sweep" // progress/fill charts: scaleX from the origin
  | "trail" // discrete marks pop sequentially along the chart's own order
  | "spin" // radial charts: unwind from the center (rotate + scale)
  | "grow" // concentric charts: grow outward from the center
  | "scan" // merged bar/area paths: clip reveal sweeping L→R, growing from `origin`
  | "pop" // single-glyph charts: fade + scale(0.97)
  | "fade"; // text/numeric charts: fade only

export interface EntranceOptions {
  /** Marks to animate; defaults per archetype (data-mc-ink roles). */
  selector?: string;
  /**
   * transform-origin for rise/sweep (default "bottom" / "left").
   * "signed": per-mark — `data-mc-ink="negative"` marks grow from the top
   * (away from the zero line), everything else from the bottom.
   */
  origin?: "bottom" | "top" | "left" | "right" | "center" | "signed";
  /** Per-item stagger in ms (default 30, total capped at 180). */
  stagger?: number;
  /**
   * Sequence marks along real geometry ("x": left→right, "y": top→down) or
   * DOM order ("index"). Implied "index" for trail; spreads delays across
   * `window` instead of the fixed stagger.
   */
  order?: "index" | "x" | "y";
  /** Total span (ms) of an ordered sequence (default 380 trail / 300 others). */
  window?: number;
  /**
   * `draw` only: draw the stroked marks as ONE continuous sweep at constant
   * speed — each mark's duration is proportional to its stroke length and marks
   * are baton-passed end to end (mark i+1 starts exactly as mark i finishes).
   * For a ring of arcs this is constant ANGULAR velocity clockwise from the
   * path's start, so a donut reads as one value accumulating from 12 o'clock —
   * never several segments racing at once. `window` is the whole sweep's span.
   */
  proportional?: boolean;
  /**
   * Elements to cast into the closing act (they enter as the story lands)
   * instead of the quiet opening stage — e.g. a cumulative line that must
   * follow its bars.
   */
  defer?: string;
  /**
   * Stroked connectors that DRAW themselves on after the story marks land and
   * before the voice speaks — a dumbbell's bar between its two dots, a lollipop
   * stem to its dot. stroke-dashoffset, so the line grows to join the marks.
   */
  link?: string;
  /**
   * Max per-mark tracks before the entrance collapses to one whole-svg wipe
   * (default 80 — a year of cells shouldn't spawn 365 animations). Raise it
   * only for a fixed, bounded grid whose per-mark story IS the point (a
   * 100-unit icon array counting up), never for open-ended data.
   */
  maxMarks?: number;
}

type Engine = (
  svg: SVGSVGElement,
  archetype: EntranceArchetype,
  options?: EntranceOptions,
) => () => void;

// Set by motion-engine.ts when the consumer imports `@microcharts/react/motion`.
let engine: Engine | null = null;
let warned = false;

/** @internal Wired by the motion engine on import — not public API. */
export function registerMotionEngine(run: Engine): void {
  engine = run;
}

const subscribeNever = (): (() => void) => () => {};
const clientSnap = (): boolean => false;
const serverSnap = (): boolean => true;

// useLayoutEffect on the client (starts the entrance before first paint, so
// the finished chart never flashes), useEffect on the server (never runs;
// avoids the SSR useLayoutEffect warning).
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Wire the opt-in entrance onto the interactive wrapper. Pass the wrapper ref
 * (the focusable span that contains the composed static SVG).
 */
export function useEntrance(
  ref: RefObject<HTMLElement | null>,
  archetype: EntranceArchetype,
  animate: boolean | undefined,
  options?: EntranceOptions,
): void {
  // `true` on the very first render only when that render is hydrating server
  // HTML. Latched: post-hydration re-renders must not re-arm the entrance.
  const hydrating = useSyncExternalStore(subscribeNever, clientSnap, serverSnap);
  const ssr = useRef(hydrating);

  useClientLayoutEffect(() => {
    if (!animate || ssr.current) return;
    if (!engine) {
      if ((typeof process === "undefined" || process.env.NODE_ENV !== "production") && !warned) {
        warned = true;
        console.warn(
          '[microcharts] `animate` needs the motion engine: add `import "@microcharts/react/motion"` once in client code.',
        );
      }
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    return engine(svg, archetype, options);
    // Entrance runs once per mount by design — remount (key) to replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
