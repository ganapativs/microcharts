import { RugStrip } from "@microcharts/react/rug-strip";
import { InteractiveDemo } from "./rug-strip.client";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const FIELD = [42, 48, 51, 53, 55, 58, 61, 63, 66, 71, 55, 52, 49, 58, 62, 75, 83, 58, 54, 60];

export const entry: ChartEntry = {
  name: "RugStrip",
  slug: "rug-strip",
  status: "stable",
  collection: "core",
  tagline: "Where the raw observations actually sit — distribution without binning.",
  staticImport: `${PKG}/rug-strip`,
  interactiveImport: `${PKG}/rug-strip/interactive`,
  dataShape: "number[] (raw observations)",
  encoding: {
    channel: "tick position; density via ink accumulation",
    precision: "high per observation, medium for density",
  },
  nodeBudget: "≤ 4 (opacity-tiered tick paths + markValue)",
  bestFor: ['"you are here" in a band', "distribution beside a stat", "margin composition"],
  avoidFor: ["> 400 observations (HistogramStrip)", "trends over time (Sparkline)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Raw observations — position = value.",
    },
    {
      name: "markValue",
      type: "number",
      required: false,
      description: "One value emphasized against the field.",
    },
    {
      name: "orientation",
      type: '"horizontal" | "vertical"',
      required: false,
      description: "Vertical rugs sit beside distributions.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Fix the scale across rows (rugs mislead worst under per-row autoscale).",
    },
  ],
  demo: FIELD,
  example: {
    title: "Salary band",
    code: `import { RugStrip } from "${PKG}/rug-strip";\n\n<RugStrip data={salaries} markValue={yourOffer} title="Pay band" />`,
  },
  sampleData: [
    {
      name: "salaries",
      code: `const salaries = [42, 48, 51, 53, 55, 58, 61, 63, 66, 71, 55, 52, 49, 58, 62, 75, 83, 58, 54, 60];`,
    },
  ],
};

export function Preview() {
  return <RugStrip data={FIELD} markValue={62} summary={false} width={120} height={16} />;
}

export const showcase = {
  hint: "distribution",
  Node: () => <RugStrip data={FIELD} markValue={62} title="Pay band" width={120} height={16} />,
};

export const playground: PlaygroundSpec = {
  // data is the fixed/shuffled demo series; width/height/color/format/locale/
  // strings/title/summary/id/className/style/children are sizing/styling/
  // accessible-name chrome, not interactive read decisions — every remaining
  // documented prop (markValue, orientation, domain) has a control below.
  knobs: [
    { kind: "toggle", key: "markValue", label: "markValue", init: true },
    {
      kind: "segmented",
      key: "orientation",
      label: "orientation",
      options: ["horizontal", "vertical"],
      init: "horizontal",
    },
    { kind: "toggle", key: "domain", label: "fixed domain [0, 150]", init: false },
  ],
  data: FIELD,
  shuffle: (seed) => Array.from({ length: 24 }, (_, i) => 40 + ((i * (13 + seed)) % 47)),
  render: (s, data) => (
    <RugStrip
      data={data}
      markValue={(s.markValue as boolean) ? data[Math.floor(data.length / 2)] : undefined}
      orientation={s.orientation as "horizontal" | "vertical"}
      domain={(s.domain as boolean) ? [0, 150] : undefined}
      summary={false}
      style={s.orientation === "vertical" ? { width: 20, height: 140 } : { width: 220, height: 22 }}
    />
  ),
  code: (s) =>
    [
      "<RugStrip",
      "  data={salaries}",
      (s.markValue as boolean) && "  markValue={you}",
      s.orientation === "vertical" && '  orientation="vertical"',
      (s.domain as boolean) && "  domain={[0, 150]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "you vs the field",
    code: `<RugStrip data={salaries} markValue={78000}\n  domain={[40000, 120000]} />`,
    node: <RugStrip data={FIELD} markValue={75} summary={false} width={160} height={14} />,
  },
  {
    label: "fixed domain across rows",
    code: `// same scale per row or the rugs lie\n<RugStrip data={salaries} domain={[0, 200]} />\n<RugStrip data={salaries.map((v) => v * 1.9)} domain={[0, 200]} />`,
    node: (
      <span className="inline-flex flex-col gap-1">
        <RugStrip data={FIELD} domain={[0, 200]} summary={false} width={160} height={10} />
        <RugStrip
          data={FIELD.map((v) => v * 1.9)}
          domain={[0, 200]}
          summary={false}
          width={160}
          height={10}
        />
      </span>
    ),
  },
];

// Same field as `salaries` (FIELD) for the first row so the cell/sentence/kpi
// homes can quote the one bare `data={salaries}` var — the other two rows are
// derived bands for the tab/table contrast, never a second phantom var.
const BANDS: { role: string; salaries: number[]; offer: number }[] = [
  { role: "Engineering", salaries: FIELD, offer: 62 },
  { role: "Design", salaries: FIELD.map((v) => Math.round(v * 0.82)), offer: 46 },
  { role: "Sales", salaries: FIELD.map((v) => Math.round(v * 0.68)), offer: 40 },
];

/* The four homes — RugStrip always doing the one thing it's for: showing where
   one raw value sits inside a real field, never a binned or averaged stand-in.
   Every host is a comp-review surface (the chart's actual "Pay band" job),
   never a generic "signups" template. */
export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Their $62k offer sits{" "}
        <span className="mx-1 inline-flex align-middle">
          <RugStrip data={FIELD} markValue={62} summary={false} height={18} />
        </span>{" "}
        inside the band, not at either edge.
      </p>
    ),
    code: `<p>\n  Their $62k offer sits{" "}\n  <RugStrip data={salaries} markValue={62} height={18} /> inside the band, not at either edge.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {BANDS.map((b) => (
            <tr key={b.role} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{b.role}</td>
              <td className="py-1.5">
                <RugStrip
                  data={b.salaries}
                  markValue={b.offer}
                  summary={false}
                  width={64}
                  height={18}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">${b.offer}k</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <RugStrip data={salaries} markValue={62} width={64} height={18} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Offer vs. band</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">$62k</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">inside the range</span>
          </div>
        </div>
        <RugStrip data={FIELD} markValue={62} summary={false} width={90} height={30} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">$62k</span>\n  <span className="unit">inside the range</span>\n  <RugStrip data={salaries} markValue={62} width={90} height={30} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {BANDS.slice(0, 2).map((b, i) => (
          <span
            key={b.role}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {b.role}
            <RugStrip
              data={b.salaries}
              markValue={b.offer}
              summary={false}
              width={40}
              height={14}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Engineering <RugStrip data={salaries} markValue={62} width={40} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <RugStrip
      data={props.data}
      summary={false}
      style={{ width: props.width ?? 60, height: props.height ?? 10 }}
    />
  );
}

export function markCode(): string {
  return `<RugStrip data={data} />`;
}

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
