"use client";
// oxlint-disable react/no-array-index-key -- streamed text/chart nodes have
// stable POSITIONAL identity (order never changes; only the tail grows), so the
// index is the correct key. Content-derived keys would remount — and re-animate —
// already-rendered charts on every token tick.
/**
 * Scripted assistant stream: inline `microchart …` and fenced ```microchart blocks
 * parse into real shipped components. Ghost copy reserves height (no CLS).
 */
import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { Horizon } from "@microcharts/react/horizon";
import { Waveform } from "@microcharts/react/waveform";
import { Seismogram } from "@microcharts/react/seismogram";
import { HeatStrip } from "@microcharts/react/heat-strip";
import { RugStrip } from "@microcharts/react/rug-strip";
import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { MiniBar } from "@microcharts/react/mini-bar";
import { Funnel } from "@microcharts/react/funnel";
import { Waterfall } from "@microcharts/react/waterfall";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { Progress } from "@microcharts/react/progress";
import { ProgressRing } from "@microcharts/react/progress-ring";
import { Thermometer } from "@microcharts/react/thermometer";
import { StatusDot } from "@microcharts/react/status-dot";
import { MicroBox } from "@microcharts/react/micro-box";
import { TallyMarks } from "@microcharts/react/tally-marks";
import { DotPlot } from "@microcharts/react/dot-plot";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

// Each reply the model "types". Grammar: inline `microchart <type> <data>` for a
// word-sized chart in a sentence; a fenced ```microchart <type> <title> block for a
// standalone one (body is whitespace/comma numbers, or key=value for composites).
interface Stream {
  id: string;
  label: string;
  hint: string;
  script: string;
}

const STREAMS: Stream[] = [
  {
    id: "revenue",
    label: "Revenue",
    hint: "business recap",
    script: `Q3 closed **12% ahead of plan**. Revenue built week over week \`microchart sparkline 132 148 141 165 159 182 176 203\` — up \`microchart delta +0.184\` on Q2 — and the growth was broad, not one big deal carrying the quarter:

\`\`\`microchart mini-bar Net-new revenue by region ($k)
48 39 27 22 18
\`\`\`

The funnel held up end to end. Lead → demo → trial → paid converted at **19%** overall, with the trial→paid step the one to watch:

\`\`\`microchart funnel Q3 pipeline
1000 540 320 190
\`\`\`

Expansion pulled its weight too — net revenue retention landed at **114%**. Forecasting Q4 flat-to-up from here.
`,
  },
  {
    id: "incident",
    label: "Incident",
    hint: "SRE / on-call",
    script: `Postmortem for INC-2231. The 14:02 deploy regressed the write path — request volume held steady \`microchart sparkbar 120 118 122 90 60 95 128 130\`, but 5xx errors spiked hard for six minutes:

\`\`\`microchart seismogram Errors per minute
2 1 3 2 18 24 9 4 2 1 2 3
\`\`\`

We caught it fast: alert at 14:03, status \`microchart status-dot warn\`, rollback at 14:08, green by 14:11. Deploys resumed once the canary cleared \`microchart activity 1 0 2 3 1 0 2 4 3 2\`. Net customer impact was **~40s of elevated latency** — inside the error budget, no SLO breach. Action item: add a write-path smoke test to the canary.
`,
  },
  {
    id: "markets",
    label: "Markets",
    hint: "finance / trading",
    script: `NVDA closed **+3.8%** \`microchart trend-arrow +0.038\` on the session — a steady grind higher into the bell. Intraday returns stayed tight around the mean, no fat tails:

\`\`\`microchart histogram 1-min returns (bps)
-2 -1 0 1 -1 2 1 0 3 1 -1 0 2 1 4 -2 1 0
\`\`\`

Fills clustered mid-book \`microchart rug-strip 3 5 5 6 8 8 9 11 12 12 14\`, so slippage was minimal. P&L attribution across the desk's five names was clean — one detractor, four contributors:

\`\`\`microchart waterfall P&L attribution ($k)
40 -12 28 -8 15
\`\`\`

The book now sits **14% over** its benchmark weight; trimming into strength on Monday.
`,
  },
  {
    id: "health",
    label: "Health",
    hint: "consumer wellness",
    script: `Strong week overall. Your overnight heart rate stayed low and even — a solid recovery signal, and down from last week:

\`\`\`microchart horizon Resting HR, 7 nights (bpm)
62 60 58 61 59 57 60 58 56 59 57 55
\`\`\`

You logged \`microchart tally-marks 5\` workouts and closed \`microchart progress value=0.9\` of the monthly move goal — one good push this weekend clears it. Recovery held strong across every system, HRV out in front:

\`\`\`microchart dot-plot Recovery by system (0–100)
82 74 91 68 79
\`\`\`
`,
  },
  {
    id: "ml",
    label: "ML training",
    hint: "advanced / dense",
    script: `Run 47 promoted. Training loss fell cleanly \`microchart sparkline 2.9 2.1 1.6 1.2 0.9 0.7 0.6 0.55\` over eight epochs — no divergence, no plateau — and eval cleared the promotion gate with room to spare:

\`\`\`microchart bullet Eval accuracy vs gate (%)
value=94 target=90 bands=70,95
\`\`\`

Inference latency held tight under load, with a couple of tail spikes worth watching before we raise QPS:

\`\`\`microchart micro-box p99 latency (ms)
18 20 19 21 22 24 26 30 38 55 90
\`\`\`

Accelerators ran near saturation the whole run \`microchart progress-ring value=0.96\`, and attention density concentrated in the mid layers, exactly as this architecture predicts:

\`\`\`microchart heat-strip Attention weight by layer
12 20 34 58 92 140 96 44 22 14
\`\`\`

Shipping to staging now; canary at 5% traffic.
`,
  },
];

