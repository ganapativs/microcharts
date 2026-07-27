"use client";
import { useEffect, useState } from "react";

/**
 * The fold's scroll cue: a hairline leader with a tick running down it.
 *
 * Built from the page's own annotation grammar — the callout tree above it says
 * "this points at that" with 1px leaders, and this points at the rest of the
 * document — rather than from a bouncing chevron, which is the one piece of
 * borrowed chrome this page would otherwise carry.
 *
 * **It only exists while there is something to point at.** An always-on cue is a
 * cue that means nothing: on a tall window the next section is already on screen,
 * and an arrow urging you toward what you are looking at is noise.
 *
 * What it watches is that section's HEADING, not the section box. The box starts
 * at the top of a 141px gap, so on plenty of window heights its first pixels are
 * in view while everything a reader could actually read is still below the fold —
 * and a cue that vanishes because a margin arrived is a cue that vanishes for no
 * reason the reader can see. The heading appearing is the reader having found the
 * next thing; that is the event worth reacting to.
 *
 * Client-only because that is an observation, not a render. Everything it wraps
 * is decorative and `aria-hidden`: a screen reader already knows the document
 * continues, and this is an affordance for a pointer.
 */
export function ScrollCue({ watch, label }: { watch: string; label: string }) {
  // Starts hidden, and the observer's first callback fires immediately with the
  // real answer. Starting SHOWN would flash a cue on tall windows where the next
  // section is already visible, which is precisely the case it exists to avoid.
  const [show, setShow] = useState(false);

  useEffect(() => {
    let io: IntersectionObserver | undefined;
    let raf = 0;

    // WAIT FOR LOAD before observing, and this is not belt-and-braces — it is the
    // whole correctness of the latch.
    //
    // Attached during hydration, the observer's first callback read a fold that
    // had not finished laying out: the display face had not swapped in, the fold
    // was short, and the heading measured as ON SCREEN. The latch is permanent by
    // design, so that one early reading disabled the cue for the entire session —
    // it never appeared again, on any scroll position, until a reload that
    // happened to be slower. The steady-state reading was correct the whole time,
    // which is exactly why this was invisible until someone reloaded and watched.
    //
    // Starting hidden means the wait costs nothing a reader can see.
    const start = () => {
      raf = requestAnimationFrame(() => {
        const target = document.querySelector(watch);
        if (!target || typeof IntersectionObserver === "undefined") return;
        io = new IntersectionObserver(
          ([e]) => {
            if (!e) return;
            // ONE-WAY, and "not intersecting" is TWO different states.
            //
            // `!isIntersecting` alone is symmetric, so the cue came back the
            // moment the heading left the viewport — which is what happens as
            // soon as you scroll into the third section. Latching on
            // `isIntersecting` fixed that and left a second hole: a reload
            // restores scroll position, so the page can start with the heading
            // already ABOVE the viewport, where it never intersects at all. The
            // observer then only ever reported false and the cue sat there for
            // the whole page.
            //
            // So the question is not "is it on screen", it is "is it still ahead
            // of the reader". Above the fold line means passed, and passed is
            // final.
            const passed = e.isIntersecting || e.boundingClientRect.top < 0;
            if (passed) {
              setShow(false);
              io?.disconnect();
              return;
            }
            setShow(true);
          },
          {
            // Any sliver of the HEADING counts. The question is "can the reader
            // see there is more", not "how much of it".
            threshold: 0,
          },
        );
        io.observe(target);
      });
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener("load", start);
    };
  }, [watch]);

  return (
    <div aria-hidden className="scroll-cue" data-state={show ? "on" : "off"}>
      {/* The leader, then the label beside its FOOT. Stacked, the label sat on top
          of the rule and the two read as one column of unrelated marks; set at the
          bottom of the rule it reads the way the callout tree reads — a leader
          arriving somewhere, and the words naming what it arrived at. */}
      <div className="shell">
        <span className="scroll-cue-rule">
          <span className="scroll-cue-tick" />
        </span>
        <span className="kicker scroll-cue-label">{label}</span>
      </div>
    </div>
  );
}
