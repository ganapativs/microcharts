"use client";
import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { cn } from "@/lib/cn";

/**
 * The grammar explorer — the interactive heart of the AI-native guide. Pick a
 * chart type and a form (fenced block vs inline span) and see, in lockstep: the
 * exact text a model emits, that text rendered as the real shipped chart, and
 * the equivalent React. It's a live proof the plain-text grammar round-trips to
 * the same component a human would write by hand.
 */

type Mode = "fenced" | "inline";

interface Spec {
  type: string;
  label: string;
  body: string;
  sentence: string;
  jsx: string;
  render: (mode: Mode) => ReactNode;
}

const SPECS: Spec[] = [
  {
    type: "sparkline",
    label: "Sparkline",
    body: "132 148 141 165 159 182 176 203",
    sentence: "Revenue climbed steadily {} through Q3.",
    jsx: `<Sparkline\n  data={[132, 148, 141, 165, 159, 182, 176, 203]}\n  title="Revenue"\n/>`,
    render: (m) =>
      m === "fenced" ? (
        <Sparkline
          data={[132, 148, 141, 165, 159, 182, 176, 203]}
          width={220}
          height={48}
          curve="smooth"
          dots="minmax"
          label="last"
          title="Revenue"
        />
      ) : (
        <Sparkline
          data={[132, 148, 141, 165, 159, 182, 176, 203]}
          width={52}
          height={15}
          curve="smooth"
          summary={false}
        />
      ),
  },
  {
    type: "sparkbar",
    label: "SparkBar",
    body: "6 9 5 11 7 12 8 10",
    sentence: "Shipping held steady {} all quarter.",
    jsx: `<SparkBar\n  data={[6, 9, 5, 11, 7, 12, 8, 10]}\n  title="Deploys per day"\n/>`,
    render: (m) =>
      m === "fenced" ? (
        <SparkBar
          data={[6, 9, 5, 11, 7, 12, 8, 10]}
          width={220}
          height={48}
          title="Deploys per day"
        />
      ) : (
        <SparkBar data={[6, 9, 5, 11, 7, 12, 8, 10]} width={46} height={15} summary={false} />
      ),
  },
  {
    type: "delta",
    label: "Delta",
    body: "+0.184",
    sentence: "Week over week that is {}, ahead of plan.",
    jsx: `<Delta value={0.184} title="Week over week" />`,
    render: (m) =>
      m === "fenced" ? (
        <span className="text-2xl">
          <Delta value={0.184} title="Week over week" />
        </span>
      ) : (
        <Delta value={0.184} summary={false} />
      ),
  },
  {
    type: "bullet",
    label: "Bullet",
    body: "value=72 target=80 bands=50,90",
    sentence: "We're at {} of the annual quota.",
    jsx: `<Bullet\n  value={72}\n  target={80}\n  bands={[50, 90]}\n  title="Quota attainment"\n/>`,
    render: (m) =>
      m === "fenced" ? (
        <Bullet
          value={72}
          target={80}
          bands={[50, 90]}
          width={220}
          height={26}
          title="Quota attainment"
        />
      ) : (
        <Bullet value={72} target={80} bands={[50, 90]} width={58} height={11} summary={false} />
      ),
  },
  {
    type: "activity",
    label: "ActivityGrid",
    body: "0 2 1 3 4 2 1 3 2 4 3 2",
    sentence: "Commit activity held steady {} across the team.",
    jsx: `<ActivityGrid\n  data={[0, 2, 1, 3, 4, 2, 1, 3, 2, 4, 3, 2]}\n  layout="strip"\n  title="Commit activity"\n/>`,
    render: (m) =>
      m === "fenced" ? (
        <ActivityGrid
          data={[0, 2, 1, 3, 4, 2, 1, 3, 2, 4, 3, 2]}
          layout="strip"
          cell={12}
          title="Commit activity"
        />
      ) : (
        <ActivityGrid
          data={[0, 2, 1, 3, 4, 2, 1, 3, 2, 4, 3, 2]}
          layout="strip"
          cell={6}
          summary={false}
        />
      ),
  },
];

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy"
      title="Copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1200);
        });
      }}
      className="ghost-ctrl size-7"
    >
      {done ? <Check className="size-3.5 text-fd-primary" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function GrammarExplorer() {
  const [type, setType] = useState(SPECS[0].type);
  const [mode, setMode] = useState<Mode>("fenced");
  const spec = SPECS.find((s) => s.type === type) ?? SPECS[0];

  const emitted =
    mode === "fenced"
      ? "```chart " + spec.type + "\n" + spec.body + "\n```"
      : "`chart " + spec.type + " " + spec.body + "`";

  const [before, after] = spec.sentence.split("{}");

  return (
    <div className="not-prose my-6 panel overflow-hidden">
      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {SPECS.map((s) => (
            <button
              key={s.type}
              type="button"
              data-active={s.type === type}
              onClick={() => setType(s.type)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.78rem] transition-colors",
                s.type === type
                  ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
                  : "border-hairline text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="Chart form" className="seg">
          {(["fenced", "inline"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              data-active={mode === m}
              type="button"
              onClick={() => setMode(m)}
              className="seg-opt uppercase"
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-px bg-hairline sm:grid-cols-2">
        {/* the model emits */}
        <div className="flex flex-col bg-fd-background">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="mono-label">the model emits</span>
            <CopyButton text={emitted} />
          </div>
          <div className="code-inset flex-1 px-4 py-3">
            <pre className="overflow-x-auto whitespace-pre font-mono text-[0.8rem] leading-relaxed text-fd-muted-foreground">
              {emitted}
            </pre>
          </div>
        </div>

        {/* renders as */}
        <div className="flex flex-col bg-fd-background">
          <div className="px-4 py-2">
            <span className="mono-label">renders as</span>
          </div>
          <div className="grid-paper flex flex-1 items-center justify-center px-4 py-6">
            {mode === "fenced" ? (
              spec.render("fenced")
            ) : (
              <p className="max-w-xs text-[0.95rem] leading-relaxed text-fd-foreground">
                {before}
                <span className="mx-1 inline-flex align-middle">{spec.render("inline")}</span>
                {after}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* the react equivalent */}
      <div className="border-t border-hairline">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="mono-label">the same thing in react</span>
          <CopyButton text={spec.jsx} />
        </div>
        <div className="code-inset px-4 py-3">
          <pre className="overflow-x-auto whitespace-pre font-mono text-[0.8rem] leading-relaxed text-fd-muted-foreground">
            {spec.jsx}
          </pre>
        </div>
      </div>
    </div>
  );
}