type Node = { t: "text"; v: string } | { t: "code"; type: string; body: string; closed: boolean };

const FENCE_OPEN = "```microchart";

// Split partially-revealed markdown into text + fenced-chart nodes. Handles a
// fence still streaming (closed:false) so it can render raw first, then morph.
function parse(src: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf(FENCE_OPEN, i);
    if (open === -1) {
      nodes.push({ t: "text", v: src.slice(i) });
      break;
    }
    if (open > i) nodes.push({ t: "text", v: src.slice(i, open) });
    const headerEnd = src.indexOf("\n", open);
    if (headerEnd === -1) {
      nodes.push({
        t: "code",
        type: src.slice(open + FENCE_OPEN.length).trim(),
        body: "",
        closed: false,
      });
      break;
    }
    const type = src.slice(open + FENCE_OPEN.length, headerEnd).trim();
    const close = src.indexOf("```", headerEnd + 1);
    if (close === -1) {
      nodes.push({ t: "code", type, body: src.slice(headerEnd + 1), closed: false });
      break;
    }
    nodes.push({ t: "code", type, body: src.slice(headerEnd + 1, close).trim(), closed: true });
    i = close + 3;
    if (src[i] === "\n") i += 1;
  }
  return nodes;
}

function nums(body: string): number[] {
  return body
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function kv(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tok of body.split(/\s+/)) {
    const eq = tok.indexOf("=");
    if (eq > 0) out[tok.slice(0, eq)] = tok.slice(eq + 1);
  }
  return out;
}

/** Block info string is `<type> [title…]`; split them, with a sensible default. */
const DEFAULT_TITLE: Record<string, string> = {
  sparkline: "Series",
  sparkbar: "Values",
  bullet: "Target",
  delta: "Change",
  activity: "Activity",
};
function splitInfo(info: string): { type: string; title: string } {
  const sp = info.indexOf(" ");
  const type = sp === -1 ? info : info.slice(0, sp);
  const title = sp === -1 ? (DEFAULT_TITLE[type] ?? "Chart") : info.slice(sp + 1).trim();
  return { type, title };
}

const CHART_W = 240;
const labeled = (b: string, prefix: string) =>
  nums(b).map((v, i) => ({ label: `${prefix}${i + 1}`, value: v }));

