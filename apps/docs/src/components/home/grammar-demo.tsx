"use client";
import "@microcharts/react/motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { SegmentedBar } from "@microcharts/react/segmented-bar/interactive";
import { BumpStrip } from "@microcharts/react/bump-strip/interactive";
import { Threshold, Marker } from "@microcharts/react/annotations";
import { CodeTokens } from "@/components/code-tokens";

/**
 * 01 · The shared prop API, settled: the full JSX is readable at once, the real
 * component draws with the library's own entrance (viewport- and
 * reduced-motion-gated by the motion engine), and the sentence under it is
 * read back OUT OF THE DOM — the actual generated aria-label of the mounted
 * chart, never a hardcoded quote. Each tab's code string mirrors its rendered
 * element exactly. (A typewriter effect was shipped and cut: it made the
 * reader wait a second per tab to see what the code already said.)
 */

interface Tab {
  id: string;
  label: string;
  code: string;
  node: ReactNode;
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
    node: (
      <Sparkline
        title="Weekly revenue"
        data={REVENUE}
        curve="smooth"
        width={150}
        height={36}
        animate
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
    node: (
      <Bullet
        title="Progress to target"
        value={72}
        target={80}
        bands={[50, 90]}
        width={150}
        height={20}
        animate
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
    node: <BumpStrip title="Category rank" data={RANKS} width={150} height={26} animate />,
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
    node: <SegmentedBar title="Browser share" data={MIX} width={150} height={14} animate />,
  },
  {
    id: "annotations",
    label: "+ Annotations",
    code: `<Sparkline title="p95 latency (ms)" data={p95}>
  <Threshold y={200} label="SLO" />
  <Marker x={4} label="deploy" celebrate />
</Sparkline>`,
    node: (
      <Sparkline title="p95 latency (ms)" data={LATENCY} width={150} height={36} animate>
        <Threshold y={200} label="SLO" />
        <Marker x={4} label="deploy" celebrate />
      </Sparkline>
    ),
  },
];

export function GrammarDemo() {
  const [tab, setTab] = useState(0);
  const [sentence, setSentence] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  const active = TABS[tab];

  // The sentence is the real thing: read the generated accessible name off the
  // mounted chart's DOM node.
  useEffect(() => {
    const el = chartRef.current?.querySelector('[role="img"]');
    setSentence(el?.getAttribute("aria-label") ?? "");
  }, [tab]);

  return (
    <div className="panel-soft overflow-hidden">
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
            onClick={() => setTab(i)}
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
          {/* "an agent", not "a model": this panel is the React prop API — what
              a coding agent writes into a repo. The compact `microchart …`
              grammar a chat model emits mid-reply is a different thing, owned
              by the hero and by /docs/ai. Don't let the two labels converge. */}
          <p className="mono-label mb-3 opacity-60">an agent writes</p>
          <pre className="min-h-[14rem] whitespace-pre-wrap font-mono text-[0.8rem] leading-relaxed text-fd-foreground">
            <CodeTokens code={active.code} />
          </pre>
        </div>
        <div className="flex flex-col p-5">
          <p className="mono-label mb-3 opacity-60">a person gets</p>
          <div
            ref={chartRef}
            className="flex min-h-[6rem] flex-1 items-center justify-center [&_svg]:max-w-full"
          >
            {/* keyed so switching tabs replays the library entrance */}
            <span key={active.id}>{active.node}</span>
          </div>
        </div>
      </div>

      {/* Stacked: sentence wraps on narrow viewports. */}
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
