"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";
// Inline marks = static. Fenced block charts = interactive (same in tour + live).
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { StatusDot } from "@microcharts/react/status-dot";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { RugStrip } from "@microcharts/react/rug-strip";
import { MiniBar } from "@microcharts/react/mini-bar/interactive";
import { Seismogram } from "@microcharts/react/seismogram/interactive";
import { HistogramStrip } from "@microcharts/react/histogram-strip/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { LIVE_SAMPLES, parseLiveReply, speakLiveReply, type ChartSpec } from "@/lib/live-grammar";
import { useLiveModel } from "@/components/home/use-live-model";

/**
 * Hero stream: grammar → real charts mid-sentence. The stream plays ONCE and
 * settles — a finished reply is the product; a fold that keeps re-typing under
 * the reader's eyes is not (that looping version shipped and drew "everything
 * is constantly moving" feedback). The replay control steps through the three
 * scenarios for whoever wants more. Valence charts keep their own colors,
 * others use the site accent. Ghost replies stack to reserve max height.
 * Live mode (Prompt API `available`) adds chips + input; tour remains default.
 */

const ACCENT = "var(--mc-accent)";
const BLOCK_W = 236;

type Seg =
  | { id: string; kind: "text"; text: string }
  | {
      id: string;
      kind: "chart";
      raw: string;
      block?: boolean;
      /** true = no .mc-inline wrapper — Delta is a text metric and owns its
       *  baseline; the inline optical lift would ride it high (docs/ai rule). */
      bare?: boolean;
      node: ReactNode;
    };

interface Scenario {
  id: string;
  hint: string;
  segs: Seg[];
}

/** A captioned standalone chart (fenced form). Width is pinned to BLOCK_W: the
 *  interactive entries fill their container (SVG width:100% via FILL), so
 *  without this the block chart would stretch to the full reply width instead
 *  of the size its geometry was tuned for. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="not-prose flex flex-col gap-1" style={{ width: BLOCK_W }}>
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
        raw: "`microchart sparkline 132 148 141 165 159 182 176 203`",
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
        bare: true,
        raw: "`microchart delta +0.184`",
        node: <Delta value={0.184} summary={false} />,
      },
      {
        id: "r2",
        kind: "text",
        text: " on Q2, and growth was broad, not one deal carrying it:",
      },
      {
        id: "r-mini",
        kind: "chart",
        block: true,
        raw: "```microchart mini-bar Net-new by region ($k)\nNA 48\nEU 39\nUK 27\nAPAC 22\nLATAM 18\n```",
        node: (
          <Block title="Net-new by region ($k)">
            <MiniBar
              title="Net-new by region ($k)"
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
        raw: "`microchart bullet value=72 target=80 bands=50,90`",
        node: (
          <Bullet value={72} target={80} bands={[50, 90]} width={66} height={12} summary={false} />
        ),
      },
      {
        id: "r4",
        kind: "text",
        text: " to target. A clean quarter, clear to raise for Q4.",
      },
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
        raw: "`microchart sparkbar 120 118 122 90 60 95 128 130`",
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
        raw: "```microchart seismogram Errors per minute\n2 1 3 2 18 24 9 4 2 1 2 3\n```",
        node: (
          <Block title="Errors per minute">
            <Seismogram
              title="Errors per minute"
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
        raw: "`microchart status-dot warn`",
        node: <StatusDot status="warn" style={{ width: 11, height: 11 }} summary={false} />,
      },
      {
        id: "i3",
        kind: "text",
        text: ", green by 14:11, inside the error budget, no SLO breach. Adding a write-path smoke test to the canary.",
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
        raw: "`microchart trend-arrow +0.038`",
        node: <TrendArrow value={0.038} summary={false} />,
      },
      {
        id: "m1",
        kind: "text",
        text: " on the session, a steady grind into the bell. Intraday returns stayed tight, no fat tails:",
      },
      {
        id: "m-hist",
        kind: "chart",
        block: true,
        raw: "```microchart histogram 1-min returns (bps)\n-2 -1 0 1 -1 2 1 0 3 1 -1 0 2 1 4 -2 1 0\n```",
        node: (
          <Block title="1-min returns (bps)">
            <HistogramStrip
              title="1-min returns (bps)"
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
        raw: "`microchart rug-strip 3 5 5 6 8 8 9 11 12 12 14`",
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
      {
        id: "m3",
        kind: "text",
        text: ", so slippage was minimal. The book now sits ",
      },
      {
        id: "m-bullet",
        kind: "chart",
        raw: "`microchart bullet value=88 target=75 bands=60,95`",
        node: (
          <Bullet value={88} target={75} bands={[60, 95]} width={66} height={12} summary={false} />
        ),
      },
      {
        id: "m4",
        kind: "text",
        text: " over its benchmark weight, trimming into strength on Monday.",
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

/** Split a partially-revealed text run into the settled head and the word that
 *  just landed, so only that last word gets the fade. Keying the tail span on
 *  its own index replays the animation once per word — key it on the text and
 *  a repeated word ("the … the") would silently skip its fade. */
