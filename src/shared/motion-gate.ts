// Entrance-motion gate (plan/04 §8.1 amendment, plan/06 §5). The opt-in
// `animate` prop on every `…/interactive` entry routes through this hook.
//
// Contract:
//   - OFF (default) and on the server this is inert: no markup, no styles, no
//     animation artifacts — the rendered output is byte-identical.
//   - The engine ships separately: `import "@microcharts/react/motion"` once,
//     client-side — the same import-once shape as `styles.css` and
//     `./annotations`. Charts that never animate never carry the engine; the
//     gate itself costs each interactive entry almost nothing.
//   - SSR-hydrated mounts NEVER animate. The server frame is already on
//     screen; replaying an entrance over painted content is a flash, not a
//     delight. Only fresh client-side mounts (streamed AI UIs, route changes,
//     toggles) get the entrance — progressive enhancement, zero layout shift.
//   - `prefers-reduced-motion` wins unconditionally.
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from "react";

/** One shared motion vocabulary — every entrance and interaction speaks it. */
export const MC_EASE_ENTER = "cubic-bezier(0.23, 1, 0.32, 1)"; // strong ease-out
export const MC_EASE_MOVE = "cubic-bezier(0.77, 0, 0.175, 1)"; // on-screen morphs
export const MC_DUR = {
  /** press / hover / focus feedback */ interact: 120,
  /** value + state updates */ update: 240,
  /** entrance base */ enter: 420,
} as const;

/** Entrance archetypes — the family a chart's entrance belongs to. */
export type EntranceArchetype =
  | "draw" // line charts: stroke-dashoffset reveal
  | "wipe" // area charts: left→right clip reveal
  | "rise" // bar charts: scaleY from the baseline, staggered
  | "reveal" // cell grids: staggered fade
  | "settle" // dot/marker charts: staggered fade + scale
  | "sweep" // progress/fill charts: scaleX from the origin
  | "pop" // single-glyph charts: fade + scale(0.97)
  | "fade"; // text/numeric charts: fade only

export interface EntranceOptions {
  /** Marks to animate; defaults per archetype (data-mc-ink roles). */
  selector?: string;
  /** transform-origin for rise/sweep (default "bottom" / "left"). */
  origin?: "bottom" | "top" | "left" | "right" | "center";
  /** Per-item stagger in ms (default 30, total capped at 240). */
  stagger?: number;
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
