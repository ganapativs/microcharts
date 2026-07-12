import { TrendArrow } from "@microcharts/react/trend-arrow";
import { TrendArrow as TrendArrowInteractive } from "@microcharts/react/trend-arrow/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
const PCT = { style: "percent", maximumFractionDigits: 0 } as const;

const METRICS: { label: string; value: number; positive: "up" | "down" }[] = [
  { label: "P95 latency", value: 0.09, positive: "down" },
  { label: "Error rate", value: -0.22, positive: "down" },
  { label: "Signups", value: 0.06, positive: "up" },
];
const SERVICES = [
  { label: "API", value: -0.08 },
  { label: "Web", value: 0.03 },
  { label: "Worker", value: 0.15 },
];

export const entry: ChartEntry = {
  name: "TrendArrow",
  slug: "trend-arrow",
  status: "stable",
  collection: "core",
  tagline: "Which way is this moving — at glyph size, before any number.",
  staticImport: `${PKG}/trend-arrow`,
  interactiveImport: `${PKG}/trend-arrow/interactive`,
  dataShape: "number (signed change)",
  encoding: {
    channel: "glyph orientation (up / down / flat)",
    precision: "low — use Delta when the magnitude matters",
  },
  nodeBudget: "≤ 2 (glyph + optional value)",
  bestFor: ["table direction columns", "dense dashboards", "inline movement cues"],
  avoidFor: ["exact magnitudes (use Delta)", "series shape (use Sparkline)"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Signed change; sign → direction, magnitude only via showValue/summary.",
    },
    {
      name: "flatBand",
      type: "number",
      required: false,
      description: "Noise floor: |value| ≤ flatBand renders the flat glyph.",
    },
    {
      name: "glyph",
      type: '"arrow" | "triangle" | "chevron"',
      required: false,
      description: "Mark weight: default legibility, dense cells, inline text.",
    },
    {
      name: "showValue",
      type: "boolean",
      required: false,
      description: "Append the formatted value in a right gutter.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good (colors only, never the glyph).",
    },
  ],
  demo: [0.12],
  example: {
    title: "Latency direction",
    code: `import { TrendArrow } from "${PKG}/trend-arrow";\n\n<TrendArrow value={-0.08} positive="down" title="Latency vs last week" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      <TrendArrow value={0.3} summary={false} />
      <TrendArrow value={0} summary={false} />
      <TrendArrow value={-0.3} summary={false} />
    </span>
  );
}

export const showcase = {
  hint: "direction",
  Node: () => (
    <TrendArrow
      value={0.12}
      showValue
      format={PCT}
      title="WAU change"
      style={{ width: 40, height: 22 }}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "change %", min: -50, max: 50, init: 12 },
    { kind: "range", key: "flatBand", label: "flat band %", min: 0, max: 20, init: 0 },
    {
      kind: "segmented",
      key: "glyph",
      label: "glyph",
      options: ["arrow", "triangle", "chevron"],
      init: "arrow",
    },
    { kind: "toggle", key: "showValue", label: "show value", init: false },
    { kind: "segmented", key: "positive", label: "good dir", options: ["up", "down"], init: "up" },
  ],
  render: (s) => (
    <TrendArrow
      value={(s.pct as number) / 100}
      flatBand={(s.flatBand as number) / 100}
      glyph={s.glyph as "arrow" | "triangle" | "chevron"}
      showValue={s.showValue as boolean}
      positive={s.positive as "up" | "down"}
      format={PCT}
      summary={false}
      style={{ width: (s.showValue as boolean) ? 96 : 48, height: 48 }}
    />
  ),
  code: (s) =>
    [
      "<TrendArrow",
      `  value={${(s.pct as number) / 100}}`,
      (s.flatBand as number) > 0 && `  flatBand={${(s.flatBand as number) / 100}}`,
      s.glyph !== "arrow" && `  glyph="${s.glyph}"`,
      (s.showValue as boolean) && "  showValue",
      s.positive === "down" && '  positive="down"',
      '  format={{ style: "percent", maximumFractionDigits: 0 }}',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <TrendArrowInteractive
      value={(s.pct as number) / 100}
      flatBand={(s.flatBand as number) / 100}
      glyph={s.glyph as "arrow" | "triangle" | "chevron"}
      showValue={s.showValue as boolean}
      positive={s.positive as "up" | "down"}
      format={PCT}
      summary={false}
      animate={ui.animate}
      style={{ width: (s.showValue as boolean) ? 96 : 48, height: 48 }}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<TrendArrow",
      `  value={${(s.pct as number) / 100}}`,
      (s.flatBand as number) > 0 && `  flatBand={${(s.flatBand as number) / 100}}`,
      s.glyph !== "arrow" && `  glyph="${s.glyph}"`,
      (s.showValue as boolean) && "  showValue",
      s.positive === "down" && '  positive="down"',
      '  format={{ style: "percent", maximumFractionDigits: 0 }}',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint: "Cycle the value — direction changes pulse and re-announce politely.",
};

export const recipes: Recipe[] = [
  {
    label: "matches the text",
    code: `// size the glyph in em so it rides the surrounding type\n<span>\n  Errors <TrendArrow value={0.4} positive="down" style={{ width: "1em", height: "1em" }} />\n</span>`,
    node: (
      <span>
        Errors{" "}
        <TrendArrow
          value={0.4}
          positive="down"
          summary={false}
          style={{ width: "1em", height: "1em" }}
        />
      </span>
    ),
  },
  {
    label: "with the number",
    code: `// showValue widens the viewBox for the formatted value\n<TrendArrow value={0.12} showValue format={{ style: "percent" }}\n  style={{ height: 22 }} />`,
    node: <TrendArrow value={0.12} showValue format={PCT} summary={false} style={{ height: 22 }} />,
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        P95 latency{" "}
        <span className="mc-inline">
          <TrendArrow
            value={0.09}
            positive="down"
            format={PCT}
            summary={false}
            style={{ width: 16, height: 16 }}
          />
        </span>{" "}
        is up 9% since the deploy — worth a look before it trips the SLO.
      </p>
    ),
    code: `<p>\n  P95 latency{" "}\n  <TrendArrow value={0.09} positive="down" format={{ style: "percent" }} />{" "}\n  is up 9% since the deploy.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {METRICS.map((m) => (
            <tr key={m.label} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{m.label}</td>
              <td className="py-1.5">
                <TrendArrow
                  value={m.value}
                  positive={m.positive}
                  format={PCT}
                  summary={false}
                  style={{ width: 16, height: 16 }}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {m.value > 0 ? "+" : ""}
                {Math.round(m.value * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <TrendArrow value={-0.22} positive="down" format={{ style: "percent" }} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Error rate, 7d</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">0.6%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">of requests</span>
          </div>
        </div>
        <TrendArrow
          value={-0.22}
          positive="down"
          showValue
          format={PCT}
          summary={false}
          style={{ height: 30 }}
        />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">0.6%</span>\n  <span className="unit">of requests</span>\n  <TrendArrow value={-0.22} positive="down" showValue format={{ style: "percent" }} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SERVICES.map((s, i) => (
          <span
            key={s.label}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {s.label}
            <TrendArrow
              value={s.value}
              positive="down"
              glyph="chevron"
              summary={false}
              style={{ width: 12, height: 12 }}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  API <TrendArrow value={-0.08} positive="down" glyph="chevron" />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <TrendArrow value={0.12} summary={false} />;
}

export function markCode(): string {
  return `<TrendArrow value={0.12} />`;
}

export function PreviewLive() {
  return (
    <span className="inline-flex items-center gap-3">
      <TrendArrowInteractive value={0.3} summary={false} animate />
      <TrendArrow value={0} summary={false} />
      <TrendArrow value={-0.3} summary={false} />
    </span>
  );
}

export default {
  entry,
  Preview,
  PreviewLive,
  showcase,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
