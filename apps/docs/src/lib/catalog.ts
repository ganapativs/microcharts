/**
 * The chart registry — single source of truth for the shipped catalog.
 *
 * Drives the machine catalog (`/microcharts.catalog.json`), the gallery, doc
 * cross-links, and the curated `/llms.txt`. Import paths here are validated
 * against `@microcharts/react`'s `package.json#exports` by a docs test
 * (plan/20 §5.3 acceptance).
 */

export type ChartStatus = "stable" | "planned";

export interface ChartProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ChartEntry {
  name: string;
  slug: string;
  status: ChartStatus;
  /** One line, direct — what decision it answers. */
  tagline: string;
  staticImport: string;
  interactiveImport?: string;
  dataShape: string;
  primaryEncoding: string;
  bestFor: string[];
  avoidFor: string[];
  props: ChartProp[];
  /** A representative series/values used for live demos + OG + summary quoting. */
  demo: number[];
  example: { title: string; code: string };
}

const PKG = "@microcharts/react";

export const CHARTS: ChartEntry[] = [
  {
    name: "Sparkline",
    slug: "sparkline",
    status: "stable",
    tagline: "A trend over ordered values, small enough to sit in a sentence.",
    staticImport: `${PKG}/sparkline`,
    interactiveImport: `${PKG}/sparkline/interactive`,
    dataShape: "number[]",
    primaryEncoding: "position (length along a line)",
    bestFor: ["inline trend", "table-cell trend", "KPI sparkline", "dense dashboards"],
    avoidFor: ["part-to-whole", "exact category comparison"],
    props: [
      {
        name: "data",
        type: "number[]",
        required: true,
        description: "The series. null/NaN are gaps.",
      },
      {
        name: "curve",
        type: '"linear" | "smooth" | "step"',
        required: false,
        description: "Line shape.",
      },
      {
        name: "fill",
        type: "boolean",
        required: false,
        description: "Zero-anchored area under the line.",
      },
      {
        name: "band",
        type: "[number, number]",
        required: false,
        description: "Constant normal-range band.",
      },
      {
        name: "dots",
        type: '"auto" | "minmax" | "none"',
        required: false,
        description: "Endpoint or min/max dots.",
      },
      {
        name: "label",
        type: '"none" | "last"',
        required: false,
        description: "Direct endpoint value label.",
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
    ],
    demo: [3, 5, 4, 8, 6, 9, 7, 11, 10, 14],
    example: {
      title: "Weekly revenue",
      code: `import { Sparkline } from "${PKG}/sparkline";\n\n<Sparkline data={[3, 5, 4, 8, 6, 9]} title="Weekly revenue" />`,
    },
  },
  {
    name: "SparkBar",
    slug: "sparkbar",
    status: "stable",
    tagline: "Compact bars for magnitude, or a win–loss streak of outcomes.",
    staticImport: `${PKG}/sparkbar`,
    interactiveImport: `${PKG}/sparkbar/interactive`,
    dataShape: "number[]",
    primaryEncoding: "length (bar height from a zero baseline)",
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
        description: "Magnitude bars or binary streak.",
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
    ],
    demo: [4, 6, 2, 8, 5, 9, 3, 7],
    example: {
      title: "Deploys per day",
      code: `import { SparkBar } from "${PKG}/sparkbar";\n\n<SparkBar data={[4, 6, 2, 8, 5, 9]} title="Deploys per day" />`,
    },
  },
  {
    name: "Delta",
    slug: "delta",
    status: "stable",
    tagline: "A signed change, double-encoded by glyph and color.",
    staticImport: `${PKG}/delta`,
    interactiveImport: `${PKG}/delta/interactive`,
    dataShape: "number (+ optional from)",
    primaryEncoding: "text + direction glyph (▲/▼)",
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
  },
  {
    name: "Bullet",
    slug: "bullet",
    status: "stable",
    tagline: "A measure against a target and qualitative bands.",
    staticImport: `${PKG}/bullet`,
    interactiveImport: `${PKG}/bullet/interactive`,
    dataShape: "value + target + bands",
    primaryEncoding: "position (measure length vs a target tick)",
    bestFor: ["progress to goal", "SLA / budget vs target", "KPI with thresholds"],
    avoidFor: ["trends over time", "distributions"],
    props: [
      { name: "value", type: "number", required: true, description: "The measured value." },
      {
        name: "target",
        type: "number",
        required: false,
        description: "Target tick to compare against.",
      },
      {
        name: "bands",
        type: "number[]",
        required: false,
        description: "Ascending qualitative thresholds.",
      },
      {
        name: "domain",
        type: "[number, number]",
        required: false,
        description: "Explicit [0, max]; auto-fit otherwise.",
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
    ],
    demo: [72],
    example: {
      title: "Quota attainment",
      code: `import { Bullet } from "${PKG}/bullet";\n\n<Bullet value={72} target={80} bands={[50, 90]} title="Quota" />`,
    },
  },
  {
    name: "ActivityGrid",
    slug: "activity-grid",
    status: "stable",
    tagline: "Calendar or matrix intensity — the contribution-graph shape.",
    staticImport: `${PKG}/activity-grid`,
    interactiveImport: `${PKG}/activity-grid/interactive`,
    dataShape: "number[]",
    primaryEncoding: "color intensity (discrete levels) over a grid",
    bestFor: ["daily activity", "streaks and cadence", "seasonality at a glance"],
    avoidFor: ["exact values", "precise comparison between two cells"],
    props: [
      {
        name: "data",
        type: "number[]",
        required: true,
        description: "Ordered values, one per cell.",
      },
      {
        name: "layout",
        type: '"grid" | "strip"',
        required: false,
        description: "7-row calendar or single strip.",
      },
      {
        name: "cell",
        type: "number",
        required: false,
        description: "Cell edge length in viewBox units.",
      },
      {
        name: "domain",
        type: "[number, number]",
        required: false,
        description: "Explicit range for level bucketing.",
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
    ],
    demo: [0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3],
    example: {
      title: "Commits this month",
      code: `import { ActivityGrid } from "${PKG}/activity-grid";\n\n<ActivityGrid data={commitCounts} title="Commits" />`,
    },
  },
];

export function getChart(slug: string): ChartEntry | undefined {
  return CHARTS.find((c) => c.slug === slug);
}

export const STABLE_CHARTS = CHARTS.filter((c) => c.status === "stable");