// One renderer for every supported grammar type — the demo reaches across the
// catalog, not the same five charts everywhere. Charts are decorative
// (summary={false}); block charts get a visible mono caption (from the info
// string), inline ones are described by the surrounding sentence. Data is
// number[], mapped to {label,value}[] for categorical charts, or key=value for
// composites.
// Data charts get the site accent so the stream reads vibrant, not monochrome
// grey; charts that already encode meaning by colour (delta/trend/status/bullet/
// progress/thermometer, the heat ramp) keep their own semantics.
const TINTED = new Set([
  "sparkline",
  "sparkbar",
  "horizon",
  "waveform",
  "seismogram",
  "rug-strip",
  "histogram",
  "mini-bar",
  "micro-box",
  "dot-plot",
  "funnel",
  "waterfall",
]);
function renderStream(type: string, body: string, block: boolean): ReactNode {
  const acc = TINTED.has(type)
    ? { summary: false as const, color: "var(--mc-accent)" }
    : { summary: false as const };
  switch (type) {
    case "sparkline":
      return (
        <Sparkline
          data={nums(body)}
          width={block ? CHART_W : 54}
          height={block ? 44 : 15}
          curve="smooth"
          dots={block ? "minmax" : undefined}
          label={block ? "last" : undefined}
          {...acc}
        />
      );
    case "sparkbar":
      return (
        <SparkBar
          data={nums(body)}
          width={block ? CHART_W : 46}
          height={block ? 44 : 15}
          {...acc}
        />
      );
    case "horizon":
      return (
        <Horizon data={nums(body)} width={block ? CHART_W : 56} height={block ? 34 : 14} {...acc} />
      );
    case "waveform":
      return (
        <Waveform
          data={nums(body)}
          width={block ? CHART_W : 54}
          height={block ? 40 : 15}
          {...acc}
        />
      );
    case "seismogram":
      return (
        <Seismogram
          data={nums(body)}
          width={block ? CHART_W : 56}
          height={block ? 40 : 16}
          {...acc}
        />
      );
    case "heat-strip":
      return (
        <HeatStrip
          data={nums(body)}
          width={block ? CHART_W : 56}
          height={block ? 22 : 12}
          {...acc}
        />
      );
    case "rug-strip":
      return (
        <RugStrip
          data={nums(body)}
          width={block ? CHART_W : 56}
          height={block ? 20 : 12}
          {...acc}
        />
      );
    case "histogram":
      return (
        <HistogramStrip
          data={nums(body)}
          width={block ? CHART_W : 60}
          height={block ? 40 : 16}
          {...acc}
        />
      );
    case "activity":
      return <ActivityGrid data={nums(body)} layout="strip" cell={block ? 10 : 6} {...acc} />;
    case "mini-bar":
      return (
        <MiniBar
          data={labeled(body, "c")}
          width={block ? CHART_W : 56}
          height={block ? 40 : 16}
          {...acc}
        />
      );
    case "funnel":
      return (
        <Funnel
          data={labeled(body, "s")}
          width={block ? CHART_W : 60}
          height={block ? 44 : 18}
          {...acc}
        />
      );
    case "waterfall":
      return (
        <Waterfall
          data={labeled(body, "S")}
          width={block ? CHART_W : 64}
          height={block ? 44 : 18}
          {...acc}
        />
      );
    case "bullet": {
      const p = kv(body);
      return (
        <Bullet
          value={Number(p.value)}
          target={p.target ? Number(p.target) : undefined}
          bands={p.bands ? p.bands.split(",").map(Number) : undefined}
          width={block ? CHART_W : 58}
          height={block ? 26 : 11}
          {...acc}
        />
      );
    }
    case "progress": {
      const p = kv(body);
      const v = p.value !== undefined ? Number(p.value) : Number(body.trim());
      return <Progress value={v} width={block ? CHART_W : 56} height={block ? 12 : 10} {...acc} />;
    }
    case "thermometer": {
      const p = kv(body);
      return (
        <Thermometer
          value={Number(p.value)}
          target={p.target ? Number(p.target) : undefined}
          height={block ? 48 : 22}
          {...acc}
        />
      );
    }
    case "delta":
      return <Delta value={Number(body.trim())} {...acc} />;
    case "trend-arrow":
      return <TrendArrow value={Number(body.trim())} {...acc} />;
    case "status-dot":
      return (
        <StatusDot
          status={body.trim()}
          style={{ width: block ? 12 : 10, height: block ? 12 : 10 }}
          {...acc}
        />
      );
    case "micro-box":
      return (
        <MicroBox
          data={nums(body)}
          width={block ? CHART_W : 64}
          height={block ? 36 : 16}
          {...acc}
        />
      );
    case "progress-ring": {
      const p = kv(body);
      const v = p.value !== undefined ? Number(p.value) : Number(body.trim());
      const d = block ? 30 : 15;
      // label="none" drops the centred percent so the ring fills its box and
      // sits centred on the text line instead of high (label reserves space).
      return <ProgressRing value={v} label="none" style={{ width: d, height: d }} {...acc} />;
    }
    case "tally-marks": {
      const p = kv(body);
      const v = p.value !== undefined ? Number(p.value) : Number(body.trim());
      return <TallyMarks value={v} height={block ? 24 : 15} {...acc} />;
    }
    case "dot-plot":
      return (
        <DotPlot
          data={labeled(body, "d")}
          width={block ? CHART_W : 60}
          height={block ? 30 : 22}
          {...acc}
        />
      );
    default:
      return null;
  }
}

