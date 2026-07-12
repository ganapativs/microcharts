import { VolumeProfile } from "@microcharts/react/volume-profile";
import { VolumeProfile as VolumeProfileInteractive } from "@microcharts/react/volume-profile/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const PROFILE = [
  { level: 134, weight: 3 },
  { level: 136, weight: 6 },
  { level: 138, weight: 11 },
  { level: 140, weight: 18 },
  { level: 142, weight: 26 },
  { level: 144, weight: 20 },
  { level: 146, weight: 12 },
  { level: 148, weight: 7 },
  { level: 150, weight: 4 },
];

export const entry: ChartEntry = {
  name: "VolumeProfile",
  slug: "volume-profile",
  status: "stable",
  collection: "frontier",
  tagline: "At which level did activity concentrate — not when.",
  staticImport: `${PKG}/volume-profile`,
  interactiveImport: `${PKG}/volume-profile/interactive`,
  dataShape: "{ level, weight }[] or raw levels: number[]",
  encoding: {
    channel: "horizontal bar = mass at level (level axis vertical)",
    precision: "medium",
  },
  nodeBudget: "≤ 4",
  bestFor: ["volume-at-price / level-of-activity", "load by tier"],
  avoidFor: ["a time series (Sparkline)", "when timing matters (use a trend chart)"],
  props: [
    {
      name: "data",
      type: "{ level, weight }[] | number[]",
      required: true,
      description: "Activity mass per level, or raw levels.",
    },
    {
      name: "valueArea",
      type: "number",
      required: false,
      description: "Mass fraction of the shaded value area (0.7).",
    },
    {
      name: "align",
      type: '"left" | "right"',
      required: false,
      description: "Which way bars grow.",
    },
    {
      name: "label",
      type: '"poc" | "none"',
      required: false,
      description: "The POC level beside the accent bar.",
    },
  ],
  demo: [142],
  example: {
    title: "Volume by price",
    code: `import { VolumeProfile } from "${PKG}/volume-profile";\n\n<VolumeProfile data={profile} title="Volume by price" />`,
  },
  sampleData: [
    {
      name: "profile",
      code: `const profile = [
  { level: 134, weight: 3 },
  { level: 136, weight: 6 },
  { level: 138, weight: 11 },
  { level: 140, weight: 18 },
  { level: 142, weight: 26 },
  { level: 144, weight: 20 },
  { level: 146, weight: 12 },
  { level: 148, weight: 7 },
  { level: 150, weight: 4 },
];`,
    },
  ],
};

export function Preview() {
  return <VolumeProfile data={PROFILE} summary={false} width={60} height={40} />;
}

export const showcase = {
  hint: "at-level",
  Node: () => <VolumeProfile data={PROFILE} title="Volume by price" width={60} height={40} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "align", label: "align", options: ["left", "right"], init: "left" },
    { kind: "segmented", key: "label", label: "label", options: ["poc", "none"], init: "poc" },
    { kind: "range", key: "valueArea", label: "value area %", min: 50, max: 90, step: 5, init: 70 },
  ],
  render: (s) => (
    <VolumeProfile
      data={PROFILE}
      align={s.align as "left" | "right"}
      label={s.label as "poc" | "none"}
      valueArea={(s.valueArea as number) / 100}
      summary={false}
      width={200}
      height={132}
    />
  ),
  code: (s) =>
    [
      "<VolumeProfile",
      "  data={profile}",
      s.align !== "left" && `  align="${s.align}"`,
      s.label !== "poc" && `  label="${s.label}"`,
      s.valueArea !== 70 && `  valueArea={${((s.valueArea as number) / 100).toFixed(2)}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <VolumeProfileInteractive
      data={PROFILE}
      align={s.align as "left" | "right"}
      label={s.label as "poc" | "none"}
      valueArea={(s.valueArea as number) / 100}
      animate={ui.animate}
      summary={false}
      width={200}
      height={132}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<VolumeProfile",
      "  data={profile}",
      s.align !== "left" && `  align="${s.align}"`,
      s.label !== "poc" && `  label="${s.label}"`,
      s.valueArea !== 70 && `  valueArea={${((s.valueArea as number) / 100).toFixed(2)}}`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or use ↑/↓ across the levels — each announces its share of total activity, and the POC is flagged.",
};

export const recipes: Recipe[] = [
  {
    label: "level-activity cell",
    code: `<VolumeProfile data={profile} label="none" width={32} height={32} />`,
    node: <VolumeProfile data={PROFILE} label="none" summary={false} width={32} height={32} />,
  },
  {
    label: "right side (pair with trend)",
    code: `<VolumeProfile data={profile} align="right" />`,
    node: <VolumeProfile data={PROFILE} align="right" summary={false} width={80} height={56} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <VolumeProfile
      data={PROFILE}
      label="none"
      summary={false}
      width={props.width ?? 32}
      height={props.height ?? 32}
    />
  );
}

export function markCode(): string {
  return `<VolumeProfile data={profile} />`;
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
