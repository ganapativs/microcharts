import { MicroDonut } from "@microcharts/react/micro-donut";
import { InteractiveDemo } from "./micro-donut.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const MIX = [
  { label: "Chrome", value: 620 },
  { label: "Safari", value: 240 },
  { label: "Firefox", value: 90 },
  { label: "Edge", value: 30 },
  { label: "Arc", value: 20 },
];

export const entry: ChartEntry = {
  name: "MicroDonut",
  slug: "micro-donut",
  status: "stable",
  collection: "core",
  tagline: "Roughly what is this made of — an honest, capped concession at icon size.",
  staticImport: `${PKG}/micro-donut`,
  interactiveImport: `${PKG}/micro-donut/interactive`,
  dataShape: "{ label, value }[]",
  encoding: { channel: "wedge angle", precision: "LOW — SegmentedBar for any comparative read" },
  nodeBudget: "≤ 5 (4 wedges + Other)",
  bestFor: ["mix icon beside a printed number", "KPI card corners"],
  avoidFor: ["comparative reads (SegmentedBar)", "precision of any kind"],
  props: [
    {
      name: "data",
      type: "{ label; value }[]",
      required: true,
      description: "Parts of the whole.",
    },
    {
      name: "maxWedges",
      type: "number",
      required: false,
      description: "Rollup threshold (default 4).",
    },
    {
      name: "decorative",
      type: "boolean",
      required: false,
      description: "Redundant ornament beside a printed value → aria-hidden.",
    },
    {
      name: "weight",
      type: "number",
      required: false,
      description: "Annulus thickness (shared with ProgressRing).",
    },
  ],
  demo: MIX.map((d) => d.value),
  example: {
    title: "Traffic mix",
    code: `import { MicroDonut } from "${PKG}/micro-donut";\n\n<MicroDonut data={mix} title="Traffic mix" />`,
  },
};

export function Preview() {
  return <MicroDonut data={MIX} summary={false} style={{ width: 40, height: 40 }} />;
}

export const showcase = {
  hint: "mix icon",
  Node: () => <MicroDonut data={MIX} title="Traffic mix" style={{ width: 40, height: 40 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "maxWedges", label: "max wedges", min: 2, max: 4, init: 4 },
    { kind: "range", key: "weight", label: "weight", min: 3, max: 10, init: 5 },
  ],
  render: (s) => (
    <MicroDonut
      data={MIX}
      maxWedges={s.maxWedges as number}
      weight={s.weight as number}
      size={48}
      summary={false}
      style={{ width: 96, height: 96 }}
    />
  ),
  code: (s) =>
    [
      "<MicroDonut",
      "  data={mix}",
      s.maxWedges !== 4 && `  maxWedges={${s.maxWedges}}`,
      s.weight !== 5 && `  weight={${s.weight}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "beside the printed number",
    code: `// the number is the datum; the donut repeats it — declare it decorative\n<span>62% Chrome <MicroDonut data={mix} decorative /></span>`,
    node: (
      <span>
        62% Chrome <MicroDonut data={MIX} decorative style={{ width: "1em", height: "1em" }} />
      </span>
    ),
  },
  {
    label: "accessible mix icon",
    code: `<MicroDonut data={mix} title="Traffic mix" />`,
    node: <MicroDonut data={MIX} summary={false} style={{ width: 24, height: 24 }} />,
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <MicroDonut data={MIX.slice(0, 3)} summary={false} style={{ width: 18, height: 18 }} />;
}

export function markCode(): string {
  return `<MicroDonut data={mix} />`;
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
