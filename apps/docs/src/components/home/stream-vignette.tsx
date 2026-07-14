"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { MiniBar } from "@microcharts/react/mini-bar";
import { Seismogram } from "@microcharts/react/seismogram";
import { StatusDot } from "@microcharts/react/status-dot";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { RugStrip } from "@microcharts/react/rug-strip";

/**
 * Home hero stream — chart grammar → real components, mid-sentence. Three
 * scenarios rotate (business → incident → markets) so the reply reads alive;
 * each mixes inline word-sized marks with one captioned block chart. Data
 * charts take the site accent so the reply reads vibrant, not grey; charts
 * that already encode meaning by colour (delta, trend, status, bullet) keep
 * their own semantics. Ghosts of every scenario are grid-stacked so the panel
 * reserves the tallest reply — nothing below shifts as scenarios swap.
 */

const ACCENT = "var(--mc-accent)";
const BLOCK_W = 236;

type Seg =
  | { id: string; kind: "text"; text: string }
  | { id: string; kind: "chart"; raw: string; block?: boolean; node: ReactNode };

interface Scenario {
  id: string;
  hint: string;
  segs: Seg[];
}

/** A captioned standalone chart (fenced form). */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="not-prose flex flex-col gap-1">
      <figcaption className="mono-label opacity-55">{title}</figcaption>
      {children}
    </figure>
  );
}

