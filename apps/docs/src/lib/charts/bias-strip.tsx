import { BiasStrip } from "@microcharts/react/bias-strip";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";
import { biasPairsFromDrift } from "./contexts-helpers";

const PKG = "@microcharts/react";

// a ~+2 bias with noise and two pairs beyond the limits of agreement
const DIFFS = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
];
export const PAIRS = DIFFS.map((d, i) => ({ a: i + d, b: i }));

export const entry: ChartEntry = {
  name: "BiasStrip",
  slug: "bias-strip",
  status: "stable",
  collection: "frontier",
  tagline: "Do two ways of measuring the same thing systematically disagree?",
  staticImport: `${PKG}/bias-strip`,
  interactiveImport: `${PKG}/bias-strip/interactive`,
  dataShape: "{ a, b }[] (paired measurements)",
  encoding: { channel: "vertical position of the paired difference", precision: "high" },
  nodeBudget: "1 per pair (≤ 40) + band + 2 lines",
  maxWidth: 230,
  maxHeight: 120,
  gotchas: [
    "`format` merges with this chart's own formatting defaults instead of replacing them, so changing notation or precision keeps the unit. An explicit `style` replaces the whole set, digit defaults included.",
  ],
  bestFor: ["method-agreement checks in a cell", "instrument drift in a KPI card"],
  avoidFor: ["unpaired samples (MicroScatter)", "a single time series (Sparkline)"],
  props: [
    { name: "data", type: "{ a; b }[]", required: true, description: "Paired measurements." },
    {
      name: "limits",
      type: "number",
      required: false,
      description: "k in bias ± k·σ (default 1.96 ≈ 95% limits of agreement).",
    },
    {
      name: "label",
      type: '"bias" | "none"',
      required: false,
      description: "Seat-gated bias caption (default) or hidden.",
    },
    { name: "r", type: "number", required: false, description: "Base dot radius, clamped [1, 3]." },
  ],
  demo: DIFFS,
  example: {
    title: "Device vs reference",
    code: `import { BiasStrip } from "${PKG}/bias-strip";\n\n<BiasStrip data={pairs} title="Device vs reference" />`,
  },
  sampleData: [
    {
      name: "pairs",
      code: `// a ~+2 bias with noise and two pairs beyond the limits of agreement
const pairs = [
  1.8, 2.4, 1.5, 2.9, 2.1, 1.2, 2.6, 3.0, 1.9, 2.3, 6.5, 2.0, 1.7, 2.8, 2.2, -1.5, 2.5, 1.6, 2.7,
  2.0,
].map((d, i) => ({ a: i + d, b: i }));`,
    },
  ],
};

export function Preview() {
  return <BiasStrip data={PAIRS} summary={false} width={120} height={64} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "wide", label: "99% limits", init: false },
    { kind: "toggle", key: "caption", label: "bias caption", init: true },
    { kind: "range", key: "r", label: "dot radius", min: 1, max: 3, step: 0.5, init: 1.5 },
  ],
  render: (s) => (
    <BiasStrip
      data={PAIRS}
      limits={(s.wide as boolean) ? 2.58 : 1.96}
      label={(s.caption as boolean) ? "bias" : "none"}
      r={s.r as number}
      summary={false}
      width={220}
      height={120}
    />
  ),
  code: (s) =>
    [
      "<BiasStrip",
      "  data={pairs}",
      (s.wide as boolean) && "  limits={2.58}",
      !(s.caption as boolean) && '  label="none"',
      s.r !== 1.5 && `  r={${s.r}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover the nearest pair or step by mean with ←/→ — each announces its mean, difference, and whether it clears the limits.",
};

export const recipes: Recipe[] = [
  {
    label: "in a sentence",
    code: `device and reference <BiasStrip data={pairs}\n  style={{ width: "3em", height: "1.6em" }} /> agree, +2 bias`,
    node: (
      <span>
        device and reference{" "}
        <BiasStrip data={PAIRS} summary={false} style={{ width: "3em", height: "1.6em" }} /> agree,
        +2 bias
      </span>
    ),
  },
  {
    label: "99% limits of agreement",
    code: `<BiasStrip data={pairs} limits={2.58} />`,
    node: <BiasStrip data={PAIRS} limits={2.58} summary={false} width={120} height={64} />,
  },
];

const CTX_ROWS = [
  { name: "Sensor A", meta: "in spec", data: biasPairsFromDrift(0.2) },
  { name: "Sensor B", meta: "drift +2", data: biasPairsFromDrift(2.0) },
  { name: "Sensor C", meta: "in spec", data: biasPairsFromDrift(0.1) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Device vs reference{" "}
        <span className="mc-inline">
          <BiasStrip data={PAIRS} summary={false} width={90} height={24} />
        </span>{" "}
        — +2 bias, 18 of 20 pairs within limits.
      </p>
    ),
    code: '<p>\n  Device vs reference{" "}\n  <span className="mc-inline">\n    <BiasStrip data={pairs} width={90} height={24} summary={false} />\n  </span>{" "}\n  — +2 bias, 18 of 20 within limits.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{row.name}</td>
              <td className="py-1.5">
                <BiasStrip data={row.data} summary={false} width={72} height={28} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <BiasStrip data={pairs} width={72} height={28} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Method agreement</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">+2.0</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">mean bias · 95% LoA</span>
          </div>
        </div>
        <BiasStrip data={CTX_ROWS[0]!.data} limits={2.58} summary={false} width={200} height={48} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">+2.0</span>\n  <BiasStrip data={pairs} limits={2.58} width={200} height={48} />\n</div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {CTX_ROWS.map((row, i) => (
          <span
            key={row.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {row.name}
            <BiasStrip data={row.data} label="none" summary={false} width={44} height={22} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Sensor A <BiasStrip data={pairs} label="none" width={44} height={22} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const raw = props.data.length ? props.data : DIFFS;
  return (
    <BiasStrip
      data={raw.map((d, i) => ({ a: i + d, b: i }))}
      summary={false}
      width={props.width ?? 56}
      height={props.height ?? 30}
    />
  );
}

export function markCode(): string {
  return `<BiasStrip data={pairs} />`;
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
