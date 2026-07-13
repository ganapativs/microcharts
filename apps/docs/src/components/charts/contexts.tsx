"use client";
import { useState, type ReactNode } from "react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Delta } from "@microcharts/react/delta";
import { getModule } from "@/lib/charts/registry";
import type { ChartContexts, ChartModule } from "@/lib/charts/types";

const HOMES = [
  { key: "sentence", label: "In a sentence" },
  { key: "cell", label: "In a table cell" },
  { key: "kpi", label: "In a KPI card" },
  { key: "tab", label: "In a tab header" },
] as const;

/** Fallback when a chart hasn't authored `contexts` yet. */
function genericContexts(mod: ChartModule): ChartContexts {
  const { Mark } = mod;
  const data = mod.entry.demo;
  const last = [...data].reverse().find((n) => Number.isFinite(n)) ?? 0;
  return {
    sentence: {
      render: () => (
        <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
          Signups held steady{" "}
          <span className="mc-inline">
            <Mark data={data} />
          </span>{" "}
          through the quarter, closing at <span className="font-mono tabular-nums">{last}</span>.
        </p>
      ),
      code: `<p>\n  Signups held steady ${mod.markCode()} through the quarter.\n</p>`,
    },
    cell: {
      render: () => (
        <table className="w-full text-sm tabular-nums">
          <tbody>
            {[
              ["Acme", data],
              ["Globex", [...data].reverse()],
            ].map(([name, series]) => (
              <tr key={name as string} className="border-t border-fd-border/60 first:border-0">
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{name as string}</td>
                <td className="py-1.5">
                  <Mark data={series as number[]} width={72} height={16} />
                </td>
                <td className="py-1.5 pl-3 text-right">
                  <Delta value={0.08} summary={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
      code: `<td>${mod.markCode(72, 16)}</td>`,
    },
    kpi: {
      render: () => (
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
          <Mark data={data} width={200} height={36} />
        </>
      ),
      code: `<div className="kpi">\n  <span className="figure">14k</span>\n  <Delta value={0.124} />\n  ${mod.markCode(200, 36)}\n</div>`,
    },
    tab: {
      render: () => (
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
              <Mark data={series as number[]} width={44} height={14} />
            </span>
          ))}
        </div>
      ),
      code: `<button className="tab">\n  Revenue ${mod.markCode(44, 14)}\n</button>`,
    },
  };
}

/** Chart in four placements: sentence, cell, KPI, tab. */
export function FourContexts({ slug }: { slug: string }) {
  const mod = getModule(slug);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  if (!mod) return null;
  const ctx = mod.contexts ?? genericContexts(mod);

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HOMES.map(({ key, label }) => {
          const home = ctx[key];
          return (
            <div key={key} className="panel flex flex-col overflow-hidden">
              <div className="border-b border-hairline px-4 py-2">
                <span className="mono-label">{label}</span>
              </div>
              {tab === "code" ? (
                <div className="code-inset code-fill h-36 overflow-hidden">
                  <DynamicCodeBlock lang="tsx" code={home.code} />
                </div>
              ) : (
                <div className="flex min-h-36 flex-1 flex-col justify-center gap-2 p-4">
                  {home.render() as ReactNode}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
