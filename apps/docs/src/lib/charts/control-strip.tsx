import { ControlStrip } from "@microcharts/react/control-strip";
import { InteractiveDemo } from "./control-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
  tagline: "Is the process in control — or did something leave the band?",
  staticImport: `${PKG}/control-strip`,
  interactiveImport: `${PKG}/control-strip/interactive`,
  dataShape: "number[] — sequential process measurements",
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
    code: `import { ControlStrip } from "${PKG}/control-strip";\n\n// 30 fill-weight readings (g); mostly in control, two excursions\nconst weights = [${DEMO.join(", ")}];\n\n<ControlStrip data={weights} title="Line 3 fill weight" />`,
  },
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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const norm = props.data.map((v, i) => 74 + (Math.abs(v) % 5) - 2 + (i === 3 ? 8 : 0));
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

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
