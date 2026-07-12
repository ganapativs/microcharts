import { StarSpoke } from "@microcharts/react/star-spoke";
import { StarSpoke as StarSpokeInteractive } from "@microcharts/react/star-spoke/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const PROFILE = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Range", value: 0.5 },
  { label: "Cost", value: 0.3 },
  { label: "Ease", value: 0.7 },
];

export const entry: ChartEntry = {
  name: "StarSpoke",
  slug: "star-spoke",
  status: "stable",
  collection: "frontier",
  tagline: "An entity's profile across a few metrics — and which one in a set is the odd one out.",
  staticImport: `${PKG}/star-spoke`,
  interactiveImport: `${PKG}/star-spoke/interactive`,
  dataShape: "{ label, value }[] (3–8 metrics)",
  encoding: { channel: "spoke length from center = value", precision: "medium" },
  nodeBudget: "≤ 4",
  bestFor: ["entity profiles in small multiples", "skill / capability comparison"],
  avoidFor: ["fewer than 3 metrics (PairedBars)", "precise values (MiniBar)"],
  props: [
    {
      name: "data",
      type: "{ label, value }[]",
      required: true,
      description: "3–8 metrics on a shared domain.",
    },
    {
      name: "dots",
      type: '"tips" | "none"',
      required: false,
      description: '`"tips"` draws endpoint dots to sharpen the outlier read.',
    },
    {
      name: "guides",
      type: "boolean",
      required: false,
      description: "Full-length guide spokes (read-back scaffold).",
    },
    {
      name: "compare",
      type: "number[]",
      required: false,
      description: "Muted ghost baseline spokes.",
    },
  ],
  demo: [90, 60, 50, 30, 70],
  example: {
    title: "Product profile",
    code: `import { StarSpoke } from "${PKG}/star-spoke";\n\n<StarSpoke data={metrics} title="Product profile" />`,
  },
  sampleData: [
    {
      name: "metrics",
      code: `const metrics = [
  { label: "Speed", value: 0.9 },
  { label: "Power", value: 0.6 },
  { label: "Range", value: 0.5 },
  { label: "Cost", value: 0.3 },
  { label: "Ease", value: 0.7 },
];`,
    },
  ],
};

export function Preview() {
  return <StarSpoke data={PROFILE} summary={false} size={84} />;
}

export const showcase = {
  hint: "profile",
  Node: () => <StarSpoke data={PROFILE} dots="tips" title="Product profile" size={84} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "dots", label: "dots", init: false },
    { kind: "toggle", key: "guides", label: "guides", init: true },
    { kind: "toggle", key: "compare", label: "vs baseline", init: false },
    { kind: "toggle", key: "labels", label: "labels", init: false },
  ],
  render: (s) => (
    <StarSpoke
      data={PROFILE}
      dots={s.dots ? "tips" : "none"}
      guides={s.guides as boolean}
      compare={s.compare ? [0.5, 0.5, 0.5, 0.5, 0.5] : undefined}
      labels={s.labels as boolean}
      summary={false}
      size={110}
    />
  ),
  code: (s) =>
    [
      "<StarSpoke",
      "  data={metrics}",
      s.dots === true && '  dots="tips"',
      s.guides === false && "  guides={false}",
      s.compare === true && "  compare={baseline}",
      s.labels === true && "  labels",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <StarSpokeInteractive
      data={PROFILE}
      dots={s.dots ? "tips" : "none"}
      guides={s.guides as boolean}
      compare={s.compare ? [0.5, 0.5, 0.5, 0.5, 0.5] : undefined}
      labels={s.labels as boolean}
      animate={ui.animate}
      summary={false}
      size={110}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<StarSpoke",
      "  data={metrics}",
      s.dots === true && '  dots="tips"',
      s.guides === false && "  guides={false}",
      s.compare === true && "  compare={baseline}",
      s.labels === true && "  labels",
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ←/→ to rotate through the spokes — each announces its metric and value.",
};

export const recipes: Recipe[] = [
  {
    label: "small multiple",
    code: `<StarSpoke data={row.metrics} size={28} />`,
    node: <StarSpoke data={PROFILE} summary={false} size={28} />,
  },
  {
    label: "vs baseline",
    code: `<StarSpoke data={metrics} compare={baseline} dots="tips" />`,
    node: (
      <StarSpoke
        data={PROFILE}
        compare={[0.5, 0.5, 0.5, 0.5, 0.5]}
        dots="tips"
        summary={false}
        size={64}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = props.data
    .slice(0, 5)
    .map((v, i) => ({ label: `m${i + 1}`, value: Math.min(1, Math.abs(v) / 100 || 0.5) }));
  return (
    <StarSpoke data={data.length >= 3 ? data : PROFILE} summary={false} size={props.height ?? 24} />
  );
}

export function markCode(): string {
  return `<StarSpoke data={metrics} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
