"use client";
import "@microcharts/react/motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { BumpStrip } from "@microcharts/react/bump-strip/interactive";
import { Threshold, Marker } from "@microcharts/react/annotations";

/**
 * 01 · The grammar, live: the JSX types itself in (~10 ms/char), the real
 * component draws, and the sentence under it is read back OUT OF THE DOM —
 * the actual generated aria-label of the mounted chart, never a hardcoded
 * quote. Each tab's code string mirrors its rendered element exactly.
 * Reduced motion: full code, settled chart, sentence — no typing.
 */

interface Tab {
  id: string;
  label: string;
  code: string;
  /** remount with `animate` when `drawn` flips */
  node: (drawn: boolean) => ReactNode;
}

const REVENUE = [132, 148, 141, 165, 159, 182, 176, 203];
const LATENCY = [212, 208, 199, 204, 190, 186, 181, 168];
const RANKS = [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1];
const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
];

const TABS: Tab[] = [
  {
    id: "sparkline",
    label: "Sparkline",
    code: `<Sparkline
  title="Weekly revenue"
  data={[132, 148, 141, 165, 159, 182, 176, 203]}
  curve="smooth"
/>`,
    node: (drawn) => (
      <Sparkline
        key={String(drawn)}
        title="Weekly revenue"
        data={REVENUE}
        curve="smooth"
        width={150}
        height={36}
        animate={drawn}
      />
    ),
  },
  {
    id: "bullet",
    label: "Bullet",
    code: `<Bullet
  title="Progress to target"
  value={72}
  target={80}
  bands={[50, 90]}
/>`,
    node: (drawn) => (
      <Bullet
        key={String(drawn)}
        title="Progress to target"
        value={72}
        target={80}
        bands={[50, 90]}
        width={150}
        height={20}
        animate={drawn}
      />
    ),
  },
  {
    id: "bump",
    label: "Bump",
    code: `<BumpStrip
  title="Category rank"
  data={[5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1]}
/>`,
    node: (drawn) => (
      <BumpStrip
        key={String(drawn)}
        title="Category rank"
        data={RANKS}
        width={150}
        height={26}
        animate={drawn}
      />
    ),
  },
  {
    id: "segmented",
    label: "SegmentedBar",
    code: `<SegmentedBar
  title="Browser share"
  data={[
    { label: "Chrome", value: 620 },
    { label: "Safari", value: 240 },
    { label: "Firefox", value: 90 },
    { label: "Edge", value: 30 },
  ]}
/>`,
    node: (drawn) => (
      <SegmentedBar
        key={String(drawn)}
        title="Browser share"
        data={MIX}
        width={150}
        height={14}
        animate={drawn}
      />
    ),
  },
  {
    id: "annotations",
    label: "+ Annotations",
    code: `<Sparkline title="p95 latency (ms)" data={p95}>
  <Threshold y={200} label="SLO" />
  <Marker x={4} label="deploy" celebrate />
</Sparkline>`,
    node: (drawn) => (
      <Sparkline
        key={String(drawn)}
        title="p95 latency (ms)"
        data={LATENCY}
        width={150}
        height={36}
        animate={drawn}
      >
        <Threshold y={200} label="SLO" />
        <Marker x={4} label="deploy" celebrate />
      </Sparkline>
    ),
  },
];

/** Tiny JSX lexer — enough color for these snippets, zero deps. */
interface Tok {
  text: string;
  cls?: string;
}
const TOK_RE = /(<\/?[A-Z]\w*|\/>|>|[A-Za-z][\w-]*|"[^"]*"|\s+|.)/g;

function lex(code: string): Tok[] {
  const out: Tok[] = [];
  for (const m of code.matchAll(TOK_RE)) {
    const t = m[0];
    let cls: string | undefined;
    if (/^<\/?[A-Z]/.test(t) || t === "/>" || t === ">") cls = "hv-tok-tag";
    else if (/^[A-Za-z]/.test(t) && code[(m.index ?? 0) + t.length] === "=") cls = "hv-tok-attr";
    else if (t.startsWith('"')) cls = "hv-tok-str";
    // merge single default chars so we don't emit a span per character
    if (!cls && out.length && !out[out.length - 1].cls) {
      out[out.length - 1] = { text: out[out.length - 1].text + t };
      continue;
    }
    out.push(cls ? { text: t, cls } : { text: t });
  }
  return out;
}

