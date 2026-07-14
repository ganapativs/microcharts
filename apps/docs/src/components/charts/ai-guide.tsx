"use client";
import { Fragment, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { cn } from "@/lib/cn";
import { GRAMMAR } from "@/lib/ai-grammar";
import { AGENT_RULES, MACHINE_SURFACES } from "@/lib/ai-providers";

/** Interactive grammar explorer — fenced/inline → live chart + React. */

type Mode = "fenced" | "inline";

/** The one place a grammar type turns into a live chart — both entries share it. */
function renderChart(type: string, mode: Mode): ReactNode {
  const fenced = mode === "fenced";
  switch (type) {
    case "sparkline":
      return fenced ? (
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
      );
    case "sparkbar":
      return fenced ? (
        <SparkBar
          data={[6, 9, 5, 11, 7, 12, 8, 10]}
          width={220}
          height={48}
          title="Deploys per day"
        />
      ) : (
        <SparkBar data={[6, 9, 5, 11, 7, 12, 8, 10]} width={46} height={15} summary={false} />
      );
    case "delta":
      return fenced ? (
        <span className="text-2xl">
          <Delta value={0.184} title="Week over week" />
        </span>
      ) : (
        <Delta value={0.184} summary={false} />
      );
    case "bullet":
      return fenced ? (
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
      );
    case "activity":
      return fenced ? (
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
      );
    default:
      return null;
  }
}

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
  const [type, setType] = useState(GRAMMAR[0].type);
  const [mode, setMode] = useState<Mode>("fenced");
  const spec = GRAMMAR.find((s) => s.type === type) ?? GRAMMAR[0];

  const emitted =
    mode === "fenced"
      ? "```chart " + spec.type + "\n" + spec.body + "\n```"
      : "`chart " + spec.type + " " + spec.body + "`";

  const [before, after] = spec.sentence.split("{}");

  return (
    <div className="not-prose my-6 panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {GRAMMAR.map((s) => (
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
        <div className="flex flex-col bg-fd-background">
          <div className="px-4 py-2">
            <span className="mono-label">renders as</span>
          </div>
          <div className="grid-paper flex flex-1 items-center justify-center px-4 py-6">
            {mode === "fenced" ? (
              renderChart(spec.type, "fenced")
            ) : (
              <p className="max-w-xs text-[0.95rem] leading-relaxed text-fd-foreground">
                {before}
                <span className="mc-inline">{renderChart(spec.type, "inline")}</span>
                {after}
              </p>
            )}
          </div>
        </div>
      </div>
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

// Inline `code` → <code> for the rules list. Split alternates plain / code text.
function InlineCode({ text }: { text: string }) {
  const nodes = text.split("`").flatMap((value, slot) => {
    if (!value) return [];
    return [{ kind: (slot % 2 ? "code" : "text") as "code" | "text", value }];
  });
  return (
    <>
      {nodes.map((n) =>
        n.kind === "code" ? (
          <code key={`code:${n.value}`} className="font-mono text-[0.85em] text-fd-primary">
            {n.value}
          </code>
        ) : (
          <span key={`text:${n.value}`}>{n.value}</span>
        ),
      )}
    </>
  );
}

/** A plain-text version of the whole contract — paste straight into a system prompt. */
function promptText(): string {
  const rows = GRAMMAR.map((g) => `  chart ${g.type}  ${g.body}   # ${g.blurb}`).join("\n");
  const rules = AGENT_RULES.map((r) => `- ${r.replace(/`/g, "")}`).join("\n");
  return [
    "microcharts — emit a chart block instead of describing numbers.",
    "Fenced ```chart <type> for a standalone chart; inline `chart <type> <data>` inside a sentence.",
    "Body: whitespace/comma numbers, or key=value for composites.",
    "",
    rows,
    "",
    "Rules:",
    rules,
    "",
    "API: /llms.txt · /catalog.json · append .md to any docs page.",
  ].join("\n");
}

/** Agent contract card — grammar, rules, surfaces; copyable as a system prompt. */
export function AgentCheatSheet() {
  return (
    <div className="not-prose my-6 panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="mono-label">agent cheat sheet</span>
        <span className="flex items-center gap-2">
          <span className="mono-label opacity-60">copy for a system prompt</span>
          <CopyButton text={promptText()} />
        </span>
      </div>

      <div className="border-b border-hairline px-4 py-3.5">
        <div className="mono-label mb-2.5 opacity-60">grammar</div>
        <div className="grid gap-x-4 gap-y-1 font-mono text-[0.8rem] leading-relaxed sm:grid-cols-[max-content_1fr]">
          {GRAMMAR.map((g) => (
            <Fragment key={g.type}>
              <span className="whitespace-nowrap text-fd-primary">chart {g.type}</span>
              <span className="text-fd-muted-foreground">
                {g.body} <span className="text-fd-muted-foreground/60">— {g.blurb}</span>
              </span>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="border-b border-hairline px-4 py-3.5">
        <div className="mono-label mb-2.5 opacity-60">rules</div>
        <ul className="flex flex-col gap-1.5 text-[0.85rem] leading-relaxed text-fd-muted-foreground">
          {AGENT_RULES.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-px shrink-0 text-fd-primary">→</span>
              <span>
                <InlineCode text={r} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-4 py-3.5">
        <div className="mono-label mb-2.5 opacity-60">surfaces</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[0.8rem]">
          {MACHINE_SURFACES.map((s) => (
            <a key={s.href} href={s.href} className="text-fd-primary link-underline">
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