function splitTail(p: string): [head: string, tail: string] {
  const end = p.endsWith(" ") ? p.length - 1 : p.length;
  const cut = p.lastIndexOf(" ", end - 1);
  return cut === -1 ? ["", p] : [p.slice(0, cut + 1), p.slice(cut + 1)];
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
          <span key={s.id} className={s.bare ? undefined : "mc-inline"}>
            {s.node}
          </span>
        ),
      )}
    </div>
  );
}

/** A validated live-grammar spec → the real component, same sizes and accent
 *  discipline as the scripted scenarios. Live charts keep their DEFAULT
 *  summaries — this is real content, so it gets the real accessible names. */
function renderSpec(spec: ChartSpec): ReactNode {
  switch (spec.type) {
    case "sparkline":
      return <Sparkline data={spec.values} width={58} height={15} curve="smooth" color={ACCENT} />;
    case "sparkbar":
      return <SparkBar data={spec.values} width={48} height={15} color={ACCENT} />;
    case "rug-strip":
      return <RugStrip data={spec.values} width={58} height={13} color={ACCENT} />;
    case "delta":
      return <Delta value={spec.value} />;
    case "trend-arrow":
      return <TrendArrow value={spec.value} />;
    case "bullet":
      return (
        <Bullet value={spec.value} target={spec.target} bands={spec.bands} width={66} height={12} />
      );
    case "status-dot":
      return <StatusDot status={spec.status} style={{ width: 11, height: 11 }} />;
    case "mini-bar": {
      const title = spec.title || "breakdown";
      return (
        <Block title={title}>
          <MiniBar
            title={title}
            data={spec.items}
            width={BLOCK_W}
            height={Math.max(24, spec.items.length * 10)}
            color={ACCENT}
          />
        </Block>
      );
    }
    case "segmented": {
      const title = spec.title || "mix";
      return (
        <Block title={title}>
          <SegmentedBar title={title} data={spec.items} width={BLOCK_W} height={14} />
        </Block>
      );
    }
    case "histogram": {
      const title = spec.title || "distribution";
      return (
        <Block title={title}>
          <HistogramStrip
            title={title}
            data={spec.values}
            width={BLOCK_W}
            height={44}
            color={ACCENT}
          />
        </Block>
      );
    }
    case "seismogram": {
      const title = spec.title || "activity";
      return (
        <Block title={title}>
          <Seismogram title={title} data={spec.values} width={BLOCK_W} height={44} color={ACCENT} />
        </Block>
      );
    }
  }
}

const RAW_CODE = "font-mono text-[0.82em] text-fd-muted-foreground";

/** The live Nano reply, re-parsed from the full text on every chunk. Segment
 *  order is append-only during a stream, so index keys are stable; a segment
 *  flipping in-flight → complete swaps <code> for the chart and the same
 *  hx-morph-in plays as in the scripted tour. */
function LiveReply({ text, streaming }: { text: string; streaming: boolean }) {
  const segs = parseLiveReply(text);
  const tailIdx = streaming ? segs.length - 1 : -1;
  return (
    <div className="whitespace-pre-wrap">
      {segs.map((s, i) => {
        if (s.kind === "text") {
          // Same tail fade as the scripted tour. Nano emits multi-word chunks,
          // so this fades the arriving chunk rather than a single word — which
          // is what actually landed, so it stays honest.
          if (i !== tailIdx) return <span key={i}>{s.text}</span>;
          const [head, tail] = splitTail(s.text);
          return (
            <span key={i}>
              {head}
              <span key={text.length} className="mc-tok">
                {tail}
              </span>
            </span>
          );
        }
        if (s.kind === "code")
          return (
            <code key={i} className={RAW_CODE}>
              {s.text}
            </code>
          );
        if (!s.complete || !s.spec)
          return (
            <code key={i} className={`${RAW_CODE} ${s.block ? "my-1 block" : ""}`}>
              {s.raw}
            </code>
          );
        if (s.block)
          return (
            <div key={i} className="hx-morph-in my-3 whitespace-normal">
              {renderSpec(s.spec)}
            </div>
          );
        const bare = s.spec.type === "delta" || s.spec.type === "trend-arrow";
        return (
          <span key={i} className={bare ? "hx-morph-in" : "hx-morph-in mc-inline"}>
            {renderSpec(s.spec)}
          </span>
        );
      })}
    </div>
  );
}

