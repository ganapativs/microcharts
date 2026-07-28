"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_FRAMES } from "./hero-frames";

/**
 * The fold's rotating claim: four sentences, each with its own mark set inside
 * it (`hero-frames.tsx`), and a dot rail to step through them.
 *
 * All four sentences share ONE grid cell (`.hero-say`), so the box is as tall as
 * the tallest of them at every width, in server HTML — nothing below can be
 * pushed by a frame that is two lines on a laptop and four on a phone. Frames
 * animate on `opacity` and `translate` only, so a swap costs no layout, and the
 * crossfade must stay linear and undelayed or the box goes visibly blank at the
 * handover.
 *
 * The callout tree is CSS: five labels in five equal grid columns, the bus
 * spanning the outer two column centres, each drop falling into its own column.
 * The only measured value is `--fan-x`, the stem's aim, which follows the mark
 * from claim to claim.
 */

/** How long a frame holds before the next one takes over. */
const DWELL_MS = 6000;
/** Must match `--hero-swap` in home.css — how long the outgoing frame takes to go. */
const SWAP_MS = 460;

/** A property of the mark, and which of the two rows names it. */
type Callout = { text: string; row: 0 | 1 };

export function HeroSentence({ callouts }: { callouts: readonly Callout[] }) {
  const sayRef = useRef<HTMLDivElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  /** The frame on its way out, so it can travel the opposite way. */
  const [leaving, setLeaving] = useState<number | null>(null);
  /** A reader inspecting the mark or stepping the rail, or a hidden tab.
   *
   *  A REF, not state: nothing rendered reads it, so as state every pointer enter
   *  and leave re-rendered the claim box, the rail and the tree. The clock reads
   *  it at the top of each tick rather than taking it as a dependency — as a
   *  dependency, brushing past the fold restarted the six-second dwell. */
  const held = useRef(false);
  /** Whether the stem has a real x yet. The server has no idea where the mark
   *  landed, so the stem does not exist until a browser has measured it. */
  const [aimed, setAimed] = useState(false);

  /** Aim the stem at the ACTIVE frame's mark. Idempotent: a no-op resize writes
   *  nothing.
   *
   *  It writes a signed PIXEL OFFSET FROM THE MIDDLE, onto the stem itself:
   *  the stem's `left` stays a static `50%` so this drives `translate` and the
   *  travel runs on the compositor (transitioning `left` re-ran layout every
   *  frame), and a custom property set on the fan would invalidate style for the
   *  fan's whole subtree instead of the one element that reads it. */
  const aim = useCallback(() => {
    const fan = fanRef.current;
    const stem = fan?.querySelector<HTMLElement>(".fan-stem");
    const mark = sayRef.current?.querySelector<HTMLElement>('[data-state="on"] .hero-mark');
    if (!fan || !stem || !mark) return;
    const fr = fan.getBoundingClientRect();
    if (!fr.width) return;
    const mr = mark.getBoundingClientRect();
    const x = mr.left - fr.left + mr.width / 2;
    // Clamped to the same 2–98% of the fan the percentage version used, so a mark
    // that wraps to the very edge still leaves the stem inside the tree it joins.
    const clamped = Math.max(fr.width * 0.02, Math.min(fr.width * 0.98, x));
    const next = `${(clamped - fr.width / 2).toFixed(1)}px`;
    if (stem.style.getPropertyValue("--fan-x") !== next) {
      stem.style.setProperty("--fan-x", next);
    }
  }, []);

  // Re-aim on every frame change, and on any resize of the sentence box: the
  // mark's x depends on where that sentence wrapped, which only a browser knows.
  useEffect(() => {
    aim();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(aim);
    if (sayRef.current) ro?.observe(sayRef.current);
    return () => ro?.disconnect();
  }, [aim, active]);

  // Flip the stem a frame later than the one that aimed it: the collapsed
  // `scaleY(0)` has to be painted once, or there is nothing to transition from
  // and the stem appears at full length instead of drawing.
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAimed(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  // A hidden tab must not keep rotating, or the reader returns part-way through a
  // claim they never saw start. Writing the ref is enough: the clock checks it on
  // its next tick, and a backgrounded tab has nothing to re-render for.
  useEffect(() => {
    const sync = () => {
      held.current = document.hidden;
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const go = useCallback((next: number) => {
    setActive((i) => {
      if (i === next) return i;
      setLeaving(i);
      return next;
    });
  }, []);

  // The cycle. Reduced motion stops it rather than cutting between frames with
  // the transition suppressed — that is a flicker, which is what the preference
  // asks us not to do. Those readers keep frame 0; the rail still steps.
  useEffect(() => {
    if (HERO_FRAMES.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (held.current) return;
      go((active + 1) % HERO_FRAMES.length);
    }, DWELL_MS);
    return () => clearInterval(t);
  }, [active, go]);

  // Park the outgoing frame once it has gone, so its next turn enters from below
  // like every other frame.
  useEffect(() => {
    if (leaving === null) return;
    const t = setTimeout(() => setLeaving(null), SWAP_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  const stateOf = (i: number) => (i === active ? "on" : i === leaving ? "out" : "off");
  // The rotating weight first, then the four properties that never change. Its
  // text is a placeholder for the column arithmetic only — cell 0 renders the
  // stack of all four weights so the figure can crossfade in place.
  const labels: Callout[] = [{ text: "kb", row: 0 }, ...callouts];

  return (
    <>
      {/* One dot per claim, on the page's own left axis. Real buttons: rotating
          is the default, and a reader who steps keeps it. */}
      <div className="hero-rail mt-6 sm:mt-8" role="tablist" aria-label="What the chart is showing">
        {HERO_FRAMES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            className="hero-dot"
            data-state={i === active ? "on" : "off"}
            aria-selected={i === active}
            aria-label={f.name}
            onClick={() => {
              // A reader who steps keeps it: the clock stays held from here on.
              held.current = true;
              go(i);
            }}
          >
            <span className="hero-dot-mark" />
          </button>
        ))}
      </div>

      {/* One grid cell, four sentences. The cell is as tall as the tallest of them
          at every width, so nothing below it ever moves. */}
      <div
        ref={sayRef}
        className="hero-say mt-3.5"
        style={{ maxWidth: "var(--m-lead)" }}
        // Ref writes, so inspecting the mark costs the fold nothing to re-render.
        onPointerEnter={() => {
          held.current = true;
        }}
        onPointerLeave={() => {
          held.current = false;
        }}
        onFocusCapture={() => {
          held.current = true;
        }}
      >
        {HERO_FRAMES.map((f, i) => (
          <p
            key={f.id}
            className="sentence"
            data-state={stateOf(i)}
            // Only the visible claim exists for a keyboard or a screen reader.
            // Without this the fold has four charts' worth of tab stops and four
            // announced images, and the callout beside them says "one tab stop".
            inert={i !== active}
          >
            {f.sentence}
          </p>
        ))}
      </div>

      {/* The tree. Every rule is a 1px absolutely-positioned div, so none of it
          can affect layout, and every coordinate but the stem's is a percentage
          the server already knows. */}
      <div ref={fanRef} className="fan" style={{ "--fan-cols": labels.length } as object}>
        <div aria-hidden className="fan-rules">
          {/* The one thing the server cannot know: the mark's x depends on where
              the sentence wrapped. Rendered at the `50%` default it jumped
              sideways on hydration, so it does not exist until a browser has
              measured, and then it draws itself down to the bus. */}
          <span className="fan-stem" data-state={aimed ? "on" : "off"} />
          <span className="fan-bus" />
          {labels.map((c, i) => (
            <span
              key={c.text}
              className="fan-drop"
              data-row={c.row}
              style={{ "--i": i } as object}
            />
          ))}
        </div>
        <ul className="fan-labs">
          {labels.map((c, i) => (
            <li key={i} className="fan-lab" data-row={c.row} style={{ "--i": i } as object}>
              {/* Cell 0 is the active type's own weight, so it swaps on the same
                  clock as the sentence. All four stack in a fixed `7ch` box —
                  exact, because every weight is `n.nn kB` in a mono face — so the
                  `<li>` never changes width and the leader above it never moves. */}
              {i === 0 ? (
                <span className="fan-swap-box">
                  {HERO_FRAMES.map((f, fi) => (
                    <span
                      key={f.id}
                      className="fan-swap"
                      data-state={stateOf(fi)}
                      aria-hidden={fi !== active}
                    >
                      {f.kb.toFixed(2)} kB
                    </span>
                  ))}
                </span>
              ) : (
                c.text
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