// Text metrics (Delta) keep their own baseline so the number sits on the
// sentence line. Every other inline SVG mark gets `.mc-inline`, which seats
// the mark on the text baseline (font-independent — see styles.css).
const TEXT_GLYPH = new Set(["delta"]);

// Standalone block chart (fenced form). Info string is `<type> [title…]`. Memoized:
// once a fence closes its (info, body) are final, so it skips later token re-renders.
const BlockChart = memo(function BlockChart({ info, body }: { info: string; body: string }) {
  const { type, title } = splitInfo(info);
  const node = renderStream(type, body, true);
  if (!node) return null;
  if (type === "delta" || type === "status-dot") return <span className="text-xl">{node}</span>;
  return (
    <figure className="not-prose flex flex-col gap-1.5">
      <figcaption className="mono-label opacity-55">{title}</figcaption>
      {node}
    </figure>
  );
});

// Inline chart inside a sentence.
const InlineChart = memo(function InlineChart({ spec }: { spec: string }) {
  const sp = spec.indexOf(" ");
  const type = sp === -1 ? spec : spec.slice(0, sp);
  const data = sp === -1 ? "" : spec.slice(sp + 1);
  const node = renderStream(type, data, false);
  if (!node) return null;
  if (TEXT_GLYPH.has(type)) return <span className="mx-1">{node}</span>;
  return <span className="mc-inline mc-morph">{node}</span>;
});

// Inline markdown — **bold**, an inline `microchart …` span, or plain `code`.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((part) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={`b:${part}`} className="font-medium text-fd-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        if (part.startsWith("`") && part.endsWith("`")) {
          const inner = part.slice(1, -1);
          if (inner.startsWith("microchart "))
            return <InlineChart key={`mc:${inner}`} spec={inner.slice(11)} />;
          return (
            <code key={`code:${inner}`} className="font-mono text-[0.9em] text-fd-primary">
              {inner}
            </code>
          );
        }
        return <span key={`t:${part}`}>{part}</span>;
      })}
    </>
  );
}

// One rendered message body. `animate` adds the settle on block charts; the ghost
// copy passes false. `caret` shows the typing cursor at the tail.
//
// Nodes are keyed by POSITION (index), never by content. parse() only ever
// extends the last node or appends a new one as the stream grows, so index i
// keeps the same semantic node throughout — React updates its text in place
// instead of remounting the span. Content-derived keys grew every token, which
// remounted each text span AND re-mounted the inline charts inside it, replaying
// their entrance animation on every tick (the visible flicker). A fenced block
// flipping open→closed does change the element type at its index, so THAT node
// remounts once and morphs in — which is exactly what we want.
function Message({ nodes, animate, caret }: { nodes: Node[]; animate: boolean; caret: boolean }) {
  return (
    <div className="max-w-xl text-[0.98rem] leading-relaxed text-fd-foreground/85">
      {nodes.map((n, i) =>
        n.t === "text" ? (
          <span key={i} className="whitespace-pre-wrap">
            <Inline text={n.v} />
          </span>
        ) : n.closed ? (
          <span key={i} className={`my-2 flex justify-start${animate ? " mc-stream-chart" : ""}`}>
            <BlockChart info={n.type} body={n.body} />
          </span>
        ) : (
          <code
            key={i}
            className="code-inset my-3 block whitespace-pre px-4 py-3 font-mono text-[0.8rem] text-fd-muted-foreground"
          >
            {"```microchart " + n.type + "\n" + n.body}
          </code>
        ),
      )}
      {caret && <span className="mc-caret" aria-hidden />}
    </div>
  );
}