const TAB_TOKENS = TABS.map((t) => lex(t.code));

/** Render the first `n` characters of a token stream, colors intact. */
function TypedCode({ tokens, n }: { tokens: Tok[]; n: number }) {
  const out: React.ReactNode[] = [];
  let used = 0;
  for (let i = 0; i < tokens.length && used < n; i++) {
    const t = tokens[i];
    const take = Math.min(t.text.length, n - used);
    const text = take === t.text.length ? t.text : t.text.slice(0, take);
    out.push(
      t.cls ? (
        <span key={i} className={t.cls}>
          {text}
        </span>
      ) : (
        text
      ),
    );
    used += take;
  }
  return <>{out}</>;
}

export function GrammarDemo() {
  const [tab, setTab] = useState(0);
  const [chars, setChars] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [started, setStarted] = useState(false);
  const [sentence, setSentence] = useState("");
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const active = TABS[tab];
  const done = reduced || chars >= active.code.length;

  // Start typing on viewport entry; reduced motion shows everything settled.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  // ~10 ms/char typewriter.
  useEffect(() => {
    if (!started || reduced || chars >= active.code.length) return;
    const t = window.setTimeout(() => setChars((c) => c + 1), 10);
    return () => window.clearTimeout(t);
  }, [started, reduced, chars, active.code.length]);

  // The sentence is the real thing: read the generated accessible name off the
  // mounted chart's DOM node once it has drawn.
  useEffect(() => {
    if (!done) return;
    const el = chartRef.current?.querySelector('[role="img"]');
    setSentence(el?.getAttribute("aria-label") ?? "");
  }, [done, tab]);

  const pick = (i: number) => {
    if (i === tab) return;
    setTab(i);
    setSentence("");
    setChars(0);
  };

  return (
    <div ref={hostRef} className="panel overflow-hidden">
      <div
        role="tablist"
        aria-label="Chart grammar examples"
        className="flex flex-wrap gap-1 border-b border-hairline px-3 py-2"
      >
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={i === tab}
            onClick={() => pick(i)}
            className={`seg-opt rounded-[10px] px-3 py-1.5 font-mono text-[0.72rem] tracking-wide transition-colors ${
              i === tab
                ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-hairline"
                : "text-fd-muted-foreground hover:text-fd-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-hairline p-5 sm:border-b-0 sm:border-r">
          <p className="mono-label mb-3 opacity-60">a model writes</p>
          {/* aria-hidden: a screen reader gets the finished code once, not a
              character churn — the sr-only twin below is the alternative. */}
          <pre
            aria-hidden
            className="min-h-[14rem] whitespace-pre-wrap font-mono text-[0.8rem] leading-relaxed text-fd-foreground"
          >
            <TypedCode tokens={TAB_TOKENS[tab]} n={reduced ? active.code.length : chars} />
            {!done && started && <span className="hv-code-caret" />}
          </pre>
          <pre className="sr-only">{active.code}</pre>
        </div>
        <div className="flex flex-col p-5">
          <p className="mono-label mb-3 opacity-60">a person gets</p>
          <div
            ref={chartRef}
            className="flex min-h-[6rem] flex-1 items-center justify-center [&_svg]:max-w-full"
          >
            {done && <span className="hx-morph-in">{active.node(!reduced)}</span>}
          </div>
        </div>
      </div>

      {/* stacked, not side-by-side: the sentence wraps to two lines on most
          tabs, and a tall paragraph beside a small chip reads broken */}
      <div className="border-t border-hairline px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="mono-label rounded-md bg-fd-primary/10 px-1.5 py-1 leading-none text-fd-primary">
            role=&quot;img&quot;
          </span>
          <span className="mono-label opacity-60">
            the generated accessible name, read live from the DOM
          </span>
        </div>
        <p
          aria-live="polite"
          className="hv-serif mt-2 min-h-[3.1rem] text-[0.98rem] leading-relaxed text-fd-foreground"
        >
          {sentence ? `“${sentence}”` : ""}
        </p>
      </div>
    </div>
  );
}
