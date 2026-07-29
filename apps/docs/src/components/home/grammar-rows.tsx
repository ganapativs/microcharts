"use client";
import { useId, useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { MicroBox } from "@microcharts/react/micro-box/interactive";
import { RugStrip } from "@microcharts/react/rug-strip/interactive";
import { HeatStrip } from "@microcharts/react/heat-strip/interactive";
import { CodeTokens } from "@/components/code-tokens";
import { FENCE_SERIES } from "./home-data";

/**
 * One array, five types. `domain` is shared grammar — it means the same thing on
 * every chart in the catalog, so one toggle re-scales five encodings at once and
 * each stays correct.
 *
 * These are the real interactive entries at their real sizes. The block declares
 * `weeks` first, printing the numbers the five marks are drawn from, so the
 * snippet reads top to bottom and shows there is no reshaping in between.
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
    <div className="u-sub max-w-[46rem]">
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
              // `tap` takes the hit row to 44px without moving the label: these
              // are 12px words on an 18px box, and the underline that marks the
              // active one has to stay on the type's own baseline.
              className="tap pb-1.5 font-mono text-[12px] leading-none tracking-[-0.03em] transition-colors duration-200 ease-[var(--e)] hover:text-[var(--ink)]"
              style={{ color: o.on ? "var(--ink)" : "var(--ink-3)" }}
            >
              {o.label}
              {/* Mounted on both, always: rendered only under the active label
                  the rule appeared and vanished, so the mark teleported. */}
              <span aria-hidden className="toggle-rule" data-state={o.on ? "on" : "off"} />
            </button>
          ))}
        </div>
      </div>

      {/* `tabIndex` because it scrolls: a horizontally scrollable region a
          keyboard cannot reach is content a keyboard cannot read. */}
      <pre
        tabIndex={0}
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
