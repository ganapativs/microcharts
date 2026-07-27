"use client";
import { useId, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { MicroBox } from "@microcharts/react/micro-box/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { HeatStrip } from "@microcharts/react/heat-strip/interactive";
import { CodeTokens } from "@/components/code-tokens";
import { FENCE_SERIES } from "./v3-data";

/**
 * One array, five types. `domain` is shared grammar: it means the same thing on
 * every chart in the catalog, so one toggle re-scales five different encodings at
 * once and each stays correct.
 *
 * These are the real interactive entries at their real sizes — the row IS the
 * claim, so a stand-in would make it a drawing of the claim.
 *
 * The block opens by declaring `weeks`, printing the actual numbers the five
 * marks are drawn from. An earlier pass jumped straight to `data={weeks}` on
 * every row, and `weeks` was a variable the reader had never been shown — the
 * snippet looked like a fragment lifted out of a file rather than something you
 * could read top to bottom. Declaring it once also makes the point the section is
 * making: one array, five encodings, no reshaping in between.
 */

const DATA = [...FENCE_SERIES];
const FIXED: [number, number] = [0, 200];
const W = 168;
const H = 26;

const DECL = `const weeks = [${FENCE_SERIES.join(", ")}]`;

type Row = { name: string; render: (domain?: [number, number]) => React.ReactNode };

const ROWS: Row[] = [
  {
    name: "Sparkline",
    render: (domain) => (
      <Sparkline
        curve="smooth"
        data={DATA}
        domain={domain}
        width={W}
        height={H}
        title="Weekly bookings"
      />
    ),
  },
  {
    name: "SparkBar",
    render: (domain) => (
      <SparkBar data={DATA} domain={domain} width={W} height={H} title="Weekly bookings" />
    ),
  },
  {
    name: "HeatStrip",
    render: (domain) => (
      <HeatStrip data={DATA} domain={domain} width={W} height={H} title="Bookings by week" />
    ),
  },
  {
    name: "RugStrip",
    render: (domain) => (
      <RugStrip data={DATA} domain={domain} width={W} height={H} title="Every booking week" />
    ),
  },
  {
    name: "MicroBox",
    render: (domain) => (
      <MicroBox data={DATA} domain={domain} width={W} height={H} title="Bookings spread" />
    ),
  },
];

export function GrammarRows() {
  const [fixed, setFixed] = useState(false);
  const groupId = useId();
  const domain = fixed ? FIXED : undefined;

  return (
    <div className="mt-11 max-w-[46rem] sm:mt-16">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <span className="kicker" id={groupId}>
          one array, five types
        </span>
        {/* Two states of one prop, as the prop itself — the label is the code the
            reader would write, so the control teaches the API by being it. */}
        <div role="group" aria-labelledby={groupId} className="flex items-baseline gap-4">
          {[
            { on: !fixed, label: "auto", set: () => setFixed(false) },
            { on: fixed, label: "domain={[0, 200]}", set: () => setFixed(true) },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={o.set}
              aria-pressed={o.on}
              className="relative pb-1.5 font-mono text-[12px] leading-none tracking-[-0.03em] transition-colors hover:text-[var(--ink)]"
              style={{ color: o.on ? "var(--ink)" : "var(--ink-3)" }}
            >
              {o.label}
              {o.on && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[1.5px]"
                  style={{ background: "var(--mc-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <pre
        className="code mt-4 overflow-x-auto whitespace-pre px-4 py-3 text-[12px] leading-[1.6]"
        style={{ borderRadius: "12px 12px 0 0" }}
      >
        <CodeTokens code={DECL} />
      </pre>

      <div className="code" style={{ borderTop: 0, borderRadius: "0 0 12px 12px" }}>
        {ROWS.map((row, i) => (
          <div
            key={row.name}
            className="grid items-center gap-x-7 gap-y-3 px-4 py-3.5 [grid-template-columns:minmax(0,1fr)] sm:[grid-template-columns:minmax(0,1fr)_184px]"
            style={{
              borderTop: i === 0 ? "1px solid var(--rule)" : 0,
              borderBottom: i === ROWS.length - 1 ? 0 : "1px solid var(--rule)",
            }}
          >
            <code className="text-[12.5px] leading-[1.5] [overflow-wrap:anywhere]">
              <CodeTokens
                code={`<${row.name} data={weeks}${fixed ? " domain={[0, 200]}" : ""} />`}
              />
            </code>
            <div className="sm:justify-self-end">{row.render(domain)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