// Delay after revealing `last` before the next token.
//
// This page keeps the realistic cadence — the stream IS the subject here, so
// clause pauses are content, not decoration.
//
// A first attempt at "it feels slow" cut every rate to ~55% of the clock. That
// diagnosed the wrong thing: replies did run long (14–21s across the five
// scripts), but the part that read as *stuck* was the fence hand-off, not the
// typing, and at 55% the prose became too quick to follow. So the word rates
// come back up to ~83% of original, and the one value that actually drops is
// the closing-fence hold — see below.
function nextDelay(last: string | null, next: string): number {
  if (last === null) return 380; // a beat of "thinking" before the first token
  if (last.includes("\n\n")) return 250; // paragraph break
  // A chart just closed. This used to be 560ms of nothing, and .mc-stream-chart
  // then faded the chart up from opacity 0 through a 3px blur over another
  // 0.42s — nearly a second where the code had vanished and the chart had not
  // arrived. The morph is now a 0.26s settle from part-visible, so this only
  // needs to be the beat that lets the reader see the fence complete.
  if (last === "```") return 200;
  if (/[.:;!?]$/.test(last)) return 145 + Math.random() * 110; // end of a clause
  if (last.endsWith(",")) return 110 + Math.random() * 70;
  if (/^\s+$/.test(next)) return 16 + Math.random() * 25; // whitespace flicks by
  return 46 + Math.random() * 70; // a word
}

export function StreamDemo() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [activeId, setActiveId] = useState(STREAMS[0].id);
  const active = useMemo(() => STREAMS.find((s) => s.id === activeId) ?? STREAMS[0], [activeId]);
  const tokens = useMemo(() => active.script.match(/\s+|\S+/g) ?? [], [active]);
  const fullNodes = useMemo(() => parse(active.script), [active]);
  const total = tokens.length;

  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false); // has the demo ever entered the viewport?

  // Reduced motion: skip animation, show the finished reply (per active stream).
  useEffect(() => {
    if (reduced) setCount(total);
  }, [reduced, total]);

  // Start on scroll-in — below the fold, watching the charts appear would be missed.
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            startedRef.current = true;
            setCount(0);
            setRunning(true);
            io.disconnect();
          }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // Switching sector: restart the new reply from the top (only once the demo has
  // been seen — otherwise the IO above owns the first play).
  useEffect(() => {
    if (reduced) {
      setCount(total);
      return;
    }
    if (!startedRef.current) return;
    setCount(0);
    setRunning(true);
  }, [activeId, reduced, total]);

  // One timer per revealed token. Re-running per `count` makes replay deterministic.
  useEffect(() => {
    if (!running) return;
    if (count >= total) {
      setRunning(false);
      return;
    }
    const last = count > 0 ? (tokens[count - 1] ?? null) : null;
    const id = window.setTimeout(
      () => setCount((c) => c + 1),
      nextDelay(last, tokens[count] ?? ""),
    );
    return () => clearTimeout(id);
  }, [running, count, total, tokens]);

  const replay = () => {
    if (reduced) return; // reduced motion stays on the finished conversation
    setCount(0);
    setRunning(true);
  };

  const revealed = useMemo(() => tokens.slice(0, count).join(""), [tokens, count]);
  const nodes = useMemo(() => parse(revealed), [revealed]);
  const done = count >= total;
  const status = done ? "streamed" : running && count === 0 ? "thinking…" : "streaming…";
  const ghost = useMemo(
    () => <Message nodes={fullNodes} animate={false} caret={false} />,
    [fullNodes],
  );

  return (
    <div ref={rootRef} className="panel not-prose overflow-hidden">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-3 py-2.5">
        {STREAMS.map((s) => (
          <button
            key={s.id}
            type="button"
            data-active={s.id === activeId}
            onClick={() => setActiveId(s.id)}
            title={s.hint}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[0.78rem] transition-colors",
              s.id === activeId
                ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
                : "border-hairline text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="mono-label">assistant</span>
          <span className="mono-label opacity-50">· {active.hint}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono-label opacity-70">{status}</span>
          <button
            type="button"
            onClick={replay}
            aria-label="Replay"
            className="ghost-ctrl size-7"
            title="Replay"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* the message. A hidden ghost of the finished reply fixes the height; the
          streaming copy overlays it, so nothing below the demo shifts mid-stream. */}
      <div className="grid-paper px-5 py-6">
        <div className="relative">
          <div aria-hidden className="invisible">
            {ghost}
          </div>
          <div className="absolute inset-0">
            <Message nodes={nodes} animate caret={!done} />
          </div>
        </div>
      </div>
    </div>
  );
}
