"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO_FRAMES } from "./hero-frames";

/**
 * The fold's rotating claim: four sentences, four charts, one box.
 *
 * Each frame is a sentence with its own mark set inside it (`hero-frames.tsx`).
 * An earlier pass rotated only the chart and left a single sentence about
 * kilobytes underneath it, so three frames out of four sat inside words that had
 * nothing to do with them. Rotating the SENTENCE is what makes the mark evidence
 * rather than decoration, and it is why the dot rail exists: four claims is a
 * shape a reader can be shown, and step through.
 *
 * ## Nothing moves except the sentence
 *
 * All four sentences occupy ONE grid cell (`.hero-say`), so the box is the height
 * of the tallest of them at every width, in server HTML, before a swap has
 * happened. Nothing below can be pushed by a frame that is two lines on a laptop
 * and four on a phone. Frames animate on `opacity` and `translate` only, which
 * are compositor properties, so a swap costs no layout.
 *
 * The crossfade OVERLAPS: opacity is linear and undelayed, so the outgoing and
 * incoming sentences cross at 0.5. The first version eased opacity on expo and
 * held the incoming frame back by 90ms — expo spends nearly all its change in the
 * first few frames, so the box went visibly blank between the two. That is the
 * flicker this must not have, and it was caught in a screenshot, not in review.
 *
 * ## The tree is CSS, not measurement
 *
 * Five labels sit in five equal grid columns; the bus spans the outer two column
 * centres; each drop falls from the bus to its own column. All of that is correct
 * in server HTML at any width with no JS, and because each label owns a column a
 * drop can never land inside a neighbour.
 *
 * The one thing JavaScript computes is `--fan-x`, the stem's horizontal aim, and
 * it now re-runs per frame: each sentence puts its mark at a different point, so
 * the stem follows the mark from claim to claim. It is a 1px absolutely
 * positioned rule and nothing lays out from it, so it cannot shift anything.
 */

/** How long a frame holds before the next one takes over. */
const DWELL_MS = 6000;
/** Must match `--hero-swap` in v3.css — how long the outgoing frame takes to go. */
const SWAP_MS = 460;

/** A property of the mark, and which of the two rows names it. */
type Callout = { text: string; row: 0 | 1 };

export function HeroSentence({ callouts }: { callouts: readonly Callout[] }) {
  const sayRef = useRef<HTMLDivElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(0);
  /** The frame on its way out, so it can travel the opposite way. */
  const [leaving, setLeaving] = useState<number | null>(null);
  /** A reader inspecting the mark or stepping the rail, or a hidden tab. */
  const [held, setHeld] = useState(false);
  /** Whether the stem has a real x yet. The server has no idea where the mark
   *  landed, so the stem does not exist until a browser has measured it. */
  const [aimed, setAimed] = useState(false);

  /** Aim the stem at the ACTIVE frame's mark. One custom property, and nothing
   *  that lays out reads from it. Queried rather than ref'd because the mark that
   *  matters changes with the frame. Idempotent: a no-op resize writes nothing. */
  const aim = useCallback(() => {
    const fan = fanRef.current;
    const mark = sayRef.current?.querySelector<HTMLElement>('[data-state="on"] .hero-mark');
    if (!fan || !mark) return;
    const fr = fan.getBoundingClientRect();
    if (!fr.width) return;
    const mr = mark.getBoundingClientRect();
    const pct = ((mr.left - fr.left + mr.width / 2) / fr.width) * 100;
    const next = `${Math.max(2, Math.min(98, pct)).toFixed(2)}%`;
    if (fan.style.getPropertyValue("--fan-x") !== next) {
      fan.style.setProperty("--fan-x", next);
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

  // Flip the stem on a FRAME LATER than the one that aimed it.
  //
  // Setting this inside `aim()` put the state change in the same commit as the
  // mount, so the browser never painted `scaleY(0)` — with no starting point
  // there is nothing to transition from, and the stem simply appeared at full
  // length instead of drawing. Two frames guarantee the collapsed state is
  // painted once, which is what turns the flip into a draw.
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
  // claim they never saw start.
  useEffect(() => {
    const sync = () => setHeld(document.hidden);
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
  // the transition suppressed — that is a flicker, which is the exact thing the
  // preference asks us not to do. Those readers keep frame 0, and the rail still
  // steps on click.
  useEffect(() => {
    if (HERO_FRAMES.length < 2 || held) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go((active + 1) % HERO_FRAMES.length), DWELL_MS);
    return () => clearInterval(t);
  }, [active, held, go]);

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
      {/* The rail. One dot per claim, above the sentence and on the page's own
          left axis — a column of them beside the text would be the only thing on
          this page starting anywhere else. They are real buttons: rotating is the
          default, stepping is the reader's, and a reader who steps keeps it. */}
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
              setHeld(true);
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
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocusCapture={() => setHeld(true)}
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
          {/* The stem is the ONE thing here the server cannot know: it points at
              the mark, and where the mark landed depends on where the sentence
              wrapped. Rendered at the `50%` default and corrected on hydration, it
              visibly jumped sideways on every load — a shift with no cause a
              reader could see. So it does not exist until a browser has measured,
              and then it draws itself downward from the mark to the bus. Growing
              into place reads as the leader being drawn; appearing at full length
              reads as a glitch. */}
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
              {/* Cell 0 is the active type's own weight, so it swaps too, on the
                  same clock as the sentence. All four are rendered and stacked in
                  a fixed `7ch` box — exact, because every weight is `n.nn kB` in a
                  mono face. The `<li>` therefore never changes width, so its
                  `translateX(-50%)` keeps resolving to the same centre and the
                  leader that drops onto this label never moves. */}
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
