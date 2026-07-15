"use client";
import "@microcharts/react/motion";
import { useEffect, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";

/**
 * The hero sentence typesets itself: words settle in reading order (pure CSS,
 * SSR-visible), then each inline chart draws where the type pauses — the
 * library's own `animate` entrance, remounted on a JS clock that matches the
 * CSS `--at` schedule — then a caret blinks at the full stop. Ambient: the
 * "write" sparkline re-plots a fresh series every few seconds; the sentence
 * keeps being written. Reduced motion renders everything settled.
 *
 * Timing map (one schedule, two clocks):
 *   0–1.0 s  words (CSS --i * 60 ms)
 *   1.05 s   sparkline appears (CSS --at) + draws (JS remount)
 *   1.6 s    sparkbar appears + draws
 *   2.05 s   caret
 */

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];
const AT_SPARK = 1050;
const AT_BARS = 1600;
const AT_CARET = 2050;

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

function nextSeries(prev: number[]): number[] {
  const last = prev[prev.length - 1] ?? 7;
  const v = Math.max(1, Math.min(14, last + (Math.random() - 0.42) * 4));
  return [...prev.slice(1), Math.round(v * 10) / 10];
}

export function TypesetHeadline() {
  const [reduced, setReduced] = useState(false);
  const [stage, setStage] = useState(0); // 0 ssr/words · 1 spark drawn · 2 bars drawn
  const [series, setSeries] = useState<number[]>(TREND);
  const [plotNonce, setPlotNonce] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStage(2);
      return;
    }
    const t1 = window.setTimeout(() => setStage(1), AT_SPARK);
    const t2 = window.setTimeout(() => setStage(2), AT_BARS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Ambient re-plot — paused while the tab is hidden.
  useEffect(() => {
    if (reduced || stage < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setSeries((s) => nextSeries(s));
      setPlotNonce((n) => n + 1);
    }, 6800);
    return () => window.clearInterval(id);
  }, [reduced, stage]);

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
            key={`s${stage >= 1 ? 1 : 0}-${plotNonce}`}
            data={series}
            curve="smooth"
            width={60}
            height={20}
            animate={!reduced && stage >= 1}
            summary={false}
          />
        </span>
        <span className="hv-w" style={{ "--i": 7 } as React.CSSProperties}>
          ,{" "}
        </span>
      </span>
      <Words text="sharp enough for a person to" from={8} />
      <span className="whitespace-nowrap">
        <em className="hv-em hv-w" style={{ "--i": 14 } as React.CSSProperties}>
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
        <span className="hv-w" style={{ "--i": 15 } as React.CSSProperties}>
          .
        </span>
        {!reduced && (
          <span
            aria-hidden
            className="hv-caret"
            style={{ "--at": `${AT_CARET}ms` } as React.CSSProperties}
          />
        )}
      </span>
    </h1>
  );
}
