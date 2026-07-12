"use client";
// oxlint-disable react/no-array-index-key -- SEGS is a static module constant; indexes are stable identity
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";

/** Compact hero stream for /stream — chart grammar → real components. */

type Seg =
  | { kind: "text"; text: string }
  | { kind: "chart"; raw: string; block?: boolean; node: ReactNode };

const SEGS: Seg[] = [
  { kind: "text", text: "Deploys held steady " },
  {
    kind: "chart",
    raw: "`chart sparkbar 6 9 5 11 7 12 8 10`",
    node: <SparkBar data={[6, 9, 5, 11, 7, 12, 8, 10]} width={46} height={15} summary={false} />,
  },
  { kind: "text", text: " this week, and week-over-week conversion is up " },
  {
    kind: "chart",
    raw: "`chart delta +0.184`",
    node: <Delta value={0.184} summary={false} />,
  },
  { kind: "text", text: ". The p95 keeps easing off:" },
  {
    kind: "chart",
    block: true,
    raw: "```chart sparkline Latency p95, ms\n24 22 23 19 20 17 16 14\n```",
    node: (
      <Sparkline
        data={[24, 22, 23, 19, 20, 17, 16, 14]}
        width={236}
        height={52}
        curve="smooth"
        dots="minmax"
        label="last"
        title="Latency p95, ms"
      />
    ),
  },
  { kind: "text", text: " Error budget still has room " },
  {
    kind: "chart",
    raw: "`chart bullet value=72 target=90 bands=60,95`",
    node: <Bullet value={72} target={90} bands={[60, 95]} width={68} height={12} summary={false} />,
  },
  { kind: "text", text: ", so the release is clear to ship." },
];

/** Atom stream: text advances by words, raw grammar advances by characters. */
function atomCount(s: Seg): number {
  return s.kind === "text" ? s.text.split(" ").length : s.raw.length;
}

function partial(s: Seg, n: number): string {
  if (s.kind === "text") {
    return s.text.split(" ").slice(0, n).join(" ") + (n < atomCount(s) ? " " : "");
  }
  return s.raw.slice(0, n);
}

export function StreamVignette() {
  const total = useMemo(() => SEGS.reduce((a, s) => a + atomCount(s), 0), []);
  // done: charts rendered for every finished segment; pos counts atoms overall
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // Start on viewport entry; reduced motion jumps straight to the finished reply.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || started.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      started.current = true;
      setPos(total);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true;
          setRunning(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [total]);

  // Advance one atom at a time with human-feel pacing.
  useEffect(() => {
    if (!running || pos >= total) {
      if (pos >= total) setRunning(false);
      return;
    }
    // which segment is the cursor inside?
    let acc = 0;
    let seg: Seg = SEGS[0];
    let inSeg = 0;
    for (const s of SEGS) {
      const n = atomCount(s);
      if (pos < acc + n) {
        seg = s;
        inSeg = pos - acc;
        break;
      }
      acc += n;
    }
    const closing = inSeg === atomCount(seg) - 1;
    const delay =
      seg.kind === "chart"
        ? closing
          ? 360 // savor the morph
          : 9
        : 26 + Math.random() * 42;
    const t = window.setTimeout(() => setPos((p) => p + 1), delay);
    return () => window.clearTimeout(t);
  }, [running, pos, total]);

  const replay = () => {
    setPos(0);
    setRunning(true);
  };

  // Build the visible reply at the current position.
  const view: ReactNode[] = [];
  let acc = 0;
  for (let i = 0; i < SEGS.length; i += 1) {
    const s = SEGS[i];
    const n = atomCount(s);
    if (pos >= acc + n) {
      // finished segment — grammar has become the chart
      if (s.kind === "text") view.push(<span key={i}>{s.text}</span>);
      else if (s.block)
        view.push(
          <span key={i} className="hx-morph-in mt-3 block">
            {s.node}
          </span>,
        );
      else
        view.push(
          <span key={i} className="hx-morph-in mc-inline">
            {s.node}
          </span>,
        );
    } else if (pos > acc) {
      // in-flight segment — raw text, typed
      const p = partial(s, pos - acc);
      if (s.kind === "text") view.push(<span key={i}>{p}</span>);
      else
        view.push(
          <code
            key={i}
            className={
              "font-mono text-[0.82em] text-fd-muted-foreground " +
              (s.block ? "mt-3 block whitespace-pre-wrap" : "")
            }
          >
            {p}
          </code>,
        );
      break;
    } else break;
    acc += n;
  }

  const streaming = pos < total;

  return (
    <div ref={hostRef} className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="mono-label">assistant reply · live components</span>
        <button
          type="button"
          aria-label="Replay the stream"
          title="Replay"
          onClick={replay}
          className="ghost-ctrl size-8"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
      <div className="relative px-5 py-5">
        {/* ghost reserves the finished height; the stream paints over it */}
        <div aria-hidden className="invisible text-[0.95rem] leading-relaxed">
          <FinishedReply />
        </div>
        <p className="absolute inset-x-5 top-5 text-[0.95rem] leading-relaxed text-fd-foreground">
          {view}
          {streaming && started.current && <span className="mc-caret" aria-hidden />}
        </p>
      </div>
    </div>
  );
}

function FinishedReply() {
  return (
    <p>
      {SEGS.map((s, i) =>
        s.kind === "text" ? (
          <span key={i}>{s.text}</span>
        ) : s.block ? (
          <span key={i} className="mt-3 block">
            {s.node}
          </span>
        ) : (
          <span key={i} className="mc-inline">
            {s.node}
          </span>
        ),
      )}
    </p>
  );
}
