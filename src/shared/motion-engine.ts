// Entrance-motion engine — `import "@microcharts/react/motion"` once,
// client-side, to enable the `animate` prop on every interactive entry (the
// same import-once shape as styles.css). Registers itself into motion-gate;
// charts that never animate never carry it. One WAAPI implementation per
// entrance archetype so every chart's motion is the same system: one easing,
// one duration scale, one stagger rule.
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
  trail: 200, // per-mark pop; the sequence spans TRAIL_WINDOW
  spin: 400,
  grow: 400,
  scan: 500, // a signal scanning in reads slower — you watch it fill
};

// Sequential choreography: marks pop along the chart's own order (DOM order,
// or real x/y positions). The window is the whole sequence's span.
const TRAIL_WINDOW = 520;

// Progress-class reveals (a line drawing, a clip sweeping) are constant-rate
// motion: a strong ease-out tail makes them sprint then crawl — the "stuck
// mid-line" feel. They get an even easeOutCubic; pops/rises keep the punchy
// curve.
const EASE_EVEN = "cubic-bezier(0.33, 1, 0.68, 1)";
const EASE: Record<EntranceArchetype, string> = {
  draw: EASE_EVEN,
  wipe: EASE_EVEN,
  sweep: EASE_EVEN,
  spin: EASE_EVEN,
  grow: EASE_EVEN,
  rise: MC_EASE_ENTER,
  reveal: MC_EASE_ENTER,
  settle: MC_EASE_ENTER,
  trail: MC_EASE_ENTER,
  pop: MC_EASE_ENTER,
  fade: MC_EASE_ENTER,
  scan: EASE_EVEN, // constant-rate sweep
};

/** Primary marks per archetype — selected by the ink roles charts already emit. */
const MARKS: Record<EntranceArchetype, string> = {
  draw: 'path[data-mc-ink="data"], path[data-mc-ink="accent"]',
  wipe: "", // whole-svg clip reveal; no per-mark selection
  rise: '[data-mc-ink="bar"], rect[data-mc-ink="data"]',
  reveal: '[data-mc-ink="cell"], [data-mc-ink="unit-off"], [data-mc-cat]',
  settle: '[data-mc-ink="point"], circle[data-mc-ink="data"], circle[data-mc-ink="accent"]',
  sweep: '[data-mc-ink="fill"], rect[data-mc-ink="accent"], rect[data-mc-ink="data"]',
  trail: '[data-mc-ink="point"], [data-mc-ink="bar"], [data-mc-ink="accent"], [data-mc-ink="data"]',
  spin: "", // whole-svg radial unwind
  grow: "", // whole-svg concentric growth
  scan: '[data-mc-ink="bar"], [data-mc-ink="fill"], path[data-mc-ink="data"]',
  pop: "",
  fade: "",
};

// Dots that ride a drawn line pop exactly as the draw front reaches them.
const DRAW_DOTS = '[data-mc-ink="point"], circle';

// Three-act orchestration on one beat grid — every entrance tells the same
// story shape: the STAGE (context ink: bands, tracks, backdrop channels)
// settles in quietly first; the STORY (the primary encoding) performs on the
// beat as the stage lands; the VOICE (labels, values, accents, flags) speaks
// as the story finishes. Nothing on the chart ever simply appears.
const BEAT = 120;
const LEAVES = "path, rect, circle, line, ellipse, polygon, polyline, text";
const VOICE_INK =
  '[data-mc-ink="accent"], [data-mc-ink="point"], [data-mc-ink="flag"], [data-mc-ink="label"]';

const STAGGER_CAP = 240;

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
 * Reveal a stroked path/line by sweeping its stroke-dashoffset from full length
 * to zero — the line draws itself on. Shared by the `draw` archetype and the
 * `link` connector act. Dash lengths for `vector-effect: non-scaling-stroke`
 * paths are computed by the browser in SCREEN space (the effect applies
 * post-transform) while getTotalLength answers in user units — at any CSS scale
 * ≠ 1 the dash pattern's repeat would leak in as a phantom second fragment, so
 * scale by the rendered factor (+5% guard; a dash longer than the path is safe).
 * Returns null for a detached/zero-length/non-geometry element.
 */