export function StreamVignette({
  serif = false,
}: {
  /** Reading-serif reply text (the hero treatment). */
  serif?: boolean;
} = {}) {
  const [idx, setIdx] = useState(0);
  const active = SCENARIOS[idx];
  const total = useMemo(() => active.segs.reduce((a, s) => a + atomCount(s), 0), [active]);
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const reduced = useRef(false);

  // Live mode — Chrome's on-device model, when it's already installed. The
  // scripted tour stays the default; live complements it, never replaces it.
  const live = useLiveModel();
  const [mode, setMode] = useState<"tour" | "live">("tour");
  const [asked, setAsked] = useState("");
  const [query, setQuery] = useState("");
  const liveScrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);

  // The live reply lives in a fixed-height box (the ghost-reserved area); keep
  // it pinned to the newest line while streaming, unless the reader scrolled up.
  useEffect(() => {
    const el = liveScrollRef.current;
    if (el && followRef.current) el.scrollTop = el.scrollHeight;
  }, [live.text]);

  // Announce the reply to a screen reader — once, on completion, as prose (its
  // charts flattened to their summaries), never per streamed chunk. Keyed on
  // `phase` only: at "done" the text is already final. "thinking" gives submit
  // feedback; the visible error copy is mirrored here.
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    if (live.phase === "thinking") setAnnounce("Generating a report…");
    else if (live.phase === "done") setAnnounce(speakLiveReply(live.text));
    else if (live.phase === "error")
      setAnnounce("The on-device model didn’t answer. Ask again, or resume the tour.");
    else setAnnounce("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live.phase]);

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
    // No start delay: the panel is server-rendered, so hydration is already the
    // late moment — a hold on top of it was dead air the reader read as the
    // section being broken (there used to be a 900ms one here, sized to a
    // headline animation that no longer exists).
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

  // Advance one atom at a time, at a fixed cadence (see the delay below).
  useEffect(() => {
    if (mode !== "tour") return;
    if (!running || pos >= total) {
      if (pos >= total) setRunning(false);
      return;
    }
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
    // Even cadence, not simulated typing. The hero used to jitter each word
    // (26 + random*42) to imitate a real token stream; on a fold the reader
    // only ever sees once, that stutter reads as lag rather than realism.
    // Fixed rates instead — the reveal glides. Two rates, not one: a text atom
    // is a whole word and a grammar atom is a single character, so one shared
    // rate would either strobe the prose or crawl through the backticks.
    // /docs/ai keeps the realistic pacing; that page is about the stream
    // itself, so the texture is the content there.
    //
    // These were once cut to 34/4/200 chasing a "stuck" feeling. That was the
    // wrong lever twice over: it overshot into too-fast-to-perceive, and the
    // stall was never the typing — it was the dead hold plus a from-zero
    // blurred fade at the hand-off (both fixed in .hx-morph-in). 52ms/word is
    // ~20 words a second: quick, but visibly arriving. `closing` is only the
    // beat between the fence completing and the chart replacing it; the morph
    // is the transition, so anything longer here is just dead air before it.
    const closing = inSeg === atomCount(seg) - 1;
    const delay = seg.kind === "chart" ? (closing ? 140 : 7) : 52;
    const t = window.setTimeout(() => setPos((p) => p + 1), delay);
    return () => window.clearTimeout(t);
  }, [running, pos, total, active, mode]);

  // A finished reply stays finished — no auto-advance. The replay button steps
  // to the next scenario on demand.
  const replay = () => {
    if (mode === "live") {
      // back to the scripted tour
      live.reset();
      setMode("tour");
      if (reduced.current) return;
      setPos(0);
      setRunning(true);
      return;
    }
    setIdx((i) => (i + 1) % SCENARIOS.length);
    if (reduced.current) {
      // settled view of the next scenario; Infinity ≥ any scenario's total
      setPos(Number.POSITIVE_INFINITY);
      return;
    }
    setPos(0);
    setRunning(true);
  };

  const submit = (q: string) => {
    const question = q.trim();
    if (!question || live.phase === "thinking") return;
    started.current = true;
    followRef.current = true;
    setMode("live");
    setRunning(false);
    setAsked(question);
    setQuery("");
    void live.ask(question);
  };

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
          <span key={s.id} className={s.bare ? "hx-morph-in" : "hx-morph-in mc-inline"}>
            {s.node}
          </span>,
        );
    } else if (pos > acc) {
      // in-flight segment — raw text, typed
      const p = partial(s, pos - acc);
      if (s.kind === "text") {
        // Only the word that just landed fades; the settled head stays put, so
        // the animation never re-runs over text the reader has already read.
        const [head, tail] = splitTail(p);
        view.push(
          <span key={s.id}>
            {head}
            <span key={pos} className="mc-tok">
              {tail}
            </span>
          </span>,
        );
      } else
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

  return (
    <div ref={hostRef} className="panel-soft overflow-hidden">
      <div className="flex min-h-11 items-center justify-between border-b border-hairline py-1.5 pl-4 pr-2">
        <span className="flex items-baseline gap-2 leading-none">
          <span className="mono-label leading-none">assistant reply</span>
          <span className="mono-label leading-none opacity-50">
            · {mode === "live" ? "live · on-device" : active.hint}
          </span>
        </span>
        <button
          type="button"
          aria-label={mode === "live" ? "Back to the tour" : "Play the next example"}
          title={mode === "live" ? "Back to the tour" : "Next example"}
          onClick={replay}
          className="ghost-ctrl size-8"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
      <div className={`relative px-5 py-5 ${serif ? "hv-reply-body" : ""}`}>
        {/* Stacked finished replies size the panel; tour/live overlay absolutely.
            Floor height is CSS-only (.hv-reply-floor) so SSR prediction matches. */}
        <div
          className="hv-reply-floor grid text-[length:var(--hv-reply-size,0.95rem)] leading-relaxed"
          data-live={live.supported ? "1" : undefined}
        >
          {SCENARIOS.map((s) => (
            <div key={s.id} aria-hidden className="invisible [grid-area:1/1]">
              <FinishedReply segs={s.segs} />
            </div>
          ))}
        </div>
        {mode === "tour" && (
          // Top-anchored, always. Centering was tried and reverted: the reply
          // GROWS as it streams, so a centered block slides upward the whole
          // time — the exact motion this panel is meant not to have. A settled
          // reply leaves some room beneath it; that stillness is worth it.
          <div className="absolute inset-x-5 top-5 text-[length:var(--hv-reply-size,0.95rem)] leading-relaxed text-fd-foreground">
            {view}
          </div>
        )}
        {mode === "live" && (
          <div
            ref={liveScrollRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
            }}
            className="absolute inset-x-5 bottom-5 top-5 overflow-y-auto overscroll-contain pr-1 text-[length:var(--hv-reply-size,0.95rem)] leading-relaxed text-fd-foreground"
          >
            <p className="mb-2.5 text-[0.85em] text-fd-muted-foreground">
              <span className="mono-label mr-1.5 opacity-70">you</span>
              {asked}
            </p>
            {live.phase === "error" ? (
              <p className="text-fd-muted-foreground">
                The on-device model didn&rsquo;t answer this time. Ask again, or use the arrow above
                to resume the tour.
              </p>
            ) : (
              <LiveReply
                text={live.text}
                streaming={live.phase === "thinking" || live.phase === "streaming"}
              />
            )}
          </div>
        )}
        {/* Screen-reader announcement — the reply as prose (charts flattened to
            their summaries), spoken once on completion. Separate from the
            visible box so the per-chunk stream never spams the live region. */}
        {live.supported && (
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        )}
      </div>
      {/* Always mount .hv-composer (0fr→1fr) so 1fr = real height when collapsed.
          Grid → bare clip item → content: padding on the grid item itself leaks
          ~27px when collapsed (border-box min-size). */}
      <div
        className="hv-composer"
        data-open={live.supported ? "1" : undefined}
        inert={!live.supported}
      >
        <div>
          <div className="border-t border-hairline px-4 pb-3.5 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {LIVE_SAMPLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  onMouseEnter={live.warm}
                  onFocus={live.warm}
                  className="rounded-full border border-hairline px-2.5 py-1 text-[0.72rem] leading-none text-fd-muted-foreground transition-colors hover:border-fd-primary/45 hover:text-fd-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="mt-2.5 flex items-center gap-2 rounded-full border border-hairline bg-fd-card py-1 pl-4 pr-1.5 transition-colors focus-within:border-fd-primary/60"
              onSubmit={(e) => {
                e.preventDefault();
                submit(query);
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={live.warm}
                maxLength={140}
                placeholder="ask for a tiny report of your own…"
                aria-label="Ask the on-device model for a report"
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground/60"
              />
              <button
                type="submit"
                aria-label="Ask"
                title="Ask"
                disabled={!query.trim() || live.phase === "thinking"}
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground transition-transform hover:-translate-y-px disabled:pointer-events-none disabled:opacity-35"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </form>
            <p className="mono-label mt-2 opacity-50">
              live · Gemini Nano in your Chrome · numbers are illustrative
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
