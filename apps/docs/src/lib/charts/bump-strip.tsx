import { BumpStrip } from "@microcharts/react/bump-strip";
import { InteractiveDemo } from "./bump-strip.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const RANKS = [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1];

export const entry: ChartEntry = {
  name: "BumpStrip",
  slug: "bump-strip",
  status: "stable",
  collection: "core",
  tagline: "Where do we rank, and which way is it moving.",
  staticImport: `${PKG}/bump-strip`,
  interactiveImport: `${PKG}/bump-strip/interactive`,
  dataShape: "(number | null)[] of 1-based ranks per period (null = unranked)",
  encoding: {
    channel: "vertical position on an inverted rank scale (#1 on top)",
    precision: "medium — end labels give the exact ranks; steps are ordinal",
  },
  nodeBudget: "≤ 10 (1 path + change dots + 2 end labels)",
  bestFor: ["leaderboard rows", "category-rank trends in KPI cards"],
  avoidFor: ["continuous values (Sparkline)", "more than ~15 rank levels"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "1-based integer ranks; null = unranked period (gap).",
    },
    {
      name: "maxRank",
      type: "number",
      required: false,
      description: "Fix the band so small multiples share a rank scale.",
    },
    {
      name: "dots",
      type: '"changes" | "none"',
      required: false,
      description: "Mark the moments rank actually moved.",
    },
    {
      name: "label",
      type: '"ends" | "last" | "none"',
      required: false,
      description: '"#5" → "#1" endpoint labels.',
    },
  ],
  demo: RANKS.map((r) => 6 - r),
  example: {
    title: "Category rank",
    code: `import { BumpStrip } from "${PKG}/bump-strip";\n\n<BumpStrip data={weeklyRanks} title="Category rank" />`,
  },
};

export function Preview() {
  return <BumpStrip data={RANKS} summary={false} style={{ width: 130, height: 20 }} />;
}

export const showcase = {
  hint: "rank",
  Node: () => <BumpStrip data={RANKS} title="Category rank" style={{ width: 130, height: 20 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["ends", "last", "none"],
      init: "ends",
    },
    {
      kind: "segmented",
      key: "dots",
      label: "dots",
      options: ["changes", "none"],
      init: "changes",
    },
  ],
  render: (s) => (
    <BumpStrip
      data={RANKS}
      label={s.label as "ends" | "last" | "none"}
      dots={s.dots as "changes" | "none"}
      summary={false}
      style={{ width: 260, height: 28 }}
    />
  ),
  code: (s) =>
    [
      "<BumpStrip",
      "  data={weeklyRanks}",
      s.label !== "ends" && `  label="${s.label}"`,
      s.dots !== "changes" && `  dots="${s.dots}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "leaderboard rows",
    code: `{products.map((p) => (\n  <BumpStrip key={p.id} data={p.ranks} maxRank={10} title={p.name} />\n))}`,
    node: (
      <BumpStrip data={RANKS} maxRank={10} summary={false} style={{ width: 160, height: 16 }} />
    ),
  },
  {
    label: "gaps for unranked weeks",
    code: `<BumpStrip data={[2, null, null, 3, 1, 1]} />`,
    node: (
      <BumpStrip
        data={[2, null, null, 3, 1, 1]}
        summary={false}
        style={{ width: 120, height: 16 }}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <BumpStrip
      data={props.data.map((v) => (Math.abs(Math.round(v)) % 8) + 1)}
      label="none"
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 12 }}
    />
  );
}

export function markCode(): string {
  return `<BumpStrip data={weeklyRanks} />`;
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
