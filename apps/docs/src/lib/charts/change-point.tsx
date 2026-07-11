import { ChangePoint } from "@microcharts/react/change-point";
import { ChangePoint as ChangePointInteractive } from "@microcharts/react/change-point/interactive";
import { InteractiveDemo } from "./change-point.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// error rate that stepped up on the 14th, then held — a clean level shift
export const ERRORS: number[] = [
  ...Array(14)
    .fill(0)
    .map((_, i) => 30 + ((i * 7) % 5) - 2),
  ...Array(20)
    .fill(0)
    .map((_, i) => 48 + ((i * 5) % 5) - 2),
];
const RAMP = Array.from({ length: 40 }, (_, i) => 20 + i * 1.2);

export const entry: ChartEntry = {
  name: "ChangePoint",
  slug: "change-point",
  status: "stable",
  collection: "decision",
  tagline: "When did the behavior change level?",
  staticImport: `${PKG}/change-point`,
  interactiveImport: `${PKG}/change-point/interactive`,
  dataShape: "number[]",
  encoding: { channel: "break marker position + regime shading", precision: "high" },
  nodeBudget: "≤ 6 + 3 per break",
  bestFor: [
    "context for an anomaly — a spike means nothing without the regime it broke",
    "error rate / latency / cost that stepped to a new level",
    "annotating a known deploy or incident (pass explicit `breaks`)",
  ],
  avoidFor: ["a gradual trend (Sparkline)", "a plain time series with no regime question"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "A single series.",
    },
    {
      name: "breaks",
      type: '"auto" | number[]',
      required: false,
      description: "Explicit indices override the heuristic entirely — the production path.",
    },
    {
      name: "max",
      type: "number",
      required: false,
      description: "Max detected breaks (1–3). More regimes stop being glanceable.",
    },
    {
      name: "means",
      type: "boolean",
      required: false,
      description: "Per-regime mean hairlines (default true).",
    },
    {
      name: "label",
      type: '"delta" | "none"',
      required: false,
      description: "Signed % across the most recent break, in a gutter.",
    },
  ],
  demo: ERRORS,
  example: {
    title: "Error rate",
    code: `import { ChangePoint } from "${PKG}/change-point";\n\n<ChangePoint data={errors} label="delta" title="Error rate" />`,
  },
  sampleData: [
    {
      name: "errors",
      code: `// error rate that stepped up on the 14th, then held — a clean level shift
const errors = [
  ...Array(14).fill(0).map((_, i) => 30 + ((i * 7) % 5) - 2),
  ...Array(20).fill(0).map((_, i) => 48 + ((i * 5) % 5) - 2),
];`,
    },
    {
      name: "ramp",
      code: `const ramp = Array.from({ length: 40 }, (_, i) => 20 + i * 1.2);`,
    },
  ],
};

export function Preview() {
  return <ChangePoint data={ERRORS} summary={false} width={120} height={16} />;
}

export const showcase = {
  hint: "a spike needs its regime",
  Node: () => (
    <ChangePoint data={ERRORS} label="delta" title="Error rate" width={160} height={22} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "preset", label: "series", options: ["step", "ramp"], init: "step" },
    { kind: "range", key: "max", label: "max", min: 1, max: 3, step: 1, init: 2 },
    { kind: "toggle", key: "means", label: "means", init: true },
    { kind: "toggle", key: "delta", label: "delta label", init: true },
  ],
  render: (s) => (
    <ChangePoint
      data={s.preset === "ramp" ? RAMP : ERRORS}
      max={s.max as number}
      means={s.means as boolean}
      label={s.delta ? "delta" : "none"}
      title="Error rate"
      summary={false}
      width={280}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<ChangePoint",
      "  data={errors}",
      s.max !== 2 && `  max={${s.max}}`,
      s.means === false && "  means={false}",
      s.delta && '  label="delta"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ChangePointInteractive
      data={s.preset === "ramp" ? RAMP : ERRORS}
      max={s.max as number}
      means={s.means as boolean}
      label={s.delta ? "delta" : "none"}
      title="Error rate"
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ChangePoint",
      "  data={errors}",
      s.max !== 2 && `  max={${s.max}}`,
      s.means === false && "  means={false}",
      s.delta && '  label="delta"',
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the points — each announces its value and regime; Tab jumps between the breaks, announcing the mean shift.",
};

export const recipes: Recipe[] = [
  {
    label: "annotate a known deploy (explicit break)",
    code: `<ChangePoint data={errors} breaks={[14]} />`,
    node: <ChangePoint data={ERRORS} breaks={[14]} summary={false} width={200} height={22} />,
  },
  {
    label: "a gradual ramp has no level shift",
    code: `<ChangePoint data={ramp} />`,
    node: <ChangePoint data={RAMP} summary={false} width={200} height={22} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = [
    ...props.data.slice(0, 8).map((v) => 20 + (Math.abs(v) % 6)),
    ...props.data.slice(8, 16).map((v) => 45 + (Math.abs(v) % 6)),
  ];
  return (
    <ChangePoint
      data={data.length ? data : ERRORS}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<ChangePoint data={errors} />`;
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