function dashDraw(
  el: SVGGraphicsElement,
  screenK: number,
  cleanups: (() => void)[],
  timing: KeyframeAnimationOptions,
): Animation | null {
  let len = 0;
  try {
    len = (el as SVGPathElement).getTotalLength();
  } catch {
    return null;
  }
  if (len <= 0) return null;
  const nonScaling =
    el.getAttribute("vector-effect") === "non-scaling-stroke" ||
    getComputedStyle(el).vectorEffect === "non-scaling-stroke";
  const dash = (nonScaling ? len * screenK : len) * 1.05;
  el.style.strokeDasharray = `${dash}`;
  cleanups.push(() => {
    el.style.strokeDasharray = "";
    el.style.strokeDashoffset = "";
  });
  return el.animate([{ strokeDashoffset: `${dash}px` }, { strokeDashoffset: "0px" }], timing);
}

/**
 * Normalized (0..1) position of each mark along the requested order — the
 * chart's own geometry drives the sequence (a skyline rises left to right,
 * a funnel squeezes top to bottom). Falls back to DOM order when geometry
 * can't be read.
 */
function orderNorm(marks: SVGGraphicsElement[], order: "index" | "x" | "y"): number[] {
  const n = marks.length;
  if (order === "index" || n < 2) return marks.map((_, i) => (n > 1 ? i / (n - 1) : 0));
  const pos = marks.map((el, i) => {
    try {
      const b = el.getBBox();
      return order === "x" ? b.x + b.width / 2 : b.y + b.height / 2;
    } catch {
      return i;
    }
  });
  const min = Math.min(...pos);
  const span = Math.max(...pos) - min || 1;
  return pos.map((v) => (v - min) / span);
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
    // (whole-svg archetypes carry no mark set by design.)
    const wholeSvg =
      kind === "pop" || kind === "fade" || kind === "wipe" || kind === "spin" || kind === "grow";
    if (marks.length > (options.maxMarks ?? 80) || (marks.length === 0 && !wholeSvg)) {
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
    const wholeSvgFinal =
      kind === "pop" || kind === "fade" || kind === "wipe" || kind === "spin" || kind === "grow";
    const storyStart = wholeSvgFinal ? 0 : BEAT;
    svg.style.opacity = "";

    // ── casting: every visible element belongs to an act ──────────────────
    const storySet = new Set<Element>(marks);
    const stageEls: SVGGraphicsElement[] = [];
    const voiceEls: SVGGraphicsElement[] = [];
    const linkEls: SVGGraphicsElement[] = [];
    for (const el of svg.querySelectorAll<SVGGraphicsElement>(LEAVES)) {
      if (storySet.has(el)) continue;
      // A LINK (a connector between the story's marks, a stem to a dot) draws
      // itself on once those marks have landed — it belongs to neither the
      // quiet stage nor the closing voice.
      if (options.link && el.matches(options.link)) linkEls.push(el);
      else if (
        el.tagName === "text" ||
        el.matches(VOICE_INK) ||
        (options.defer && el.matches(options.defer))
      )
        voiceEls.push(el);
      else if (!wholeSvgFinal) stageEls.push(el);
    }

    // ACT 1 — the stage settles in quietly (context before content).
    for (const el of stageEls) {
      anims.push(
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 2 * BEAT,
          easing: EASE_EVEN,
          fill: "backwards",
        }),
      );
    }

    // ACT 2 — the story performs, entering on the beat as the stage lands.
    // Dash lengths for `vector-effect: non-scaling-stroke` paths are computed
    // by the browser in SCREEN space (the effect applies post-transform), but
    // getTotalLength answers in user units — at any CSS scale ≠ 1 the dash
    // pattern's repeat would leak in as a phantom second fragment. Scale by
    // the rendered factor (+5% guard; a dash longer than the path is safe).
    const svgRect = svg.getBoundingClientRect();
    const vb = svg.viewBox?.baseVal;
    const screenK = vb && vb.width > 0 && svgRect.width > 0 ? svgRect.width / vb.width : 1;
    const n = marks.length;
    // Sequential choreography: an explicit order (or the trail archetype)
    // spreads the marks across a window along the chart's own geometry.
    const win = options.window ?? (kind === "trail" ? TRAIL_WINDOW : 400);
    const norms =
      options.order || kind === "trail" ? orderNorm(marks, options.order ?? "index") : null;
    marks.forEach((el, i) => {
      // `scan` sweeps ONE shared clip window across the whole chart, so every
      // path it covers (a played/rest split, a peak bar) must start together —
      // the clip does the sequencing; a per-mark stagger would desync the wave.
      const delay =
        kind === "scan" ? storyStart : storyStart + (norms ? norms[i]! * win : stagger(i, n, step));
      const timing = { duration: dur, delay, easing: ease, fill: "backwards" as const };
      switch (kind) {
        case "draw": {
          // stroke-dashoffset only reveals a STROKE. A fill-only mark (a wedge,
          // an area) has no stroke to draw, so `draw` is the wrong archetype for
          // it — author such shapes as a stroked centerline (a ring's value arc)
          // or give them a fill-appropriate archetype instead.
          const a = dashDraw(el, screenK, cleanups, timing);
          if (a) anims.push(a);
          break;
        }
        case "rise":
        case "sweep": {
          const axis = kind === "rise" ? "scaleY" : "scaleX";
          // A mark may pin its own growth edge (`data-mc-origin`) — needed when
          // one chart grows marks toward different edges (a spread's two wedges
          // meeting at the gap, a mirror histogram's bins emanating from a
          // shared axis). Falls back to the chart-wide option, then the default.
          let origin =
            el.getAttribute("data-mc-origin") ??
            options.origin ??
            (kind === "rise" ? "bottom" : "left");
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
        case "trail":
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
                { opacity: 0, transform: kind === "trail" ? "scale(0.6)" : "scale(0.7)" },
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
        case "scan": {
          // A clip window that sweeps left→right while opening from `origin`, so
          // a MERGED bar/area path (one node, for the budget) reveals region by
          // region — the signal scans in — instead of scaling as one block. The
          // clip is measured against the shared `view-box`, NOT each path's own
          // box, so several paths that split one chart (a played/rest waveform,
          // a peak bar) uncover under ONE sweep at the same x — not independently.
          const o = options.origin ?? "left";
          const from =
            o === "center"
              ? "inset(50% 100% 50% 0) view-box"
              : o === "bottom"
                ? "inset(100% 100% 0% 0%) view-box"
                : "inset(0% 100% 0% 0%) view-box";
          anims.push(
            el.animate([{ clipPath: from }, { clipPath: "inset(0% 0% 0% 0%) view-box" }], timing),
          );
          break;
        }
        default:
          break;
      }
    });

    // When the story finishes — the voice waits for it.
    const storySpan = norms ? win + dur : (n > 0 ? stagger(n - 1, n, step) : 0) + dur;
    const storyEnd = wholeSvgFinal ? dur : storyStart + storySpan;

    // ACT 3 (positional) — dots that ride a drawn line pop out of it exactly
    // as the draw front reaches them (delay follows each dot's x position).
    const spoken = new Set<Element>(marks);
    if (kind === "draw" && marks.length > 0) {
      const dots = Array.from(svg.querySelectorAll<SVGGraphicsElement>(DRAW_DOTS)).filter(
        (el) => !spoken.has(el),
      );
      // A lone dot still syncs to its real position along the line — an
      // endpoint dot pops when the front ARRIVES, not at the start.
      const vbWidth = svg.viewBox?.baseVal?.width || 0;
      const dotNorms =
        dots.length === 1 && vbWidth > 0
          ? dots.map((el) => {
              try {
                const b = el.getBBox();
                return Math.min(1, Math.max(0, (b.x + b.width / 2) / vbWidth));
              } catch {
                return 1;
              }
            })
          : orderNorm(dots, "x");
      dots.forEach((el, i) => {
        spoken.add(el);
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
            {
              duration: 180,
              delay: storyStart + dotNorms[i]! * dur * 0.92,
              easing: MC_EASE_ENTER,
              fill: "backwards",
            },
          ),
        );
      });
    }

    // Whole-chart stories (radial unwind, clip reveal, glyph pop).
    if (kind === "spin" || kind === "grow") {
      svg.style.transformOrigin = "50% 50%";
      cleanups.push(() => {
        svg.style.transformOrigin = "";
      });
      anims.push(
        svg.animate(
          [
            {
              opacity: 0,
              transform: kind === "spin" ? "rotate(-30deg) scale(0.9)" : "scale(0.6)",
            },
            { opacity: 1, transform: "none" },
          ],
          { duration: dur, easing: ease },
        ),
      );
    } else if (kind === "wipe") {
      anims.push(
        svg.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
          duration: dur,
          easing: ease,
        }),
      );
    } else if (kind === "pop" || kind === "fade") {
      // Whole-svg reveal: pop adds a subtle scale, fade is opacity only (the
      // quietest option — for merged-path charts with no per-mark story and no
      // meaningful direction; everything else should move).
      anims.push(
        svg.animate(
          [
            { opacity: 0, transform: kind === "pop" ? "scale(0.97)" : "none" },
            { opacity: 1, transform: "none" },
          ],
          { duration: dur, easing: ease },
        ),
      );
    }

    // ACT — the LINK draws: once the story marks have landed, connectors draw
    // themselves on (dot→dot, stem→dot) via stroke-dashoffset, so the shape
    // visibly joins the marks it belongs to before the voice speaks.
    let linkEnd = storyEnd;
    if (linkEls.length > 0) {
      const timing = {
        duration: 300,
        delay: storyEnd,
        easing: EASE_EVEN,
        fill: "backwards" as const,
      };
      for (const el of linkEls) {
        const a = dashDraw(el, screenK, cleanups, timing);
        if (a) {
          anims.push(a);
          spoken.add(el);
        }
      }
      linkEnd = storyEnd + 300;
    }

    // ACT 3 — the voice speaks as the link lands: values and accents pop,
    // labels fade, all on the same final beat.
    const voiceDelay = Math.max(linkEnd - BEAT / 2, storyStart + BEAT);
    for (const el of voiceEls) {
      if (spoken.has(el)) continue;
      // Text is a voice too — it should arrive, not blink on: a tiny lift and
      // settle (≤1 user unit, anchored to its own text-anchor so it never
      // drifts across its gutter). Other voice marks (accents, points) scale-pop.
      const isText = el.tagName === "text";
      const a = isText ? el.getAttribute("text-anchor") : null;
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = isText
        ? `${a === "end" ? "right" : a === "middle" ? "center" : "left"} center`
        : "center";
      cleanups.push(() => {
        el.style.transformBox = "";
        el.style.transformOrigin = "";
      });
      anims.push(
        el.animate(
          isText
            ? [
                { opacity: 0, transform: "translateY(1px) scale(0.98)" },
                { opacity: 1, transform: "translateY(0px) scale(1)" },
              ]
            : [
                { opacity: 0, transform: "scale(0.85)" },
                { opacity: 1, transform: "scale(1)" },
              ],
          {
            duration: 1.5 * BEAT,
            delay: voiceDelay,
            easing: isText ? EASE_EVEN : MC_EASE_ENTER,
            fill: "backwards",
          },
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
