"use client";
import { useEffect, useState } from "react";

/**
 * The fold's scroll cue: a hairline leader with a tick running down it, built
 * from the page's own annotation grammar rather than a bouncing chevron.
 *
 * It exists only while there is something to point at, and what it watches is the
 * next section's HEADING, not its box — the box starts at the top of a 141px gap,
 * so a cue keyed to it vanishes for no reason the reader can see.
 *
 * Everything here is decorative and `aria-hidden`: a screen reader already knows
 * the document continues.
 */
export function ScrollCue({ watch, label }: { watch: string; label: string }) {
  // Starts hidden, and the observer's first callback fires immediately with the
  // real answer. Starting SHOWN would flash a cue on tall windows where the next
  // section is already visible, which is precisely the case it exists to avoid.
  const [show, setShow] = useState(false);

  useEffect(() => {
    let io: IntersectionObserver | undefined;
    let raf = 0;

    // Wait for load before observing: attached during hydration the first
    // callback reads a fold that has not finished laying out — the display face
    // has not swapped in, the fold is short, and the heading measures as on
    // screen. The latch is permanent, so that one early reading disables the cue
    // for the whole session.
    const start = () => {
      raf = requestAnimationFrame(() => {
        const target = document.querySelector(watch);
        if (!target || typeof IntersectionObserver === "undefined") return;
        io = new IntersectionObserver(
          ([e]) => {
            if (!e) return;
            // One-way, and "not intersecting" is TWO states: above the viewport
            // (passed) and below it (still ahead). A restored scroll position can
            // start the page with the heading already above, where it never
            // intersects — so the test is "still ahead of the reader", and passed
            // is final.
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
      {/* The leader, then the label beside its foot — a leader arriving
          somewhere, and the words naming what it arrived at. */}
      <div className="shell">
        <span className="scroll-cue-rule">
          <span className="scroll-cue-tick" />
        </span>
        <span className="kicker scroll-cue-label">{label}</span>
      </div>
    </div>
  );
}
