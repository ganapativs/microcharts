import { MusicStaff } from "@microcharts/react/music-staff";
import { MusicStaff as MusicStaffInteractive } from "@microcharts/react/music-staff/interactive";
import { InteractiveDemo } from "./music-staff.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const MELODY = [3, 5, 4, 8, 6, 9, 7, 11];

export const entry: ChartEntry = {
  name: "MusicStaff",
  slug: "music-staff",
  status: "stable",
  collection: "expressive",
  tagline: "The shape of a short series, read as a melody.",
  staticImport: `${PKG}/music-staff`,
  interactiveImport: `${PKG}/music-staff/interactive`,
  dataShape: "(number | null)[]",
  encoding: { channel: "pitch (vertical position on a 5-line staff)", precision: "medium" },
  nodeBudget: "n + 2 (n ≤ 16)",
  bestFor: [
    "a weekly-rhythm read in a sentence",
    "the shape of a sprint or short series in a cell",
    "a per-channel melody in a tab",
  ],
  avoidFor: [
    "exact values (Sparkline + label)",
    "long series (> 16 points)",
    "trends where slope matters",
  ],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "The series; null = a rest.",
    },
    {
      name: "range",
      type: '"staff" | "ledger"',
      required: false,
      description: "ledger (±2, default) or staff (clamp on-staff).",
    },
    {
      name: "label",
      type: '"none" | "last"',
      required: false,
      description: "Print the final value after the last note.",
    },
  ],
  demo: MELODY,
  example: {
    title: "Sprint melody",
    code: `import { MusicStaff } from "${PKG}/music-staff";\n\n<MusicStaff data={weeks} title="Sprint melody" />`,
  },
};

export function Preview() {
  return <MusicStaff data={MELODY} summary={false} width={80} height={22} />;
}

export const showcase = {
  hint: "read as melody",
  Node: () => (
    <MusicStaff data={MELODY} label="last" title="Sprint melody" width={90} height={24} />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "range",
      label: "range",
      options: ["ledger", "staff"],
      init: "ledger",
    },
    { kind: "toggle", key: "label", label: "last value", init: false },
  ],
  data: MELODY,
  render: (s, data) => (
    <MusicStaff
      data={data}
      range={s.range as "ledger" | "staff"}
      label={s.label ? "last" : "none"}
      summary={false}
      width={220}
      height={40}
    />
  ),
  code: (s) =>
    [
      "<MusicStaff",
      "  data={weeks}",
      s.range !== "ledger" && `  range="${s.range}"`,
      s.label && '  label="last"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, data, ui) => (
    <MusicStaffInteractive
      data={data}
      range={s.range as "ledger" | "staff"}
      label={s.label ? "last" : "none"}
      summary={false}
      animate={ui.animate}
      width={220}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MusicStaff",
      "  data={weeks}",
      s.range !== "ledger" && `  range="${s.range}"`,
      s.label && '  label="last"',
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow ←/→ across the notes — each announces its position and value, like stepping through a melody.",
};

export const recipes: Recipe[] = [
  {
    label: "staff range clamps the pitch on-staff",
    code: `<MusicStaff data={weeks} range="staff" />`,
    node: <MusicStaff data={MELODY} range="staff" summary={false} width={120} height={24} />,
  },
  {
    label: "a rest (null) leaves a gap",
    code: `<MusicStaff data={[3, 5, null, 8, 6]} />`,
    node: <MusicStaff data={[3, 5, null, 8, 6]} summary={false} width={90} height={22} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MusicStaff
      data={props.data.length ? props.data.slice(0, 8) : MELODY}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<MusicStaff data={weeks} />`;
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
