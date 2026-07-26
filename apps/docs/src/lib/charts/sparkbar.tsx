import { SparkBar } from "@microcharts/react/sparkbar";
import { wave } from "./demo-data";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const DEPLOYS = [4, 6, 2, 8, 5, 9, 3, 7];
const CI_RUNS = [1, 1, -1, 1, 1, 1, -1]; // 1 = win, -1 = loss
const RELEASE_RUNS = [1, -1, -1, 1, -1, 1, 1];
const SERVICES = [
  { name: "checkout", deploys: [2, 1, 3, 0, 2, 4, 1] },
  { name: "search", deploys: [1, 0, 1, 2, 1, 3, 2] },
  { name: "billing", deploys: [0, 0, 1, 0, 0, 1, 0] },
];

export const entry: ChartEntry = {
  name: "SparkBar",
  slug: "sparkbar",
  status: "stable",
  collection: "core",
  tagline: "Compact bars for magnitude, or a win–loss streak of outcomes.",
  staticImport: `${PKG}/sparkbar`,
  interactiveImport: `${PKG}/sparkbar/interactive`,
  dataShape: "number[]",
  encoding: { channel: "length (bar height from a zero baseline)", precision: "high" },
  nodeBudget: "1 per bar",
  bestFor: ["discrete magnitudes", "win–loss streaks", "period-over-period counts"],
  avoidFor: ["continuous trend shape", "many hundreds of points"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Values; negatives dip below the baseline.",
    },
    {
      name: "mode",
      type: '"bar" | "winloss"',
      required: false,
      description: "Magnitude bars, or a win/loss/tie streak (sign only).",
    },
    {
      name: "gap",
      type: "number",
      required: false,
      description: "Empty fraction of each slot (0–0.9).",
    },
    {
      name: "label",
      type: '"none" | "last"',
      required: false,
      description: "Direct endpoint value label.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: '"up" (default); "down" flips which sign is good.',
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
    {
      name: "locale",
      type: "string | string[]",
      required: false,
      description: "BCP 47 locale(s) for the endpoint label and summary.",
    },
  ],
  demo: [4, 6, 2, 8, 5, 9, 3, 7],
  example: {
    title: "Deploys per day",
    code: `import { SparkBar } from "${PKG}/sparkbar";\n\n<SparkBar data={[4, 6, 2, 8, 5, 9]} title="Deploys per day" />`,
  },
  sampleData: [
    { name: "deploys", code: `const deploys = [4, 6, 2, 8, 5, 9, 3, 7]; // per day, Mon–Mon` },
    { name: "ciRuns", code: `const ciRuns = [1, 1, -1, 1, 1, 1, -1]; // 1 = pass, -1 = fail` },
    { name: "releaseRuns", code: `const releaseRuns = [1, -1, -1, 1, -1, 1, 1];` },
  ],
};

export function Preview() {
  return <SparkBar data={entry.demo} width={180} height={48} summary={false} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "segmented", key: "mode", options: ["bar", "winloss"], init: "bar" },
    { kind: "toggle", key: "label", init: false },
    {
      kind: "segmented",
      key: "positive",
      label: "positive",
      options: ["up", "down"],
      init: "up",
    },
    { kind: "range", key: "gap", label: "gap", min: 0, max: 0.6, step: 0.05, init: 0.25 },
    {
      kind: "segmented",
      key: "locale",
      label: "locale",
      options: ["en-US", "de-DE"],
      init: "en-US",
    },
    // `title`/`summary`/`domain`/`color` aren't playground controls — accessible-name
    // text and styling overrides, not visual states to twiddle; shown as-is elsewhere.
  ],
  data: [4, 6, 2, 8, 5, 9, 3, 7, 6, 10],
  shuffle: wave,
  render: (s, data) => {
    const shown = s.mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
    const gap = Number((s.gap as number).toFixed(2));
    return (
      <SparkBar
        data={shown}
        width={340}
        height={92}
        mode={s.mode as "bar" | "winloss"}
        gap={gap}
        label={s.label ? "last" : "none"}
        positive={s.positive as "up" | "down"}
        locale={s.locale as string}
        style={{ width: "100%", maxWidth: "28rem", height: "auto" }}
        title="Deploys per day"
      />
    );
  },
  code: (s, data) => {
    const shown = s.mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
    const gap = Number((s.gap as number).toFixed(2));
    return [
      "<SparkBar",
      `  data={[${shown.join(", ")}]}`,
      `  mode="${s.mode}"`,
      gap !== 0.25 && `  gap={${gap}}`,
      s.label && '  label="last"',
      s.positive !== "up" && `  positive="${s.positive}"`,
      s.locale !== "en-US" && `  locale="${s.locale}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n");
  },
  interactiveHint: "Hover a bar, or focus and step through with ← →.",
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 80×20 box\n<SparkBar data={[4, 6, 2, 8, 5, 9]} />`,
    node: <SparkBar data={[4, 6, 2, 8, 5, 9]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// width & height are viewBox units — they also set the pixel box\n<SparkBar data={[4, 6, 2, 8, 5, 9]} width={200} height={48} />`,
    node: <SparkBar data={[4, 6, 2, 8, 5, 9]} width={200} height={48} summary={false} />,
  },
  {
    label: "responsive",
    code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <SparkBar data={[4, 6, 2, 8, 5, 9]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <SparkBar
        data={[4, 6, 2, 8, 5, 9]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Deploys peaked at nine mid-week{" "}
        <span className="mc-inline">
          <SparkBar data={DEPLOYS} summary={false} width={70} height={16} />
        </span>{" "}
        — quieter since.
      </p>
    ),
    code: `<p>\n  Deploys peaked at nine mid-week{" "}\n  <span className="mc-inline">\n    <SparkBar data={deploys} width={70} height={16} summary={false} />\n  </span>{" "}\n  — quieter since.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SERVICES.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <SparkBar data={s.deploys} summary={false} width={56} height={16} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {s.deploys.reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <SparkBar data={services[0].deploys} width={56} height={16} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">CI pass rate</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">5 / 7</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">last 7 runs</span>
          </div>
        </div>
        <SparkBar data={CI_RUNS} mode="winloss" summary={false} width={80} height={26} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">5 / 7</span>\n  <span className="unit">last 7 runs</span>\n  <SparkBar data={ciRuns} mode="winloss" width={80} height={26} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["CI", CI_RUNS],
            ["Release", RELEASE_RUNS],
          ] as const
        ).map(([name, runs], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <SparkBar data={runs} mode="winloss" summary={false} width={44} height={14} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  CI <SparkBar data={ciRuns} mode="winloss" width={44} height={14} />\n</button>\n<button className="tab">\n  Release <SparkBar data={releaseRuns} mode="winloss" width={44} height={14} />\n</button>`,
  },
};

export function Mark({ data, width, height }: { data: number[]; width?: number; height?: number }) {
  return <SparkBar data={data} width={width ?? 64} height={height ?? 18} summary={false} />;
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<SparkBar data={data}${size} />`;
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