const SCENARIOS: Scenario[] = [
  {
    id: "revenue",
    hint: "business recap",
    segs: [
      {
        id: "r0",
        kind: "text",
        text: "Q3 landed 12% ahead of plan. Revenue built week over week ",
      },
      {
        id: "r-spark",
        kind: "chart",
        raw: "`chart sparkline 132 148 141 165 159 182 176 203`",
        node: (
          <Sparkline
            data={[132, 148, 141, 165, 159, 182, 176, 203]}
            width={58}
            height={15}
            curve="smooth"
            color={ACCENT}
            summary={false}
          />
        ),
      },
      { id: "r1", kind: "text", text: ", up " },
      {
        id: "r-delta",
        kind: "chart",
        raw: "`chart delta +0.184`",
        node: <Delta value={0.184} summary={false} />,
      },
      {
        id: "r2",
        kind: "text",
        text: " on Q2 — and growth was broad, not one deal carrying it:",
      },
      {
        id: "r-mini",
        kind: "chart",
        block: true,
        raw: "```chart mini-bar Net-new by region ($k)\n48 39 27 22 18\n```",
        node: (
          <Block title="Net-new by region ($k)">
            <MiniBar
              data={[
                { label: "NA", value: 48 },
                { label: "EU", value: 39 },
                { label: "UK", value: 27 },
                { label: "APAC", value: 22 },
                { label: "LATAM", value: 18 },
              ]}
              width={BLOCK_W}
              height={46}
              color={ACCENT}
              summary={false}
            />
          </Block>
        ),
      },
      { id: "r3", kind: "text", text: " Pipeline held end to end, and we're " },
      {
        id: "r-bullet",
        kind: "chart",
        raw: "`chart bullet value=72 target=80 bands=50,90`",
        node: (
          <Bullet value={72} target={80} bands={[50, 90]} width={66} height={12} summary={false} />
        ),
      },
      { id: "r4", kind: "text", text: " to target. A clean quarter — clear to raise for Q4." },
    ],
  },
  {
    id: "incident",
    hint: "SRE · on-call",
    segs: [
      { id: "i0", kind: "text", text: "Deploys held steady " },
      {
        id: "i-bar",
        kind: "chart",
        raw: "`chart sparkbar 120 118 122 90 60 95 128 130`",
        node: (
          <SparkBar
            data={[120, 118, 122, 90, 60, 95, 128, 130]}
            width={48}
            height={15}
            color={ACCENT}
            summary={false}
          />
        ),
      },
      {
        id: "i1",
        kind: "text",
        text: " until 14:02, when a bad write path spiked 5xx errors for six minutes:",
      },
      {
        id: "i-seis",
        kind: "chart",
        block: true,
        raw: "```chart seismogram Errors per minute\n2 1 3 2 18 24 9 4 2 1 2 3\n```",
        node: (
          <Block title="Errors per minute">
            <Seismogram
              data={[2, 1, 3, 2, 18, 24, 9, 4, 2, 1, 2, 3]}
              width={BLOCK_W}
              height={44}
              color={ACCENT}
              summary={false}
            />
          </Block>
        ),
      },
      { id: "i2", kind: "text", text: " Alert at 14:03, rollback at 14:08 " },
      {
        id: "i-status",
        kind: "chart",
        raw: "`chart status-dot warn`",
        node: <StatusDot status="warn" style={{ width: 11, height: 11 }} summary={false} />,
      },
      {
        id: "i3",
        kind: "text",
        text: ", green by 14:11 — inside the error budget, no SLO breach. Adding a write-path smoke test to the canary.",
      },
    ],
  },
  {
    id: "markets",
    hint: "finance · the desk",
    segs: [
      { id: "m0", kind: "text", text: "NVDA closed +3.8% " },
      {
        id: "m-trend",
        kind: "chart",
        raw: "`chart trend-arrow +0.038`",
        node: <TrendArrow value={0.038} summary={false} />,
      },
      {
        id: "m1",
        kind: "text",
        text: " on the session — a steady grind into the bell. Intraday returns stayed tight, no fat tails:",
      },
      {
        id: "m-hist",
        kind: "chart",
        block: true,
        raw: "```chart histogram 1-min returns (bps)\n-2 -1 0 1 -1 2 1 0 3 1 -1 0 2 1 4 -2 1 0\n```",
        node: (
          <Block title="1-min returns (bps)">
            <HistogramStrip
              data={[-2, -1, 0, 1, -1, 2, 1, 0, 3, 1, -1, 0, 2, 1, 4, -2, 1, 0]}
              width={BLOCK_W}
              height={44}
              color={ACCENT}
              summary={false}
            />
          </Block>
        ),
      },
      { id: "m2", kind: "text", text: " Fills clustered mid-book " },
      {
        id: "m-rug",
        kind: "chart",
        raw: "`chart rug-strip 3 5 5 6 8 8 9 11 12 12 14`",
        node: (
          <RugStrip
            data={[3, 5, 5, 6, 8, 8, 9, 11, 12, 12, 14]}
            width={58}
            height={13}
            color={ACCENT}
            summary={false}
          />
        ),
      },
      { id: "m3", kind: "text", text: ", so slippage was minimal. The book now sits " },
      {
        id: "m-bullet",
        kind: "chart",
        raw: "`chart bullet value=88 target=75 bands=60,95`",
        node: (
          <Bullet value={88} target={75} bands={[60, 95]} width={66} height={12} summary={false} />
        ),
      },
      {
        id: "m4",
        kind: "text",
        text: " over its benchmark weight — trimming into strength on Monday.",
      },
    ],
  },
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

/** A fully-settled reply — used for the height-reserving ghosts. A block chart
 *  renders a <figure> (flow content), so the container must be a <div>, never
 *  a <p> (which auto-closes on block descendants → hydration mismatch). */
function FinishedReply({ segs }: { segs: Seg[] }) {
  return (
    <div>
      {segs.map((s) =>
        s.kind === "text" ? (
          <span key={s.id}>{s.text}</span>
        ) : s.block ? (
          <div key={s.id} className="my-3">
            {s.node}
          </div>
        ) : (
          <span key={s.id} className="mc-inline">
            {s.node}
          </span>
        ),
      )}
    </div>
  );
}

export function StreamVignette() {
  const [idx, setIdx] = useState(0);
  const active = SCENARIOS[idx];
  const total = useMemo(() => active.segs.reduce((a, s) => a + atomCount(s), 0), [active]);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const reduced = useRef(false);

  // Start on viewport entry; reduced motion jumps straight to the finished reply.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || started.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      started.current = true;
      reduced.current = true;
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
    let seg: Seg = active.segs[0];
    let inSeg = 0;
    for (const s of active.segs) {
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
  }, [running, pos, total, active]);

  // When a reply finishes, hold a beat, then roll to the next scenario. Reduced
  // motion stays on the first finished reply — no cycling.
  useEffect(() => {
    if (reduced.current || !started.current || running || pos < total) return;
    const t = window.setTimeout(() => {
      setIdx((i) => (i + 1) % SCENARIOS.length);
      setPos(0);
      setRunning(true);
    }, 2600);
    return () => window.clearTimeout(t);
  }, [running, pos, total]);

  const replay = () => {
    if (reduced.current) return;
    setPos(0);
    setRunning(true);
  };

  // Build the visible reply at the current position.
  const view: ReactNode[] = [];
  let acc = 0;
  for (const s of active.segs) {
    const n = atomCount(s);
    if (pos >= acc + n) {
      // finished segment — grammar has become the chart
      if (s.kind === "text") view.push(<span key={s.id}>{s.text}</span>);
      else if (s.block)
        view.push(
          <div key={s.id} className="hx-morph-in my-3">
            {s.node}
          </div>,
        );
      else
        view.push(
          <span key={s.id} className="hx-morph-in mc-inline">
            {s.node}
          </span>,
        );
    } else if (pos > acc) {
      // in-flight segment — raw text, typed
      const p = partial(s, pos - acc);
      if (s.kind === "text") view.push(<span key={s.id}>{p}</span>);
      else
        view.push(
          <code
            key={s.id}
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
        <span className="flex items-center gap-2">
          <span className="mono-label">assistant reply</span>
          <span className="mono-label opacity-50">· {active.hint}</span>
        </span>
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
        {/* every scenario's finished reply is stacked in one grid cell, so the
            panel reserves the tallest — the stream paints over it, no CLS. */}
        <div aria-hidden className="grid text-[0.95rem] leading-relaxed">
          {SCENARIOS.map((s) => (
            <div key={s.id} className="invisible [grid-area:1/1]">
              <FinishedReply segs={s.segs} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-5 top-5 text-[0.95rem] leading-relaxed text-fd-foreground">
          {view}
          {streaming && started.current && <span className="mc-caret" aria-hidden />}
        </div>
      </div>
    </div>
  );
}
