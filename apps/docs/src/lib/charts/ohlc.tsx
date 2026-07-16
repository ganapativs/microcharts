import { Ohlc } from "@microcharts/react/ohlc";
import { Ohlc as OhlcInteractive } from "@microcharts/react/ohlc/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

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
  tagline: "Price action per period: open, high, low, close in a cell.",
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
    code: `import { Ohlc } from "${PKG}/ohlc";\n\n<Ohlc data={sessions} title="ACME sessions" />`,
  },
  sampleData: [
    {
      name: "sessions",
      code: `const sessions = Array.from({ length: 20 }, (_, i) => {
  const base = 140 + Math.sin(i / 3) * 8 + i * 0.6;
  return {
    open: Math.round(base * 10) / 10,
    high: Math.round((base + 3 + (i % 3)) * 10) / 10,
    low: Math.round((base - 3 - (i % 2)) * 10) / 10,
    close: Math.round((base + (i % 2 === 0 ? 2 : -1.5)) * 10) / 10,
  };
});`,
    },
  ],
};

export function Preview() {
  return <Ohlc data={PERIODS} summary={false} width={140} height={24} />;
}

export const showcase = {
  hint: "price action",
  Node: () => <Ohlc data={PERIODS} title="ACME 20 sessions" width={140} height={24} />,
};

// domain/format/locale/strings/title/summary/id/className/style/children:
// styling/formatting escape hatches or accessible-name overrides — no

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
    { kind: "range", key: "maxPeriods", label: "max periods", min: 5, max: 20, init: 20 },
  ],
  render: (s) => (
    <Ohlc
      data={PERIODS}
      variant={s.variant as "candle" | "bars"}
      label={s.label as "last" | "none"}
      maxPeriods={s.maxPeriods as number}
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
      s.maxPeriods !== 20 && `  maxPeriods={${s.maxPeriods}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <OhlcInteractive
      data={PERIODS}
      variant={s.variant as "candle" | "bars"}
      label={s.label as "last" | "none"}
      maxPeriods={s.maxPeriods as number}
      animate={ui.animate}
      summary={false}
      width={280}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Ohlc",
      "  data={sessions}",
      s.variant !== "candle" && `  variant="${s.variant}"`,
      s.label !== "none" && `  label="${s.label}"`,
      s.maxPeriods !== 20 && `  maxPeriods={${s.maxPeriods}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow through the sessions — each announces open, high, low, and close.",
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

const WATCHLIST: { symbol: string; sessions: typeof PERIODS }[] = [
  {
    symbol: "ACME",
    sessions: [
      { open: 140, high: 144, low: 138, close: 143 },
      { open: 143, high: 147, low: 141, close: 146 },
      { open: 146, high: 150, low: 144, close: 145 },
      { open: 145, high: 149, low: 143, close: 148 },
      { open: 148, high: 152, low: 146, close: 150 },
      { open: 150, high: 154, low: 148, close: 153 },
    ],
  },
  {
    symbol: "ORBIT",
    sessions: [
      { open: 64, high: 66, low: 60, close: 61 },
      { open: 61, high: 63, low: 58, close: 59 },
      { open: 59, high: 61, low: 55, close: 56 },
      { open: 56, high: 58, low: 52, close: 53 },
      { open: 53, high: 55, low: 50, close: 51 },
      { open: 51, high: 53, low: 47, close: 48 },
    ],
  },
  {
    symbol: "VESTA",
    sessions: [
      { open: 22, high: 23, low: 21, close: 22 },
      { open: 22, high: 24, low: 21, close: 23 },
      { open: 23, high: 24, low: 21, close: 22 },
      { open: 22, high: 23, low: 20, close: 21 },
      { open: 21, high: 23, low: 20, close: 22 },
      { open: 22, high: 23, low: 21, close: 22 },
    ],
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        ACME closed the session at{" "}
        <span className="mc-inline">
          <Ohlc data={PERIODS} summary={false} width={90} height={14} />
        </span>{" "}
        $150.30, up 7.4% over 20 sessions.
      </p>
    ),
    code: `<p>\n  ACME closed the session at{" "}\n  <Ohlc data={sessions} width={90} height={14} /> $150.30, up 7.4% over 20 sessions.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {WATCHLIST.map((t) => (
            <tr key={t.symbol}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{t.symbol}</td>
              <td className="py-1.5">
                <Ohlc data={t.sessions} summary={false} width={70} height={16} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {t.symbol === "ACME" ? "up 9.3%" : t.symbol === "ORBIT" ? "down 25.0%" : "flat"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <Ohlc data={ticker.sessions} title={ticker.symbol} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">ACME · last close</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">$150.30</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">up 7.4% over 20 sessions</span>
          </div>
        </div>
        <Ohlc data={PERIODS} summary={false} width={200} height={26} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">$150.30</span>\n  <span className="unit">up 7.4% over 20 sessions</span>\n  <Ohlc data={sessions} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {WATCHLIST.slice(0, 2).map((t, i) => (
          <span
            key={t.symbol}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {t.symbol}
            <Ohlc data={t.sessions} summary={false} width={40} height={12} />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  ACME <Ohlc data={ticker.sessions} />\n</button>`,
  },
};

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

export function PreviewLive() {
  return <OhlcInteractive data={PERIODS} summary={false} width={140} height={24} animate />;
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
