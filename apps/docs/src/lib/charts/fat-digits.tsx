import { FatDigits } from "@microcharts/react/fat-digits";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const COLUMN = [1204, 318, 76, 942, 2100, 55];
export const DOMAIN: [number, number] = [0, 2100];

export const entry: ChartEntry = {
  name: "FatDigits",
  slug: "fat-digits",
  status: "stable",
  collection: "expressive",
  tagline: "Which numbers in a dense column are big, before you read them.",
  staticImport: `${PKG}/fat-digits`,
  interactiveImport: `${PKG}/fat-digits/interactive`,
  picker: false,
  // The glyph prints (or IS) its own reading — a hover chip would duplicate it.
  readout: false,
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
      type: "readonly [number, number]",
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
  interactiveHint:
    "Tap to change the value — the numeral stays exact while its weight eases to the new tier (on variable fonts; it snaps otherwise). The value and tier are announced through a polite live region.",
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

const CTX_ROWS = [
  { name: "Acme", meta: "2.1M", value: 2100 },
  { name: "Globex", meta: "942K", value: 942 },
  { name: "Initech", meta: "318K", value: 318 },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Revenue column scan{" "}
        <span className="mc-inline">
          <FatDigits value={2100} domain={DOMAIN} summary={false} fontSize={14} />
        </span>{" "}
        — Acme at 2.1M stands out.
      </p>
    ),
    code: '<p>\n  Revenue column scan{" "}\n  <span className="mc-inline">\n    <FatDigits value={2100} domain={[0, 2100]} summary={false} />\n  </span>{" "}\n  — Acme at 2.1M stands out.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{row.name}</td>
              <td className="py-1.5">
                <FatDigits value={row.value} domain={DOMAIN} summary={false} fontSize={14} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <FatDigits value={row.value} domain={[0, 2100]} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Acme</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">2.1M</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">revenue</span>
          </div>
        </div>
        <span className="inline-flex flex-col items-end gap-0.5 tabular-nums">
          {COLUMN.slice(0, 4).map((v) => (
            <FatDigits key={v} value={v} domain={DOMAIN} summary={false} fontSize={13} />
          ))}
        </span>
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">2.1M</span>\n  <FatDigits value={2100} domain={[0, 2100]} />\n</div>',
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
            <FatDigits value={row.value} domain={DOMAIN} summary={false} fontSize={12} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Acme <FatDigits value={row.value} domain={[0, 2100]} />\n</button>',
  },
};

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
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
