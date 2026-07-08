"use client";
// oxlint-disable react/no-array-index-key -- streamed text/chart nodes have
// stable POSITIONAL identity (order never changes; only the tail grows), so the
// index is the correct key. Content-derived keys would remount — and re-animate —
// already-rendered charts on every token tick.
/**
 * The AI-native centerpiece — a scripted assistant reply streams in token by
 * token, and the chart syntax it emits becomes real, accessible microcharts:
 * inline `chart …` spans render word-sized inside the sentence, fenced ```chart
 * blocks render standalone. The charts are the actual shipped components (parsed
 * from a compact, LLM-friendly grammar), so this doubles as a docs-as-tests
 * proof that the format round-trips.
 *
 * Zero layout shift: a hidden "ghost" copy of the FINISHED reply reserves the
 * final height, and the streaming copy is overlaid on top — so the panel is its
 * final size from the first frame and nothing below it ever moves. All motion is
 * reduced-motion gated.
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { RotateCcw } from "lucide-react";

// The literal text the model "types". Grammar: inline `chart <type> <data>` for
// word-sized charts in a sentence; a fenced ```chart <type> block for standalone
// ones. Body is whitespace-separated numbers, or key=value for composites.
const SCRIPT = `Q3 landed ahead of plan. Revenue climbed steadily \`chart sparkline 132 148 141 165 159 182 176 203\` through the quarter, at a healthy **9 deploys/day**:

\`\`\`chart sparkbar
6 9 5 11 7 12 8 10
\`\`\`

Week over week that is \`chart delta +0.184\`, putting us at **72%** of the annual quota — just short of the 80% target:

\`\`\`chart bullet
value=72 target=80 bands=50,90
\`\`\`

Commit activity held steady \`chart activity 0 2 1 3 4 2 1 3 2 4 3 2\` across the team.
`;

type Node = { t: "text"; v: string } | { t: "code"; type: string; body: string; closed: boolean };

// Split partially-revealed markdown into text + fenced-chart nodes. Handles a
// fence still streaming (closed:false) so it can render raw first, then morph.
function parse(src: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf("```chart", i);
    if (open === -1) {
      nodes.push({ t: "text", v: src.slice(i) });
      break;
    }
    if (open > i) nodes.push({ t: "text", v: src.slice(i, open) });
    const headerEnd = src.indexOf("\n", open);
    if (headerEnd === -1) {
      nodes.push({ t: "code", type: src.slice(open + 8).trim(), body: "", closed: false });
      break;
    }
    const type = src.slice(open + 8, headerEnd).trim();
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

const CHART_W = 240;

// Standalone block chart (the fenced form). Memoized: once a fence closes its
// (type, body) are final, so it skips re-render on every later streamed token.
const BlockChart = memo(function BlockChart({ type, body }: { type: string; body: string }) {
  switch (type) {
    case "sparkline":
      return (
        <Sparkline
          data={nums(body)}
          width={CHART_W}
          height={44}
          curve="smooth"
          dots="minmax"
          label="last"
          title="Revenue"
        />
      );
    case "sparkbar":
      return <SparkBar data={nums(body)} width={CHART_W} height={44} title="Deploys per day" />;
    case "bullet": {
      const p = kv(body);
      return (
        <Bullet
          value={Number(p.value)}
          target={p.target ? Number(p.target) : undefined}
          bands={p.bands ? p.bands.split(",").map(Number) : undefined}
          width={CHART_W}
          height={26}
          title="Quota attainment"
        />
      );
    }
    case "delta":
      return (
        <span className="text-xl">
          <Delta value={Number(body.trim())} title="Week over week" />
        </span>
      );
    case "activity":
      return <ActivityGrid data={nums(body)} layout="strip" cell={10} title="Commit activity" />;
    default:
      return null;
  }
});

// Word-sized chart that sits inside a sentence — the microcharts thesis. Decorative
// (summary={false}); the surrounding text is its description. Memoized so revealed
// inline charts don't re-render on every subsequent streamed token.
const InlineChart = memo(function InlineChart({ spec }: { spec: string }) {
  const sp = spec.indexOf(" ");
  const type = sp === -1 ? spec : spec.slice(0, sp);
  const data = sp === -1 ? "" : spec.slice(sp + 1);
  const node = (() => {
    switch (type) {
      case "sparkline":
        return (
          <Sparkline
            data={nums(data)}
            width={52}
            height={15}
            curve="smooth"
            dots="minmax"
            summary={false}
          />
        );
      case "sparkbar":
        return <SparkBar data={nums(data)} width={46} height={15} summary={false} />;
      case "delta":
        return <Delta value={Number(data.trim())} summary={false} />;
      case "bullet": {
        const p = kv(data);
        return (
          <Bullet
            value={Number(p.value)}
            target={p.target ? Number(p.target) : undefined}
            bands={p.bands ? p.bands.split(",").map(Number) : undefined}
            width={58}
            height={11}
            summary={false}
          />
        );
      }
      case "activity":
        return <ActivityGrid data={nums(data)} layout="strip" cell={6} summary={false} />;
      default:
        return null;
    }
  })();
  if (!node) return null;
  // Delta is text — the library's .mc-delta already vertical-aligns it to the
  // line, so just give it breathing room (no transform that would drop it).
  if (type === "delta") return <span className="mx-1">{node}</span>;
  // SVG charts: match the proven FourContexts inline pattern (inline-flex +
  // align-middle) so they sit centred on the text line; inline-flex still lets
  // the morph transform apply.
  return <span className="mc-morph mx-1 inline-flex align-middle">{node}</span>;
});

// Inline markdown — **bold**, an inline `chart …` span, or plain `code`.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return (
            <strong key={i} className="font-medium text-fd-foreground">
              {p.slice(2, -2)}
            </strong>
          );
        if (p.startsWith("`") && p.endsWith("`")) {
          const inner = p.slice(1, -1);
          if (inner.startsWith("chart ")) return <InlineChart key={i} spec={inner.slice(6)} />;
          return (
            <code key={i} className="font-mono text-[0.9em] text-fd-primary">
              {inner}
            </code>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// One rendered message body. `animate` adds the settle on block charts; the ghost
// copy passes false. `caret` shows the typing cursor at the tail.
function Message({ nodes, animate, caret }: { nodes: Node[]; animate: boolean; caret: boolean }) {
  return (
    <div className="max-w-xl text-[0.98rem] leading-relaxed text-fd-foreground/85">
      {nodes.map((n, i) =>
        n.t === "text" ? (
          <span key={i} className="whitespace-pre-wrap">
            <Inline text={n.v} />
          </span>
        ) : n.closed ? (
          <span key={i} className={`my-3 flex justify-start${animate ? " mc-stream-chart" : ""}`}>
            <BlockChart type={n.type} body={n.body} />
          </span>
        ) : (
          <code
            key={i}
            className="code-inset my-3 block whitespace-pre px-4 py-3 font-mono text-[0.8rem] text-fd-muted-foreground"
          >
            {"```chart " + n.type + "\n" + n.body}
          </code>
        ),
      )}
      {caret && <span className="mc-caret" aria-hidden />}
    </div>
  );
}

// Reveal a token at a time (word / whitespace runs) rather than by character —
// closer to how a model actually streams. The join reconstructs SCRIPT exactly.
const TOKENS = SCRIPT.match(/\s+|\S+/g) ?? [];
const FULL_NODES = parse(SCRIPT);

// How long to wait AFTER revealing `last`, before the next token. Tuned to feel
// like a real stream: words land at a readable clip, clauses breathe, and a
// closed chart fence gets a beat so the raw→rendered morph is savoured.
function nextDelay(last: string | null, next: string): number {
  if (last === null) return 450; // a beat of "thinking" before the first token
  if (last.includes("\n\n")) return 300; // paragraph break
  if (last === "```") return 560; // a chart just closed → let it morph in
  if (/[.:;!?]$/.test(last)) return 200 + Math.random() * 150; // end of a clause
  if (last.endsWith(",")) return 140 + Math.random() * 90;
  if (/^\s+$/.test(next)) return 20 + Math.random() * 30; // whitespace flicks by
  return 55 + Math.random() * 85; // a word
}

export function StreamDemo() {
  const total = TOKENS.length;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Reduced motion: skip the animation, show the finished conversation. Done in
  // an effect (not the initial state) so server + client first render agree.
  useEffect(() => {
    if (reduced) setCount(total);
  }, [reduced, total]);

  // Start the stream only once it scrolls into view — below the fold, the whole
  // point (watching the charts appear) would otherwise be missed.
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            setRunning(true);
            io.disconnect();
          }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // One timer per revealed token. Re-running per `count` (rather than a shared
  // mutable ref) makes replay deterministic: reset count → this reschedules.
  useEffect(() => {
    if (!running) return;
    if (count >= total) {
      setRunning(false);
      return;
    }
    const last = count > 0 ? (TOKENS[count - 1] ?? null) : null;
    const id = window.setTimeout(
      () => setCount((c) => c + 1),
      nextDelay(last, TOKENS[count] ?? ""),
    );
    return () => clearTimeout(id);
  }, [running, count, total]);

  const replay = () => {
    if (reduced) return; // reduced motion stays on the finished conversation
    setCount(0);
    setRunning(true);
  };

  const revealed = useMemo(() => TOKENS.slice(0, count).join(""), [count]);
  const nodes = useMemo(() => parse(revealed), [revealed]);
  const done = count >= total;
  const status = done ? "streamed" : running && count === 0 ? "thinking…" : "streaming…";
  // The ghost never changes — render it once, not on every token tick.
  const ghost = useMemo(() => <Message nodes={FULL_NODES} animate={false} caret={false} />, []);

  return (
    <div ref={rootRef} className="panel not-prose overflow-hidden">
      {/* chat header */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="mono-label">assistant</span>
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

      {/* the message. A hidden ghost of the FINISHED reply fixes the height; the
          streaming copy overlays it, so nothing below the demo ever shifts. */}
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
