import { Delta } from "@microcharts/react/delta";
import type { ComponentType, ReactNode } from "react";
import type { ChartEntry, ChartContexts } from "./types";

export interface MarkContextSpec {
  sentenceLead: string;
  sentenceTail: ReactNode;
  kpiLabel: string;
  kpiValue: string;
  kpiUnit: string;
  rows: { name: string; data: number[]; meta: ReactNode }[];
  tabs: { name: string; data: number[] }[];
}

/** Derive four-home copy from registry metadata — better than generic signup prose. */
export function inferMarkContextSpec(entry: ChartEntry): MarkContextSpec {
  const title = entry.example.title;
  const use = entry.bestFor[0] ?? title.toLowerCase();
  const last = [...entry.demo].reverse().find((n) => Number.isFinite(n));
  const figure =
    last == null
      ? "—"
      : Math.abs(last) < 1 && last !== 0
        ? last.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : last.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const series = entry.demo.length >= 4 ? entry.demo : [3, 5, 4, 8, 6, 9, 7, 11, 10, 14];
  const alt = [...series].reverse();
  const mid = series.map((v, i) => Math.round(v * (0.92 + (i % 3) * 0.03)));

  return {
    sentenceLead: `${title} this period`,
    sentenceTail: (
      <>
        — {use}, closing at <span className="font-mono tabular-nums">{figure}</span>.
      </>
    ),
    kpiLabel: title,
    kpiValue: figure,
    kpiUnit: use,
    rows: [
      { name: "Primary", data: series, meta: figure },
      { name: "Compare", data: alt, meta: <Delta value={0.08} summary={false} /> },
      { name: "Baseline", data: mid, meta: <Delta value={-0.03} summary={false} /> },
    ],
    tabs: [
      { name: title, data: series },
      { name: "Compare", data: alt },
      { name: "Baseline", data: mid },
    ],
  };
}

/** Resolve mark input: short demo arrays are summary quotes, not mark series. */
export function markInput(entry: ChartEntry): number[] {
  if (entry.demo.length >= 6) return entry.demo;
  // Short arrays are summary quotes — Marks fall back to their canonical series.
  return [];
}

export function buildMarkContexts(
  Mark: ComponentType<{ data: number[]; width?: number; height?: number }>,
  markCode: (width?: number, height?: number) => string,
  spec: MarkContextSpec,
  data: number[],
): ChartContexts {
  const cellData = (row: { data: number[] }) => (row.data.length >= 4 ? row.data : data);

  return {
    sentence: {
      render: () => (
        <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
          {spec.sentenceLead}{" "}
          <span className="mc-inline">
            <Mark data={data} width={90} height={16} />
          </span>{" "}
          {spec.sentenceTail}
        </p>
      ),
      code: `<p>\n  ${spec.sentenceLead}{" "}\n  ${markCode(90, 16)}\n  — closing at ${spec.kpiValue}.\n</p>`,
    },
    cell: {
      render: () => (
        <table className="mc-inline-table w-full text-sm tabular-nums">
          <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
            {spec.rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1.5 pr-3 text-fd-muted-foreground">{row.name}</td>
                <td className="py-1.5">
                  <Mark data={cellData(row)} width={72} height={16} />
                </td>
                <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
      code: `<td>\n  ${markCode(72, 16)}\n</td>`,
    },
    kpi: {
      render: () => (
        <>
          <div>
            <div className="text-fd-muted-foreground text-xs">{spec.kpiLabel}</div>
            <div className="flex items-end gap-2">
              <span className="display text-3xl tabular-nums">{spec.kpiValue}</span>
              <span className="mb-1">
                <Delta value={0.124} summary={false} />
              </span>
            </div>
          </div>
          <Mark data={data} width={200} height={36} />
        </>
      ),
      code: `<div className="kpi">\n  <span className="figure">${spec.kpiValue}</span>\n  <Delta value={0.124} />\n  ${markCode(200, 36)}\n</div>`,
    },
    tab: {
      render: () => (
        <div className="flex flex-wrap gap-1.5">
          {spec.tabs.map((tab, i) => (
            <span
              key={tab.name}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
                i === 0
                  ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                  : "border-fd-border text-fd-muted-foreground"
              }`}
            >
              {tab.name}
              <Mark data={cellData(tab)} width={44} height={14} />
            </span>
          ))}
        </div>
      ),
      code: `<button className="tab">\n  ${spec.tabs[0]?.name ?? "Tab"} ${markCode(44, 14)}\n</button>`,
    },
  };
}
