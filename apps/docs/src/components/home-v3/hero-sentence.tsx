"use client";
import { useCallback, useEffect, useRef } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { HERO_TREND } from "./v3-data";

/**
 * The living sentence, its mark, and the tree of leaders that names what the mark
 * is.
 *
 * The mark is a real interactive `<Sparkline>` plotting the catalog's ceiling at
 * every release since 0.4 — the exact claim the sentence makes. Hover or focus it
 * and the readout names the release value; the accessible name is generated from
 * the same numbers by `describeSeries`, so it cannot go stale.
 *
 * **The tree is CSS, not measurement.** The first version computed every label
 * position and every leader path in JavaScript from the mark's measured x, which
 * meant the server could not draw it: the labels shipped as a plain wrapped row and
 * then jumped 270px into place at hydration, and that was the fold's only layout
 * shift and its largest single movement.
 *
 * So the geometry is now fixed and declarative. Five labels sit in five equal grid
 * columns; the bus spans the outer two column centres; each drop falls from the bus
 * to its own column. All of that is correct in server HTML, at any width, with no
 * JS at all — and because each label owns a column, a drop can never land inside a
 * neighbour, which used to be true only because the measured version clamped
 * widths and was checked by a test.
 *
 * The ONE thing JavaScript still does is slide the stem — the single vertical
 * hairline that rises from the bus to the mark — to the mark's real centre, since
 * the mark sits mid-sentence and only the browser knows where the line wrapped. It
 * writes one custom property on an absolutely-positioned 1px rule. Nothing about
 * the layout depends on it, so it cannot shift anything: measured CLS is 0.
 */

/** A property of the mark, and which of the two rows names it. */
type Callout = { text: string; row: 0 | 1 };

export function HeroSentence({
  median,
  ceilingClaim,
  callouts,
  sizeLimitHref,
}: {
  median: number;
  ceilingClaim: number;
  callouts: readonly Callout[];
  sizeLimitHref: string;
}) {
  const markRef = useRef<HTMLSpanElement>(null);
  const fanRef = useRef<HTMLDivElement>(null);

  /** Slide the stem to the mark's centre. One property, no layout read of the
   *  labels, and idempotent — an unchanged resize writes nothing. */
  const aim = useCallback(() => {
    const fan = fanRef.current;
    const mark = markRef.current;
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

  useEffect(() => {
    aim();
    // The mark's x changes with the sentence's own width, not only the window's.
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(aim);
    ro?.observe(fanRef.current!);
    return () => ro?.disconnect();
  }, [aim]);

  return (
    <>
      <p className="sentence mt-6 sm:mt-8" style={{ maxWidth: "var(--m-lead)" }}>
        The median chart is{" "}
        <a
          href={sizeLimitHref}
          target="_blank"
          rel="noreferrer noopener"
          className="u font-mono text-[0.72em] tracking-[-0.04em]"
        >
          {median.toFixed(2)}
        </a>{" "}
        kB
        {/* `.mc-inline` is the library's own inline seat, shipped in styles.css: the
            chart emits `--mc-seat` from its geometry and that rule stands the mark
            on the text baseline like a glyph — for an interactive entry, by hoisting
            the seat to the wrapper so the readout chip travels with it. Never
            hand-roll this with a `vertical-align` nudge. */}
        <span ref={markRef} className="mc-inline">
          <Sparkline
            data={[...HERO_TREND]}
            // Smooth, and no `domain`. Sparkline is a FLOOR mark, so `.mc-inline`
            // stands the bottom of its plot box on the text baseline: a series that
            // starts at its own minimum therefore starts exactly where a letter
            // would, and rises from there. A fixed domain with headroom underneath
            // floats the whole line above the text instead.
            curve="smooth"
            width={132}
            height={30}
            dots="auto"
            title="A trend, drawn inline"
          />
        </span>
        and none has ever shipped over {NUMBER_WORD[ceilingClaim] ?? ceilingClaim}.
      </p>

      {/* The tree. Every rule is a 1px absolutely-positioned div, so none of it can
          affect layout, and every coordinate but the stem's is a percentage the
          server already knows. */}
      <div ref={fanRef} className="fan" style={{ "--fan-cols": callouts.length } as object}>
        <div aria-hidden className="fan-rules">
          <span className="fan-stem" />
          <span className="fan-bus" />
          {callouts.map((c, i) => (
            <span
              key={c.text}
              className="fan-drop"
              data-row={c.row}
              style={{ "--i": i } as object}
            />
          ))}
        </div>
        <ul className="fan-labs">
          {callouts.map((c, i) => (
            <li key={c.text} className="fan-lab" data-row={c.row} style={{ "--i": i } as object}>
              {c.text}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** The claim is a word in the sentence, not a figure — the display face and the
 *  mono figures both have jobs here, and neither is "seven". */
const NUMBER_WORD: Record<number, string> = { 6: "six", 7: "seven", 8: "eight" };
