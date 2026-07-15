"use client";
import "@microcharts/react/motion";
import { useEffect, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";

/**
 * The hero sentence typesets itself in strict reading order: words settle,
 * each inline chart draws where the type pauses, and the punctuation that
 * follows a chart waits for it — "write" never sits next to an empty slot
 * and a floating comma.
 *
 * ONE clock. Words and chart slots are revealed by CSS animations anchored to
 * the document timeline (first paint), so the choreography runs identically
 * with or without JS. The JS draw (the library's `animate` remount) schedules
 * itself against `document.timeline.currentTime` — the same clock — and fires
 * only if it can land BEFORE the slot becomes visible. If hydration is too
 * late for the rendezvous, the chart simply fades in settled: it never paints
 * and then re-draws (the double-animation bug this replaces).
 *
 * Schedule (ms from first paint):
 *   0–360    "Small enough for a model to write"
 *   780      sparkline reveals + draws · the comma lands with it
 *   840–1200 "sharp enough for a person to trust"
 *   1560     sparkbar reveals + draws · the full stop lands with it
 *   1900     the reply card starts streaming (StreamVignette startDelay)
 */

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];
const AT_SPARK = 780;
const AT_BARS = 1560;
/** JS must beat the slot reveal by this margin to be allowed to draw. */
const GRACE = 140;

function Words({ text, from }: { text: string; from: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span
          key={`${from + i}-${w}`}
          className="hv-w"
          style={{ "--i": from + i } as React.CSSProperties}
        >
          {w}{" "}
        </span>
      ))}
    </>
  );
}

export function TypesetHeadline() {
  const [reduced, setReduced] = useState(false);
  const [stage, setStage] = useState(0); // 0 ssr/static · 1 spark draws · 2 bars draw

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      return;
    }
    // Where is the CSS choreography right now? (ms since first paint)
    const now = Number(document.timeline?.currentTime ?? performance.now());
    const timers: number[] = [];
    // Only draw a chart whose slot is still hidden — a chart that already
    // faded in stays put. Never animate something the user has seen.
    if (AT_SPARK - now > GRACE) {
      timers.push(window.setTimeout(() => setStage((s) => Math.max(s, 1)), AT_SPARK - now));
    }
    if (AT_BARS - now > GRACE) {
      timers.push(window.setTimeout(() => setStage((s) => Math.max(s, 2)), AT_BARS - now));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  return (
    <h1 className="display text-balance text-[2.3rem] leading-[1.05] text-fd-foreground sm:text-[3rem] lg:text-[3.65rem] xl:text-[3.9rem]">
      <Words text="Small enough for a model to" from={0} />
      <span className="whitespace-nowrap">
        <em className="hv-em hv-w" style={{ "--i": 6 } as React.CSSProperties}>
          write
        </em>
        <span
          aria-hidden
          inert
          className="hx-word hv-slot"
          style={{ "--at": `${AT_SPARK}ms` } as React.CSSProperties}
        >
          <Sparkline
            key={`s${stage >= 1 ? 1 : 0}`}
            data={TREND}
            curve="smooth"
            width={60}
            height={20}
            animate={!reduced && stage >= 1}
            summary={false}
          />
        </span>
        {/* the comma belongs to the chart's beat, not the word stagger */}
        <span className="hv-w" style={{ "--i": 13 } as React.CSSProperties}>
          ,{" "}
        </span>
      </span>
      <Words text="sharp enough for a person to" from={14} />
      <span className="whitespace-nowrap">
        <em className="hv-em hv-w" style={{ "--i": 20 } as React.CSSProperties}>
          trust
        </em>
        <span
          aria-hidden
          inert
          className="hx-word hv-slot"
          style={{ "--at": `${AT_BARS}ms` } as React.CSSProperties}
        >
          <SparkBar
            key={`b${stage >= 2 ? 1 : 0}`}
            data={TREND}
            width={52}
            height={20}
            animate={!reduced && stage >= 2}
            summary={false}
          />
        </span>
        <span className="hv-w" style={{ "--i": 26 } as React.CSSProperties}>
          .
        </span>
      </span>
    </h1>
  );
}
