import { EnsembleGhosts } from "@microcharts/react/ensemble-ghosts";
import { EnsembleGhosts as EnsembleGhostsInteractive } from "@microcharts/react/ensemble-ghosts/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
// 24 simulated futures — a fan of walks with diverse shapes (deterministic)
export const FUTURES: number[][] = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);

export const entry: ChartEntry = {
  name: "EnsembleGhosts",
  slug: "ensemble-ghosts",
  status: "stable",
  collection: "decision",
  tagline: "What could happen, across the futures?",
  staticImport: `${PKG}/ensemble-ghosts`,
  interactiveImport: `${PKG}/ensemble-ghosts/interactive`,
  dataShape: "number[][] (2–50 members)",
  encoding: { channel: "path-bundle spread + one emphasized representative", precision: "low" },
  nodeBudget: "≤ 14 at cap",
  bestFor: [
    "a KPI card — the futures, not the average",
    "Monte-Carlo / simulation output where paths disagree in shape",
    "showing that outcomes fan out, not just their endpoint range",
  ],
  avoidFor: ["interval precision (ForecastCone)", "a single path (Sparkline)"],
  props: [
    {
      name: "data",
      type: "number[][]",
      required: true,
      description: "Ensemble members — 2–50 simulated paths.",
    },
    {
      name: "ghosts",
      type: "number",
      required: false,
      description:
        "Rendered member count (deterministic endpoint-rank selection). Default 8, cap 12.",
    },
    {
      name: "emphasis",
      type: '"nearest-median" | "median" | number',
      required: false,
      description: "A real median-like member, the synthetic median, or a pinned member.",
    },
    {
      name: "endpoints",
      type: "boolean",
      required: false,
      description: "Ghost endpoint dots — makes the final-value spread countable.",
    },
  ],
  demo: FUTURES.map((m) => m[m.length - 1]!),
  example: {
    title: "Simulated futures",
    code: `import { EnsembleGhosts } from "${PKG}/ensemble-ghosts";\n\n<EnsembleGhosts data={futures} title="Simulated futures" />`,
  },
  sampleData: [
    {
      name: "futures",
      code: `// 24 simulated futures — a fan of walks with diverse shapes
const futures = Array.from({ length: 24 }, (_m, i) =>
  Array.from({ length: 10 }, (_, t) =>
    Math.round(40 + (i - 12) * 0.55 * t * 0.4 + 3 * Math.sin(i + t) + t * 0.5),
  ),
);`,
    },
  ],
};

export function Preview() {
  return <EnsembleGhosts data={FUTURES} summary={false} width={120} height={28} />;
}

export const showcase = {
  hint: "the futures, not the average",
  Node: () => <EnsembleGhosts data={FUTURES} title="Simulated futures" width={160} height={32} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "ghosts", label: "ghosts", min: 3, max: 12, step: 1, init: 8 },
    {
      kind: "segmented",
      key: "emphasis",
      label: "emphasis",
      options: ["nearest-median", "median"],
      init: "nearest-median",
    },
    { kind: "toggle", key: "endpoints", label: "endpoints", init: false },
  ],
  render: (s) => (
    <EnsembleGhosts
      data={FUTURES}
      ghosts={s.ghosts as number}
      emphasis={s.emphasis as "nearest-median" | "median"}
      endpoints={s.endpoints as boolean}
      summary={false}
      width={280}
      height={44}
    />
  ),
  code: (s) =>
    [
      "<EnsembleGhosts",
      "  data={futures}",
      s.ghosts !== 8 && `  ghosts={${s.ghosts}}`,
      s.emphasis !== "nearest-median" && `  emphasis="${s.emphasis}"`,
      s.endpoints && "  endpoints",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <EnsembleGhostsInteractive
      data={FUTURES}
      ghosts={s.ghosts as number}
      emphasis={s.emphasis as "nearest-median" | "median"}
      endpoints={s.endpoints as boolean}
      animate={ui.animate}
      summary={false}
      width={280}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<EnsembleGhosts",
      "  data={futures}",
      s.ghosts !== 8 && `  ghosts={${s.ghosts}}`,
      s.emphasis !== "nearest-median" && `  emphasis="${s.emphasis}"`,
      s.endpoints && "  endpoints",
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover to flip through the futures one at a time (the HOP loop); with reduced motion, arrow keys step them instead — each member is announced.",
};

export const recipes: Recipe[] = [
  {
    label: "endpoint dots (countable spread)",
    code: `<EnsembleGhosts data={futures} endpoints />`,
    node: <EnsembleGhosts data={FUTURES} endpoints summary={false} width={200} height={40} />,
  },
  {
    label: "synthetic median path",
    code: `<EnsembleGhosts data={futures} emphasis="median" />`,
    node: (
      <EnsembleGhosts data={FUTURES} emphasis="median" summary={false} width={200} height={40} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const data = Array.from({ length: 6 }, (_m, i) =>
    Array.from({ length: 6 }, (_, t) => 30 + (i - 3) * t + ((props.data[i] ?? 0) % 5)),
  );
  return (
    <EnsembleGhosts
      data={data}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<EnsembleGhosts data={futures} />`;
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
