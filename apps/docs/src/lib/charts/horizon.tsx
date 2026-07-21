import { Horizon } from "@microcharts/react/horizon";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const LOAD = [
  2, 5, 9, 14, 22, 31, 26, 18, 12, 24, 38, 45, 41, 30, 19, 11, 6, 3, 8, 16, 27, 35, 29, 20,
];

export const entry: ChartEntry = {
  name: "Horizon",
  slug: "horizon",
  status: "stable",
  collection: "core",
  tagline: "A wide-range series folded into a slim, dense band.",
  staticImport: `${PKG}/horizon`,
  interactiveImport: `${PKG}/horizon/interactive`,
  dataShape: "(number | null)[] over time",
  encoding: {
    channel: "position + fold-layer opacity (darker = higher band)",
    precision: "low — a density read; Sparkline when exact shape matters",
  },
  nodeBudget: "≤ 6 (≤ 3 fold paths per direction)",
  bestFor: ["dense monitoring rows (dozens stacked)", "wide-range series in tight cells"],
  avoidFor: ["first-glance audiences (folding needs a key)", "few rows with room (Sparkline)"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "Series over time.",
    },
    {
      name: "folds",
      type: "2 | 3",
      required: false,
      description: "Band count — 3 only when the range genuinely spans it.",
    },
    {
      name: "mode",
      type: '"mirror" | "offset"',
      required: false,
      description: "Mirror flips negatives upward (denser); offset keeps up/down.",
    },
    {
      name: "baseline",
      type: "number",
      required: false,
      description: "Fold origin (e.g. a target level) — authored, never inferred.",
    },
  ],
  demo: LOAD,
  example: {
    title: "Cluster load",
    code: `import { Horizon } from "${PKG}/horizon";\n\n<Horizon data={cpuLoad} title="Cluster load" />`,
  },
  sampleData: [
    {
      name: "cpuLoad",
      code: `const cpuLoad = [
  2, 5, 9, 14, 22, 31, 26, 18, 12, 24, 38, 45, 41, 30, 19, 11, 6, 3, 8, 16, 27, 35, 29, 20,
];`,
    },
  ],
};

export function Preview() {
  return <Horizon data={LOAD} summary={false} width={130} height={16} />;
}
export const playground: PlaygroundSpec = {
  // `domain`, `color`, `format`/`locale` are universal chart props (covered on
  // every chart's common-props doc), not Horizon-specific — left out here so
  // the knobs stay scoped to what this page documents (folds/mode/baseline).
  knobs: [
    {
      kind: "segmented",
      key: "folds",
      label: "folds",
      options: ["2", "3"],
      init: "2",
    },
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["mirror", "offset"],
      init: "mirror",
    },
    { kind: "range", key: "baseline", label: "baseline", min: -20, max: 30, step: 5, init: 0 },
  ],
  render: (s) => (
    <Horizon
      data={LOAD.map((v, i) => v - 20 + (i % 3))}
      folds={Number(s.folds) as 2 | 3}
      mode={s.mode as "mirror" | "offset"}
      baseline={s.baseline as number}
      summary={false}
      width={260}
      height={24}
    />
  ),
  code: (s) =>
    [
      "<Horizon",
      "  data={cpuLoad}",
      s.folds !== "2" && `  folds={${s.folds}}`,
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      s.baseline !== 0 && `  baseline={${s.baseline}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Hover or arrow across — each point announces its unfolded value.",
};

export const recipes: Recipe[] = [
  {
    label: "monitoring rows",
    code: `{hosts.map((h) => (\n  <Horizon key={h.id} data={h.load} title={h.name} />\n))}`,
    node: <Horizon data={LOAD} summary={false} width={160} height={12} />,
  },
  {
    label: "fold around a target",
    code: `<Horizon data={cpuLoad} baseline={20} />`,
    node: <Horizon data={LOAD} baseline={20} summary={false} width={160} height={14} />,
  },
];

type Host = { name: string; load: number[] };
const HOSTS: Host[] = [
  { name: "web-01", load: LOAD },
  {
    name: "web-02",
    load: [
      10, 14, 12, 9, 8, 11, 15, 22, 28, 24, 18, 13, 10, 9, 12, 16, 19, 14, 11, 9, 8, 10, 13, 15,
    ],
  },
  {
    name: "web-03",
    load: [
      30, 33, 29, 26, 24, 27, 31, 35, 38, 34, 30, 28, 25, 27, 30, 33, 29, 26, 24, 27, 31, 35, 32,
      29,
    ],
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Cluster load this hour{" "}
        <span className="mc-inline">
          <Horizon data={LOAD} summary={false} width={64} height={14} />
        </span>{" "}
        — peaked near 45 before dropping under 10, now steady at 20.
      </p>
    ),
    code: `<p>\n  Cluster load this hour{" "}\n  <span className="mc-inline">\n    <Horizon data={cpuLoad} width={64} height={14} summary={false} />\n  </span>{" "}\n  — peaked near 45 before dropping under 10, now steady at 20.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {HOSTS.map((h) => (
            <tr key={h.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{h.name}</td>
              <td className="py-1.5">
                <Horizon data={h.load} summary={false} width={70} height={14} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {h.load[h.load.length - 1]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Horizon data={hosts[0].load} width={70} height={14} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Cluster peak load (24h)</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">45</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">now 20</span>
          </div>
        </div>
        <Horizon data={LOAD} summary={false} width={140} height={20} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">45</span>\n  <span className="unit">now 20</span>\n  <Horizon data={cpuLoad} width={140} height={20} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {[HOSTS[0]!, HOSTS[2]!].map((h, i) => (
          <span
            key={h.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {h.name}
            <Horizon data={h.load} summary={false} width={40} height={10} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  web-01 <Horizon data={hosts[0].load} width={40} height={10} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Horizon
      data={props.data}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<Horizon data={series} />`;
}
export default {
  entry,
  Preview,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
