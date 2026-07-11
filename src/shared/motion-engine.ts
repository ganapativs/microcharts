// Entrance-motion engine — `import "@microcharts/react/motion"` once,
// client-side, to enable the `animate` prop on every interactive entry (the
// same import-once shape as styles.css). Registers itself into motion-gate;
// charts that never animate never carry it. One WAAPI implementation per
// entrance archetype so every chart's motion is the same system: one easing,
// one duration scale, one stagger rule (plan/06 §5).
//
// Rules enforced here:
//   - transform / opacity / stroke-dashoffset only (GPU-friendly; no layout).
//   - Starts only when the chart is on screen (one shared IntersectionObserver;
//     off-screen charts hold their first frame and never run work).
//   - Interruption-safe: marks keep their pointer events the whole time (the
//     interactive wrapper owns the single listener), data re-renders mutate
//     attributes underneath running transform/opacity tracks without a reset,
//     and unmount/`beforeprint` resolve instantly to the finished frame.
import {
  registerMotionEngine,
  MC_EASE_ENTER,
  type EntranceArchetype,
  type EntranceOptions,
} from "./motion-gate.js";

// The motion vocabulary is public API here so consumer UI around a chart can
// speak the same language (chips, readouts, toolbars that move with a chart).
export { MC_DUR, MC_EASE_ENTER, MC_EASE_MOVE } from "./motion-gate.js";
export type { EntranceArchetype, EntranceOptions } from "./motion-gate.js";

interface Run {
  finish: () => void;
}

// Word-sized marks read fast — entrances sit at the top of the UI duration
// scale only where the motion IS the encoding reveal (a line drawing on).
const DUR: Record<EntranceArchetype, number> = {
  draw: 450,
  wipe: 400,
  rise: 350,
  reveal: 300,
  settle: 300,
  sweep: 400,
  pop: 200,
  fade: 250,
};

// Progress-class reveals (a line drawing, a clip sweeping) are constant-rate
// motion: a strong ease-out tail makes them sprint then crawl — the "stuck
// mid-line" feel. They get an even easeOutCubic; pops/rises keep the punchy
// curve.
const EASE_EVEN = "cubic-bezier(0.33, 1, 0.68, 1)";
const EASE: Record<EntranceArchetype, string> = {
  draw: EASE_EVEN,
  wipe: EASE_EVEN,
  sweep: EASE_EVEN,
  rise: MC_EASE_ENTER,
  reveal: MC_EASE_ENTER,
  settle: MC_EASE_ENTER,
  pop: MC_EASE_ENTER,
  fade: MC_EASE_ENTER,
};

/** Primary marks per archetype — selected by the ink roles charts already emit. */
const MARKS: Record<EntranceArchetype, string> = {
  draw: 'path[data-mc-ink="data"], path[data-mc-ink="accent"]',
  wipe: "", // whole-svg clip reveal; no per-mark selection
  rise: '[data-mc-ink="bar"], rect[data-mc-ink="data"]',
  reveal: '[data-mc-ink="cell"], [data-mc-ink="unit-off"], [data-mc-cat]',
  settle: '[data-mc-ink="point"], circle[data-mc-ink="data"], circle[data-mc-ink="accent"]',
  sweep: '[data-mc-ink="fill"], rect[data-mc-ink="accent"], rect[data-mc-ink="data"]',
  pop: "",
  fade: "",
};

const STAGGER_CAP = 240;

// Support ink (bands, fills, labels, reference marks) arrives late and soft,
// after the primary marks have committed — one choreographed entrance.
const SUPPORT =
  'text, [data-mc-ink="band"], [data-mc-ink="fill"], [data-mc-ink="muted"], [data-mc-ink="region"], [data-mc-ink="point"], [data-mc-ink="label"]';

// One observer for every entrance on the page; fires each chart once.
let io: IntersectionObserver | null = null;
const pending = new WeakMap<Element, () => void>();
const active = new Set<Run>();

function observeOnce(el: Element, start: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    start();
    return () => {};
  }
  io ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io?.unobserve(e.target);
      const cb = pending.get(e.target);
      pending.delete(e.target);
      cb?.();
    }
  });
  pending.set(el, start);
  io.observe(el);
  return () => {
    io?.unobserve(el);
    pending.delete(el);
  };
}

// Printing must always capture the finished frame.
if (typeof window !== "undefined") {
  window.addEventListener("beforeprint", () => {
    for (const run of Array.from(active)) run.finish();
  });
}

function stagger(i: number, n: number, step: number): number {
  return i * Math.min(step, n > 1 ? STAGGER_CAP / (n - 1) : 0);
}

/**
 * Run the entrance for one chart. Returns a cancel function that resolves the
 * chart to its finished static frame (used on unmount).
 */
