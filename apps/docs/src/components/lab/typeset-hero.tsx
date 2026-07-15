"use client";
import "@microcharts/react/motion";
import { useEffect, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { Delta } from "@microcharts/react/delta";

/**
 * Direction C — the sentence typesets itself: words settle in reading order,
 * then each inline chart draws where the type pauses, then a quiet caret
 * blinks at the full stop. Ambient afterwards: the "write" sparkline re-plots
 * a fresh series every few seconds — the sentence keeps being written.
 * Reduced motion renders everything settled, no stages, no re-plot.
 */

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];

/** Split a phrase into word spans staggered by --i (CSS does the settle). */
function Words({ text, from }: { text: string; from: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="lab-c-w" style={{ "--i": from + i } as React.CSSProperties}>
          {w}
          {" "}
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

export function TypesetHero() {
  const [reduced, setReduced] = useState(false);
  const [stage, setStage] = useState(0); // 0 words · 1 spark · 2 bars+caret
  const [series, setSeries] = useState<number[]>(TREND);
  const [plotNonce, setPlotNonce] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStage(2);
      return;
    }
    const t1 = window.setTimeout(() => setStage(1), 1050); // after words settle
    const t2 = window.setTimeout(() => setStage(2), 1600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Ambient re-plot: the sentence keeps writing itself, slowly.
  useEffect(() => {
    if (reduced || stage < 2) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setSeries((s) => nextSeries(s));
      setPlotNonce((n) => n + 1);
    }, 6800);
    return () => window.clearInterval(id);
  }, [reduced, stage]);

  const settled = reduced;

  return (
    <h1
      className={`display lab-c-headline text-balance text-[2.7rem] leading-[1.06] text-fd-foreground sm:text-[3.9rem] lg:text-[4.9rem] ${settled ? "lab-c-settled" : ""}`}
    >
      <Words text="Small enough for a model to" from={0} />
      <span className="whitespace-nowrap">
        <em className="lab-c-em lab-c-w" style={{ "--i": 6 } as React.CSSProperties}>
          write
        </em>
        <span aria-hidden className="hx-word lab-c-slot" data-staged={stage >= 1}>
          <Sparkline
            key={`${stage >= 1}-${plotNonce}`}
            data={series}
            curve="smooth"
            width={60}
            height={20}
            animate={!reduced && stage >= 1}
            summary={false}
          />
        </span>
        <span className="lab-c-w" style={{ "--i": 7 } as React.CSSProperties}>
          ,{" "}
        </span>
      </span>
      <Words text="sharp enough for a person to" from={8} />
      <span className="whitespace-nowrap">
        <em className="lab-c-em lab-c-w" style={{ "--i": 14 } as React.CSSProperties}>
          trust
        </em>
        <span aria-hidden className="hx-word lab-c-slot" data-staged={stage >= 2}>
          <SparkBar
            key={stage >= 2 ? "in" : "pre"}
            data={TREND}
            width={52}
            height={20}
            animate={!reduced && stage >= 2}
            summary={false}
          />
        </span>
        <span className="lab-c-w" style={{ "--i": 15 } as React.CSSProperties}>
          .
        </span>
        {stage >= 2 && !reduced && <span aria-hidden className="mc-caret lab-c-caret" />}
      </span>
    </h1>
  );
}

/** The one-line live demo under the CTAs — a sentence with working charts. */
export function OneLineDemo() {
  return (
    <p className="lab-c-demo flex flex-wrap items-center gap-x-1.5 text-[0.95rem] leading-relaxed text-fd-muted-foreground">
      <span className="mono-label mr-1.5">live</span>
      p95 latency held under target
      <span aria-hidden className="mc-inline">
        <Sparkline
          data={[212, 208, 199, 204, 190, 186, 181, 180]}
          width={58}
          height={15}
          curve="smooth"
          summary={false}
        />
      </span>
      , down
      <span aria-hidden className="mc-inline">
        <Delta value={-0.151} summary={false} />
      </span>
      this week.
    </p>
  );
}
