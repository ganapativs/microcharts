import { Ohlc } from "@microcharts/react/ohlc";
import { InteractiveDemo } from "./ohlc.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const PERIODS = Array.from({ length: 20 }, (_, i) => {
  const base = 140 + Math.sin(i / 3) * 8 + i * 0.6;
  return {
    open: Math.round(base * 10) / 10,
    high: Math.round((base + 3 + (i % 3)) * 10) / 10,
    low: Math.round((base - 3 - (i % 2)) * 10) / 10,
    close: Math.round((base + (i % 2 === 0 ? 2 : -1.5)) * 10) / 10,
  };
});

export const entry: ChartEntry = {
  name: "Ohlc",
  slug: "ohlc",
  status: "stable",
  collection: "core",
  tagline: "Price action per period — open, high, low, close in a cell.",
  staticImport: `${PKG}/ohlc`,
  interactiveImport: `${PKG}/ohlc/interactive`,
  dataShape: "{ open, high, low, close }[] per period, oldest first",
  encoding: {
    channel: "candle body span + wick extent on a shared price scale",
    precision: "medium — hover announces the exact four prices",
  },
  nodeBudget: "≤ 40 (~2 nodes per candle, ≤ 20 periods)",
  bestFor: ["watchlist table rows", "ticker KPI cards"],
  avoidFor: ["a single close series (Sparkline)", "more than ~20 periods"],
  props: [
    {
      name: "data",
      type: "{ open; high; low; close }[]",
      required: true,
      description: "Periods, oldest first.",
    },
    {
      name: "variant",
      type: '"candle" | "bars"',
      required: false,
      description: "Candle bodies or open/close ticks.",
    },
    {
      name: "maxPeriods",
      type: "number",
      required: false,
      description: "Renders the most recent N (never averaged).",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Last close in a right gutter.",
    },
  ],
  demo: PERIODS.map((p) => p.close),
  example: {
    title: "ACME sessions",
    code: `import { Ohlc } from "${PKG}/ohlc";

const sessions = [
  { open: 140.1, high: 143.4, low: 137.2, close: 142.3 },
  { open: 142.6, high: 146.8, low: 141.0, close: 144.9 },
  { open: 144.5, high: 145.2, low: 140.1, close: 141.4 },
  { open: 141.1, high: 144.7, low: 139.5, close: 143.8 },
  { open: 143.9, high: 148.2, low: 142.8, close: 147.5 },
  { open: 147.2, high: 149.9, low: 144.6, close: 145.9 },
];

<Ohlc data={sessions} title="ACME sessions" />`,
  },
};

export function Preview() {
  return <Ohlc data={PERIODS} summary={false} width={140} height={24} />;
}

export const showcase = {
  hint: "price action",
  Node: () => <Ohlc data={PERIODS} title="ACME 20 sessions" width={140} height={24} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["candle", "bars"],
      init: "candle",
    },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "last"],
      init: "none",
    },
  ],
  render: (s) => (
    <Ohlc
      data={PERIODS}
      variant={s.variant as "candle" | "bars"}
      label={s.label as "last" | "none"}
      summary={false}
      width={280}
      height={32}
    />
  ),
  code: (s) =>
    [
      "<Ohlc",
      "  data={sessions}",
      s.variant !== "candle" && `  variant="${s.variant}"`,
      s.label !== "none" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "watchlist rows",
    code: `{tickers.map((t) => (\n  <Ohlc key={t.symbol} data={t.sessions} title={t.symbol} />\n))}`,
    node: <Ohlc data={PERIODS} summary={false} width={160} height={18} />,
  },
  {
    label: "bars with last close",
    code: `<Ohlc data={sessions} variant="bars" label="last" />`,
    node: (
      <Ohlc data={PERIODS} variant="bars" label="last" summary={false} width={170} height={20} />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <Ohlc
      data={props.data.map((v, j) => ({
        open: v + 10,
        high: v + 12 + (j % 3),
        low: v + 8 - (j % 2),
        close: v + 9 + (j % 4),
      }))}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<Ohlc data={sessions} />`;
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