export function runEntrance(
  svg: SVGSVGElement,
  archetype: EntranceArchetype,
  options: EntranceOptions = {},
): () => void {
  // A hidden document can't render frames (background tab, print, headless
  // capture) — never hold content hostage waiting for one. The chart simply
  // stays at its static frame.
  if (document.hidden) return () => {};
  const anims: Animation[] = [];
  const cleanups: (() => void)[] = [];
  const step = options.stagger ?? 30;

  const finishAll = (): void => {
    for (const a of anims) {
      try {
        a.finish();
      } catch {
        a.cancel();
      }
    }
    settle();
  };
  const run: Run = { finish: finishAll };

  // Restore every inline style the entrance touched; CSS + presentation
  // attributes take back over, so the at-rest chart is byte-identical
  // (including dropping `style=""` husks left by clearing inline styles).
  const settle = (): void => {
    active.delete(run);
    for (const c of cleanups.splice(0)) c();
    svg.style.opacity = "";
    if (svg.getAttribute("style") === "") svg.removeAttribute("style");
    for (const el of svg.querySelectorAll<SVGElement>("[style='']")) el.removeAttribute("style");
  };

  const start = (): void => {
    active.add(run);
    let kind = archetype;
    let marks = MARKS[kind]
      ? Array.from(svg.querySelectorAll<SVGGraphicsElement>(options.selector ?? MARKS[kind]))
      : [];
    // A bare fade is not an entrance. Dense grids (a year of cells) don't get
    // 365 tracks, and a selector that matches nothing must not degrade to
    // nothing — both fall back to the O(1) clip reveal, which still MOVES.
    // (wipe/pop/fade are whole-svg by design — an empty mark set is intended.)
    if (
      marks.length > 80 ||
      (marks.length === 0 && kind !== "pop" && kind !== "fade" && kind !== "wipe")
    ) {
      if (
        marks.length === 0 &&
        (typeof process === "undefined" || process.env.NODE_ENV !== "production")
      ) {
        console.warn(
          `[microcharts] entrance "${kind}" matched no marks in .${svg.getAttribute("class") ?? "svg"} — falling back to wipe. Check the selector.`,
        );
      }
      kind = "wipe";
      marks = [];
    }
    const ease = EASE[kind];
    const dur = DUR[kind];

    // The held first frame hands off to a short fade — nothing ever jumps.
    // Whole-svg archetypes carry their own reveal; a parallel fade would
    // double-expose and wash the motion out.
    svg.style.opacity = "";
    if (kind !== "wipe" && kind !== "pop") {
      anims.push(svg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: ease }));
    }

    const n = marks.length;
    marks.forEach((el, i) => {
      const delay = stagger(i, n, step);
      const timing = { duration: dur, delay, easing: ease, fill: "backwards" as const };
      switch (kind) {
        case "draw": {
          let len = 0;
          try {
            len = (el as SVGPathElement).getTotalLength();
          } catch {
            /* detached / non-path */
          }
          if (len > 0) {
            el.style.strokeDasharray = `${len}`;
            cleanups.push(() => {
              el.style.strokeDasharray = "";
              el.style.strokeDashoffset = "";
            });
            anims.push(
              el.animate([{ strokeDashoffset: `${len}px` }, { strokeDashoffset: "0px" }], timing),
            );
          }
          break;
        }
        case "rise":
        case "sweep": {
          const axis = kind === "rise" ? "scaleY" : "scaleX";
          let origin = options.origin ?? (kind === "rise" ? "bottom" : "left");
          // Bars extend AWAY from the zero line — negative marks grow toward
          // their own side of it (down for columns, left for horizontal bars).
          if (origin === "signed") {
            const neg = el.matches('[data-mc-ink="negative"]');
            origin = kind === "rise" ? (neg ? "top" : "bottom") : neg ? "right" : "left";
          }
          el.style.transformBox = "fill-box";
          el.style.transformOrigin = origin;
          cleanups.push(() => {
            el.style.transformBox = "";
            el.style.transformOrigin = "";
          });
          anims.push(
            el.animate([{ transform: `${axis}(0.001)` }, { transform: `${axis}(1)` }], timing),
          );
          break;
        }
        case "settle": {
          el.style.transformBox = "fill-box";
          el.style.transformOrigin = "center";
          cleanups.push(() => {
            el.style.transformBox = "";
            el.style.transformOrigin = "";
          });
          anims.push(
            el.animate(
              [
                { opacity: 0, transform: "scale(0.6)" },
                { opacity: 1, transform: "scale(1)" },
              ],
              timing,
            ),
          );
          break;
        }
        case "reveal":
          anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], timing));
          break;
        default:
          break;
      }
    });

    // Whole-chart archetypes (and the coherent backdrop for mark archetypes).
    if (marks.length > 0) {
      const markSet = new Set<Element>(marks);
      for (const el of svg.querySelectorAll<SVGGraphicsElement>(SUPPORT)) {
        if (markSet.has(el)) continue;
        anims.push(
          el.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 200,
            delay: Math.min(dur * 0.7, 320),
            easing: ease,
            fill: "backwards",
          }),
        );
      }
    }

    if (kind === "wipe") {
      anims.push(
        svg.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
          duration: dur,
          easing: ease,
        }),
      );
    } else if (kind === "pop") {
      anims.push(
        svg.animate(
          [
            { opacity: 0, transform: "scale(0.97)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: dur, easing: ease },
        ),
      );
    }

    if (anims.length > 0) {
      Promise.allSettled(anims.map((a) => a.finished)).then(settle);
    } else {
      settle();
    }
  };

  // Hold the first frame hidden from the caller's pre-paint layout effect
  // until the chart is on screen and the entrance takes over — the finished
  // chart never flashes before its own entrance.
  svg.style.opacity = "0";
  const unobserve = observeOnce(svg, start);

  return () => {
    unobserve();
    finishAll();
  };
}

registerMotionEngine(runEntrance);
