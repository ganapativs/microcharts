import { FatDigits } from "@microcharts/react/fat-digits";
import { InteractiveDemo } from "./fat-digits.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const COLUMN = [1204, 318, 76, 942, 2100, 55];
const DOMAIN: [number, number] = [0, 2100];

export const entry: ChartEntry = {
  name: "FatDigits",
  slug: "fat-digits",
  status: "stable",
  collection: "expressive",
  tagline: "Which numbers in a dense column are big, before you read them.",
  staticImport: `${PKG}/fat-digits`,
  interactiveImport: `${PKG}/fat-digits/interactive`,
  dataShape: "{ value: number }",
  encoding: { channel: "the numeral + redundant font-weight tier", precision: "high" },
  nodeBudget: "1 (value) / ≤ len (digit)",
  bestFor: [
    "a dense numeric table column you scan for the big ones",
    "a KPI number that should carry its own magnitude",
    "an amount in a sentence",
  ],
  avoidFor: ["trends (Sparkline)", "proportions (Progress)", "comparisons (MiniBar)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The number (always the exact value).",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Maps value to a weight tier — always pass one.",
    },
    {
      name: "encode",
      type: '"value" | "digit"',
      required: false,
      description:
        "value weights the whole numeral; digit weights each digit by its own magnitude.",
    },
    { name: "tiers", type: "3 | 5", required: false, description: "Weight steps (default 5)." },
  ],
  demo: COLUMN,
  example: {
    title: "Revenue",
    code: `import { FatDigits } from "${PKG}/fat-digits";\n\n<FatDigits value={1204} domain={[0, 2100]} title="Revenue" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex flex-col items-end gap-1 tabular-nums">
      {COLUMN.map((v) => (
        <FatDigits key={v} value={v} domain={DOMAIN} summary={false} fontSize={14} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "big numbers pop",
  Node: () => <FatDigits value={2100} domain={DOMAIN} title="Peak" fontSize={20} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "value", min: 0, max: 2100, step: 20, init: 1204 },
    {
      kind: "segmented",
      key: "encode",
      label: "encode",
      options: ["value", "digit"],
      init: "value",
    },
    { kind: "segmented", key: "tiers", label: "tiers", options: ["5", "3"], init: "5" },
  ],
  render: (s) => (
    <FatDigits
      value={s.value as number}
      domain={DOMAIN}
      encode={s.encode as "value" | "digit"}
      tiers={Number(s.tiers) as 3 | 5}
      summary={false}
      fontSize={28}
    />
  ),
  code: (s) =>
    [
      "<FatDigits",
      `  value={${s.value}}`,
      "  domain={[0, 2100]}",
      s.encode !== "value" && `  encode="${s.encode}"`,
      s.tiers !== "5" && `  tiers={${s.tiers}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "a scannable table column (the hero)",
    code: `{rows.map((v) => <FatDigits value={v} domain={[0, 2100]} />)}`,
    node: (
      <span className="inline-flex flex-col items-end gap-1 tabular-nums">
        {COLUMN.map((v) => (
          <FatDigits key={v} value={v} domain={DOMAIN} summary={false} fontSize={14} />
        ))}
      </span>
    ),
  },
  {
    label: "digit mode weights each digit by its own magnitude",
    code: `<FatDigits value={1902} encode="digit" />`,
    node: <FatDigits value={1902} encode="digit" summary={false} fontSize={18} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? Math.abs(Math.round(props.data[0]!)) : 1204;
  return <FatDigits value={v} domain={DOMAIN} summary={false} fontSize={props.height ?? 14} />;
}

export function markCode(): string {
  return `<FatDigits value={1204} domain={[0, 2100]} />`;
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
