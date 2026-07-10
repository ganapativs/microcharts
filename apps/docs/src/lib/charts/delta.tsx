import { Delta } from "@microcharts/react/delta";
import { Delta as DeltaInteractive } from "@microcharts/react/delta/interactive";
import { InteractiveDemo } from "./delta.client";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Delta",
  slug: "delta",
  status: "stable",
  collection: "core",
  tagline: "A signed change, double-encoded by glyph and color.",
  staticImport: `${PKG}/delta`,
  interactiveImport: `${PKG}/delta/interactive`,
  dataShape: "number (+ optional from)",
  encoding: { channel: "text + direction glyph (▲/▼)", precision: "high — it is the number" },
  nodeBudget: "2 (glyph + value, HTML)",
  bestFor: ["KPI change", "period-over-period %", "inline metric movement"],
  avoidFor: ["showing a series", "magnitude across many items"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "The change, or current value when from is set.",
    },
    {
      name: "from",
      type: "number",
      required: false,
      description: "Prior value; Delta shows the percent change.",
    },
    {
      name: "positive",
      type: '"up" | "down"',
      required: false,
      description: "Which direction is good (colors only).",
    },
    {
      name: "format",
      type: "Intl.NumberFormatOptions | fn",
      required: false,
      description: "Number formatting.",
    },
    {
      name: "locale",
      type: "string | string[]",
      required: false,
      description: "BCP 47 locale(s) for the formatted number.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [0.124],
  example: {
    title: "Revenue change",
    code: `import { Delta } from "${PKG}/delta";\n\n<Delta value={0.124} title="Revenue vs last week" />`,
  },
};

export function Preview() {
  return (
    <span className="text-2xl">
      <Delta value={0.184} summary={false} />
    </span>
  );
}

export const showcase = {
  hint: "change",
  Node: () => (
    <span className="text-lg">
      <DeltaInteractive value={0.184} title="Growth vs last week" live />
    </span>
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "pct", label: "change %", min: -50, max: 50, init: 12 },
    { kind: "segmented", key: "positive", label: "good dir", options: ["up", "down"], init: "up" },
    {
      kind: "segmented",
      key: "mode",
      label: "value / from / format",
      options: ["percent", "from prior", "currency"],
      init: "percent",
    },
    {
      kind: "segmented",
      key: "locale",
      label: "locale",
      options: ["en-US", "de-DE"],
      init: "en-US",
    },
    // `summary`/`title` aren't playground controls — they're accessible-name text,
    // not a visual state to twiddle; both are shown as-is throughout the page.
  ],
  render: (s) => {
    const pct = s.pct as number;
    const positive = s.positive as "up" | "down";
    const mode = s.mode as string;
    const locale = s.locale as string;
    if (mode === "from prior") {
      return (
        <span className="text-3xl">
          <Delta value={100 + pct} from={100} positive={positive} locale={locale} summary={false} />
        </span>
      );
    }
    if (mode === "currency") {
      return (
        <span className="text-3xl">
          <Delta
            value={pct * 1000}
            format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            positive={positive}
            locale={locale}
            summary={false}
          />
        </span>
      );
    }
    return (
      <span className="text-3xl">
        <Delta value={pct / 100} positive={positive} locale={locale} summary={false} />
      </span>
    );
  },
  code: (s) => {
    const pct = s.pct as number;
    const positive = s.positive as "up" | "down";
    const mode = s.mode as string;
    const locale = s.locale as string;
    const lines = ["<Delta"];
    if (mode === "from prior") {
      lines.push(`  value={${100 + pct}}`, "  from={100}");
    } else if (mode === "currency") {
      lines.push(
        `  value={${pct * 1000}}`,
        '  format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}',
      );
    } else {
      lines.push(`  value={${(pct / 100).toFixed(2)}}`);
    }
    if (positive === "down") lines.push('  positive="down"');
    if (locale !== "en-US") lines.push(`  locale="${locale}"`);
    lines.push("/>");
    return lines.join("\n");
  },
};

export const recipes: Recipe[] = [
  {
    label: "inherits text size",
    code: `// Delta is text — it takes the font-size of whatever wraps it\n<span style={{ fontSize: "1rem" }}>\n  Revenue <Delta value={0.124} />\n</span>`,
    node: (
      <span style={{ fontSize: "1rem" }}>
        Revenue <Delta value={0.124} summary={false} />
      </span>
    ),
  },
  {
    label: "larger",
    code: `// scale it up beside a KPI figure by lifting the font-size\n<span style={{ fontSize: "1.75rem" }}>\n  <Delta value={0.124} />\n</span>`,
    node: (
      <span style={{ fontSize: "1.75rem" }}>
        <Delta value={0.124} summary={false} />
      </span>
    ),
  },
];

const REGION_DELTAS: { region: string; revenue: string; value: number }[] = [
  { region: "West", revenue: "$128k", value: 0.062 },
  { region: "East", revenue: "$94k", value: -0.031 },
  { region: "North", revenue: "$61k", value: 0 },
];

const SECTIONS: { name: string; value: number; positive: "up" | "down" }[] = [
  { name: "Growth", value: 0.124, positive: "up" },
  { name: "Costs", value: -0.02, positive: "down" },
];

/* The four homes — Delta always doing the one thing it's for: a signed change
   read at a glance, direction doubled by glyph and color. Every host is a real
   metric surface (latency, revenue-by-region, an MRR card, dashboard nav),
   never a generic "signups" template. */
export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        API p95 latency held at 212ms this hour,{" "}
        <Delta value={-0.08} positive="down" title="vs the previous hour" /> from the hour before.
      </p>
    ),
    code: `<p>\n  API p95 latency held at 212ms this hour,{" "}\n  <Delta value={-0.08} positive="down" title="vs the previous hour" />{" "}\n  from the hour before.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {REGION_DELTAS.map((r) => (
            <tr key={r.region} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{r.region}</td>
              <td className="py-1.5 pr-3 text-right">{r.revenue}</td>
              <td className="py-1.5 text-right">
                <Delta value={r.value} title={`${r.region} vs last quarter`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  {region.revenue}\n  <Delta value={region.value} title={\`\${region.region} vs last quarter\`} />\n</td>`,
  },
  kpi: {
    render: () => (
      <div>
        <div className="text-fd-muted-foreground text-xs">Monthly recurring revenue</div>
        <div className="flex items-end gap-2">
          <span className="display text-3xl tabular-nums">$84.2k</span>
          <span className="mb-1 text-lg">
            <Delta value={0.124} title="vs last month" />
          </span>
        </div>
      </div>
    ),
    code: `<div className="kpi">\n  <span className="figure">$84.2k</span>\n  <Delta value={0.124} title="vs last month" />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s, i) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {s.name}
            <Delta value={s.value} positive={s.positive} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Growth <Delta value={0.124} />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <Delta value={0.124} summary={false} />;
}

export function markCode(): string {
  return `<Delta value={0.124} />`;
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
