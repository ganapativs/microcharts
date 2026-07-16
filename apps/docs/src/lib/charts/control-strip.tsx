import { ControlStrip } from "@microcharts/react/control-strip";
import { ControlStrip as ControlStripInteractive } from "@microcharts/react/control-strip/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// 30 fill-weight readings (g); mostly in control, two excursions
export const DEMO = [
  74, 73, 75, 74, 76, 73, 74, 75, 74, 73, 82, 74, 75, 73, 74, 76, 74, 73, 75, 74, 66, 74, 75, 74,
  73, 76, 74, 75, 74, 73,
];

export const entry: ChartEntry = {
  name: "ControlStrip",
  slug: "control-strip",
  status: "stable",
  collection: "decision",
  tagline: "Is the process in control, or did something leave the band?",
  staticImport: `${PKG}/control-strip`,
  interactiveImport: `${PKG}/control-strip/interactive`,
  dataShape: "number[], sequential process measurements",
  encoding: {
    channel: "point position vs the ±3σ̂ control band",
    precision: "high — the σ̂ estimator is the moving-range one, stated",
  },
  nodeBudget: "≤ 6 + 1 per violation",
  bestFor: [
    "a production line / metric in a table cell",
    "an SPC control chart in a KPI card",
    "flagging out-of-control excursions at a glance",
  ],
  avoidFor: ["a plain trend (Sparkline)", "a strongly trending series (ChangePoint)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Sequential measurements.",
    },
    {
      name: "limits",
      type: '"sigma" | "percentile"',
      required: false,
      description: "±3σ̂ (default) or empirical p0.135/p99.865 for skewed processes.",
    },
    {
      name: "baseline",
      type: "number",
      required: false,
      description: "Known process center from a reference period (else = mean).",
    },
    {
      name: "rules",
      type: '"none" | "we"',
      required: false,
      description: "Western Electric secondary run rules (WE-1/2/4 subset).",
    },
    {
      name: "dots",
      type: '"out" | "all"',
      required: false,
      description: "Mark only out-of-control points (default) or every point.",
    },
  ],
  demo: DEMO,
  example: {
    title: "Line 3 fill weight",
    code: `import { ControlStrip } from "${PKG}/control-strip";\n\n<ControlStrip data={weights} title="Line 3 fill weight" />`,
  },
  sampleData: [
    {
      name: "weights",
      code: `// 30 fill-weight readings (g); mostly in control, two excursions\nconst weights = [${DEMO.join(", ")}];`,
    },
  ],
};

export function Preview() {
  return <ControlStrip data={DEMO} summary={false} width={150} height={22} />;
}

export const showcase = {
  hint: "in / out of control",
  Node: () => <ControlStrip data={DEMO} title="Line 3 fill weight" width={150} height={22} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "limits",
      label: "limits",
      options: ["sigma", "percentile"],
      init: "sigma",
    },
    { kind: "toggle", key: "rules", label: "WE rules", init: false },
    { kind: "toggle", key: "dots", label: "all dots", init: false },
  ],
  render: (s) => (
    <ControlStrip
      data={DEMO}
      limits={s.limits as "sigma" | "percentile"}
      rules={s.rules ? "we" : "none"}
      dots={s.dots ? "all" : "out"}
      summary={false}
      width={280}
      height={26}
    />
  ),
  code: (s) =>
    [
      "<ControlStrip",
      "  data={weights}",
      s.limits !== "sigma" && `  limits="${s.limits}"`,
      s.rules && '  rules="we"',
      s.dots && '  dots="all"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ControlStripInteractive
      data={DEMO}
      limits={s.limits as "sigma" | "percentile"}
      rules={s.rules ? "we" : "none"}
      dots={s.dots ? "all" : "out"}
      summary={false}
      animate={ui.animate}
      width={280}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ControlStrip",
      "  data={weights}",
      s.limits !== "sigma" && `  limits="${s.limits}"`,
      s.rules && '  rules="we"',
      s.dots && '  dots="all"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the points — out-of-control points announce which limit they crossed.",
};

export const recipes: Recipe[] = [
  {
    label: "Western Electric run rules",
    code: `<ControlStrip data={weights} rules="we" />`,
    node: <ControlStrip data={DEMO} rules="we" summary={false} width={170} height={22} />,
  },
  {
    label: "known baseline (golden period)",
    code: `<ControlStrip data={weights} baseline={74} />`,
    node: <ControlStrip data={DEMO} baseline={74} summary={false} width={170} height={22} />,
  },
];

const CTX_ROWS = [
  { name: "Line 1", meta: "in spec", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
  { name: "Line 2", meta: "in spec", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
  { name: "Line 3", meta: "1 excursion", data: [0.82, 0.85, 0.87, 0.9, 0.92, 0.95, 0.97, 1.0] },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Line 3 fill weight{" "}
        <span className="mc-inline">
          <ControlStrip data={DEMO} height={16} summary={false} />
        </span>{" "}
        — in control except one excursion at t=18.
      </p>
    ),
    code: "<p>\n  Line 3 fill weight <ControlStrip data={weights} /> — in control except one excursion at t=18.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <ControlStrip data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <ControlStrip data={weights} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Fill weight</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">74g</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">in control</span>
          </div>
        </div>
        <ControlStrip data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">74g</span>\n  <span className="unit">in control</span>\n  <ControlStrip data={weights} />\n</div>',
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
            <ControlStrip data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Line 1 <ControlStrip data={weights} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const norm = (props.data.length ? props.data : DEMO).map(
    (v, i) => 74 + (Math.abs(v) % 5) - 2 + (i === 3 ? 8 : 0),
  );
  return (
    <ControlStrip
      data={norm}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<ControlStrip data={weights} />`;
}

export function PreviewLive() {
  return <ControlStripInteractive data={DEMO} summary={false} width={150} height={22} animate />;
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
