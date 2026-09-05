"use client";
/**
 * Scripted assistant stream: inline `microchart …` and fenced ```microchart blocks
 * parse into real shipped components. Ghost copy reserves height (no CLS).
 *
 * When Chrome's on-device model is already installed, a first tab hands the same
 * grammar to it live (see live-tab.tsx); the scripted tabs are what everyone
 * else sees, and are unchanged either way.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Message, parse } from "@/components/charts/stream-render";
// Statically imported, deliberately. Code-splitting this tab made switching to
// it a download: the panel collapsed to nothing and sprang back to full height.
// A tab has to behave like a tab, so its cost is paid with the page.
import { LiveTab } from "@/components/charts/live-tab";
import { useLiveModel } from "@/components/charts/use-live-model";

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

// 52ms per word. A word is two ticks here (token + trailing whitespace) → 38+14.
// Stall feel is usually the fence morph, not these rates.
function nextDelay(last: string | null, next: string): number {
  if (last === null) return 380;
  if (last.includes("\n\n")) return 140;
  if (last === "```") return 140; // fence → morph settle
  if (/^\s+$/.test(next)) return 14;
  return 38;
}

/** The on-device tab's id. Not a `Stream`: it has no script. */
const LIVE_ID = "live";

export function StreamDemo() {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Offered only when Chrome's model is already installed; everyone else sees
  // exactly the five scripted tabs.
  const live = useLiveModel();
  const [activeId, setActiveId] = useState(STREAMS[0].id);
  const isLive = activeId === LIVE_ID;
  const tabIds = useMemo(
    () => (live.supported ? [LIVE_ID, ...STREAMS.map((s) => s.id)] : STREAMS.map((s) => s.id)),
    [live.supported],
  );
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
    // oxlint-disable-next-line react/set-state-in-effect
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
    if (isLive) return;
    if (reduced) {
      // oxlint-disable-next-line react/set-state-in-effect
      setCount(total);
      return;
    }
    if (!startedRef.current) return;
    // oxlint-disable-next-line react/set-state-in-effect
    setCount(0);
    setRunning(true);
  }, [activeId, isLive, reduced, total]);

  // One timer per revealed token. Re-running per `count` makes replay deterministic.
  useEffect(() => {
    if (!running || isLive) return;
    if (count >= total) {
      // oxlint-disable-next-line react/set-state-in-effect
      setRunning(false);
      return;
    }
    const last = count > 0 ? (tokens[count - 1] ?? null) : null;
    const id = window.setTimeout(
      () => setCount((c) => c + 1),
      nextDelay(last, tokens[count] ?? ""),
    );
    return () => clearTimeout(id);
  }, [running, isLive, count, total, tokens]);

  const replay = () => {
    if (reduced) return; // reduced motion stays on the finished conversation
    setCount(0);
    setRunning(true);
  };

  const revealed = useMemo(() => tokens.slice(0, count).join(""), [tokens, count]);
  const nodes = useMemo(() => parse(revealed), [revealed]);
  // Words revealed, not tokens — this keys the tail fade. Tokens alternate
  // word / whitespace, so keying on `count` re-mounted the fading span twice
  // per word: once when the word landed, then again ~14ms later when its
  // trailing space did (splitTail looks past a trailing space, so the tail is
  // still that same word). Two fades a few frames apart is the flicker.
  const wordTick = useMemo(
    () => tokens.slice(0, count).reduce((n, t) => n + (/\S/.test(t) ? 1 : 0), 0),
    [tokens, count],
  );
  const done = count >= total;
  const status = done ? "streamed" : running && count === 0 ? "thinking…" : "streaming…";
  const ghost = useMemo(() => <Message nodes={fullNodes} animate={false} />, [fullNodes]);

  // Roving arrow keys across the chip row, as a tablist owes its keyboard users:
  // one tab stop in, then ← → to move between scenarios.
  const onTabKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const i = tabIds.indexOf(activeId);
    const next = tabIds[(i + step + tabIds.length) % tabIds.length];
    setActiveId(next);
    document.getElementById(`stream-tab-${next}`)?.focus();
  };

  const tab = (id: string, label: string, hint: string) => (
    <button
      key={id}
      id={`stream-tab-${id}`}
      type="button"
      role="tab"
      aria-selected={id === activeId}
      aria-controls="stream-panel"
      tabIndex={id === activeId ? 0 : -1}
      onClick={() => setActiveId(id)}
      title={hint}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[0.78rem] transition-colors",
        id === activeId
          ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
          : "border-hairline text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className="panel not-prose overflow-hidden">
      <div
        role="tablist"
        aria-label="Assistant reply examples"
        onKeyDown={onTabKey}
        className="flex flex-wrap items-center gap-1.5 border-b border-hairline px-3 py-2.5"
      >
        {live.supported && tab(LIVE_ID, "Ask it yourself", "on-device model in your Chrome")}
        {STREAMS.map((s) => tab(s.id, s.label, s.hint))}
      </div>

      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: "var(--accent)" }} />
          <span className="mono-label">assistant</span>
          <span className="mono-label opacity-50">
            · {isLive ? "live · on-device" : active.hint}
          </span>
        </div>
        {!isLive && (
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
        )}
      </div>

      <div id="stream-panel" role="tabpanel" aria-labelledby={`stream-tab-${activeId}`}>
        {isLive ? (
          <LiveTab live={live} />
        ) : (
          // A hidden ghost of the finished reply fixes the height; the streaming
          // copy overlays it, so nothing below the demo shifts mid-stream.
          <div className="grid-paper px-5 py-6">
            <div className="relative">
              <div aria-hidden className="invisible">
                {ghost}
              </div>
              <div className="absolute inset-0">
                <Message nodes={nodes} animate streaming={!done} tick={wordTick} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
