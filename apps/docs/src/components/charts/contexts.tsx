"use client";
import { useState, type ReactNode } from "react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { getChart, type ChartEntry } from "@/lib/catalog";

/** A tiny chart sized for a given slug, reused across the four contexts. */
function Mark({
  chart,
  data,
  width,
  height,
}: {
  chart: ChartEntry;
  data: number[];
  width?: number;
  height?: number;
}) {
  const summary = false as const; // decorative here; the surrounding text explains it
  switch (chart.slug) {
    case "sparkline":
      return <Sparkline data={data} width={width ?? 64} height={height ?? 18} summary={summary} />;
    case "sparkbar":
      return <SparkBar data={data} width={width ?? 64} height={height ?? 18} summary={summary} />;
    case "delta":
      return <Delta value={0.124} summary={summary} />;
    case "bullet":
      return (
        <Bullet
          value={72}
          target={80}
          bands={[50, 90]}
          width={width ?? 90}
          height={height ?? 16}
          summary={summary}
        />
      );
    case "activity-grid":
      return <ActivityGrid data={data} layout="strip" cell={7} summary={summary} />;
    default:
      return null;
  }
}

/** The JSX string for a chart's mark at a given size — mirrors <Mark> so the
 *  Code tab shows exactly the tag the reader would write for each context. */
function markCode(chart: ChartEntry, width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  switch (chart.slug) {
    case "sparkline":
      return `<Sparkline data={data}${size} />`;
    case "sparkbar":
      return `<SparkBar data={data}${size} />`;
    case "delta":
      return `<Delta value={0.124} />`;
    case "bullet":
      return `<Bullet value={72} target={80} bands={[50, 90]}${size} />`;
    case "activity-grid":
      return `<ActivityGrid data={data} layout="strip" cell={7} />`;
    default:
      return "";
  }
}

/** Copy-ready snippet for each of the four placement contexts. */
function contextCode(chart: ChartEntry, kind: "sentence" | "cell" | "kpi" | "tab"): string {
  switch (kind) {
    case "sentence":
      return `<p>\n  Signups held steady ${markCode(chart)} through the quarter.\n</p>`;
    case "cell":
      return `<td>${markCode(chart, 72, 16)}</td>`;
    case "kpi":
      return `<div className="kpi">\n  <span className="figure">14k</span>\n  <Delta value={0.124} />\n  ${markCode(chart, 200, 36)}\n</div>`;
    case "tab":
      return `<button className="tab">\n  Revenue ${markCode(chart, 44, 14)}\n</button>`;
  }
}

const tag = "mono-label";
/** Preview body: same fixed min-height as the code well so the card box — and
 *  therefore the header + title — never shifts when toggling Preview↔Code. */
const previewBody = "flex min-h-36 flex-1 flex-col justify-center gap-2 p-4";

export function FourContexts({ slug }: { slug: string }) {
  const chart = getChart(slug);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  if (!chart) return null;
  const data = chart.demo;
  const last = [...data].reverse().find((n) => Number.isFinite(n)) ?? 0;

  const contexts: { label: string; code: string; preview: ReactNode }[] = [
    {
      label: "In a sentence",
      code: contextCode(chart, "sentence"),
      preview: (
        <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
          Signups held steady{" "}
          <span className="mx-1 inline-flex align-middle">
            <Mark chart={chart} data={data} />
          </span>{" "}
          through the quarter, closing at <span className="font-mono tabular-nums">{last}</span>.
        </p>
      ),
    },
    {
      label: "In a table cell",
      code: contextCode(chart, "cell"),
      preview: (
        <table className="w-full text-sm tabular-nums">
          <tbody>
            {[
              ["Acme", data],
              ["Globex", [...data].reverse()],
            ].map(([name, series]) => (
              <tr key={name as string} className="border-t border-fd-border/60 first:border-0">
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{name as string}</td>
                <td className="py-1.5">
                  <Mark chart={chart} data={series as number[]} width={72} height={16} />
                </td>
                <td className="py-1.5 pl-3 text-right">
                  <Delta value={0.08} summary={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      label: "In a KPI card",
      code: contextCode(chart, "kpi"),
      preview: (
        <>
          <div>
            <div className="text-fd-muted-foreground text-xs">Weekly active</div>
            <div className="flex items-end gap-2">
              <span className="display text-3xl tabular-nums">{last}k</span>
              <span className="mb-1">
                <Delta value={0.124} summary={false} />
              </span>
            </div>
          </div>
          <Mark chart={chart} data={data} width={200} height={36} />
        </>
      ),
    },
    {
      label: "In a tab header",
      code: contextCode(chart, "tab"),
      preview: (
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Revenue", data],
            ["Users", [...data].reverse()],
          ].map(([name, series], i) => (
            <span
              key={name as string}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                i === 0
                  ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                  : "border-fd-border text-fd-muted-foreground"
              }`}
            >
              {name as string}
              <Mark chart={chart} data={series as number[]} width={44} height={14} />
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="not-prose my-6">
      <div className="mb-3 flex justify-end">
        <div role="tablist" aria-label="Four homes view" className="seg">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              data-active={tab === t}
              type="button"
              onClick={() => setTab(t)}
              className="seg-opt uppercase"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* One card shell for both modes — identical header bar so the title never
          moves on toggle; only the body below it swaps. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {contexts.map((c) => (
          <div key={c.label} className="panel flex flex-col overflow-hidden">
            <div className="border-b border-fd-border px-4 py-2">
              <span className={tag}>{c.label}</span>
            </div>
            {tab === "code" ? (
              /* Fixed-height well + `code-fill` so the code block spans the card
                 and the horizontal scrollbar lands at the bottom of every card. */
              <div className="code-inset code-fill h-36 overflow-hidden">
                <DynamicCodeBlock lang="tsx" code={c.code} />
              </div>
            ) : (
              <div className={previewBody}>{c.preview}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
