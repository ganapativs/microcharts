import { ErrorBudget } from "@microcharts/react/error-budget";
import { ErrorBudget as ErrorBudgetInteractive } from "@microcharts/react/error-budget/interactive";
import { InteractiveDemo } from "./error-budget.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
// 12 days into a 30-day SLO window, burning slightly under the steady rate
export const DEMO = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];
export const WINDOW = 30;
// a window that burns out early (fast-burn incident)
export const BURNED = [1, 0.82, 0.6, 0.38, 0.18, 0.04, 0];

export const entry: ChartEntry = {
  name: "ErrorBudget",
  slug: "error-budget",
  status: "stable",
  collection: "decision",
  tagline: "Are we burning the error budget too fast to survive the window?",
  staticImport: `${PKG}/error-budget`,
  interactiveImport: `${PKG}/error-budget/interactive`,
  dataShape: "number[] — budget remaining (0–1) per elapsed step; index 0 = 1.0",
  encoding: {
    channel: "remaining-line position vs the steady-burn diagonal",
    precision: "high — position against the pace that exactly spends the window",
  },
  nodeBudget: "≤ 8",
  bestFor: [
    "an SLO error budget in a KPI card",
    "a service list where each row is a budget",
    "spotting a fast-burn before it exhausts the window",
  ],
  avoidFor: ["a plain uptime series (Sparkline)", "one-number budget (Progress)"],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "Budget remaining (0–1) per elapsed step; index 0 is 1.0.",
    },
    {
      name: "window",
      type: "number",
      required: false,
      description: "Total steps in the SLO window (default = data.length).",
    },
    {
      name: "rates",
      type: "number[]",
      required: false,
      description: "Burn-rate reference multiples (default the SRE 1×/6×/14.4× convention).",
    },
    {
      name: "label",
      type: '"remaining" | "none"',
      required: false,
      description: "Current budget % in a right gutter.",
    },
  ],
  demo: DEMO,
  example: {
    title: "Checkout SLO",
    code: `import { ErrorBudget } from "${PKG}/error-budget";

const remaining = [1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62];

<ErrorBudget data={remaining} window={30} title="Checkout SLO" />`,
  },
};

export function Preview() {
  return <ErrorBudget data={DEMO} window={WINDOW} summary={false} width={150} height={26} />;
}

export const showcase = {
  hint: "budget vs steady burn",
  Node: () => (
    <ErrorBudget
      data={DEMO}
      window={WINDOW}
      unit="day"
      title="Checkout SLO"
      width={150}
      height={26}
    />
  ),
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "toggle", key: "wedges", label: "burn-rate lines", init: true },
    { kind: "toggle", key: "exhausted", label: "fast-burn", init: false },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "remaining"],
      init: "remaining",
    },
  ],
  render: (s) => (
    <ErrorBudget
      data={s.exhausted ? BURNED : DEMO}
      window={s.exhausted ? 20 : WINDOW}
      rates={s.wedges ? undefined : [1]}
      label={s.label as "remaining" | "none"}
      unit="day"
      summary={false}
      width={280}
      height={30}
    />
  ),
  code: (s) =>
    [
      "<ErrorBudget",
      "  data={remaining}",
      "  window={30}",
      s.wedges === false && "  rates={[1]}",
      s.label !== "remaining" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <ErrorBudgetInteractive
      data={s.exhausted ? BURNED : DEMO}
      window={s.exhausted ? 20 : WINDOW}
      rates={s.wedges ? undefined : [1]}
      label={s.label as "remaining" | "none"}
      unit="day"
      animate={ui.animate}
      summary={false}
      width={280}
      height={30}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<ErrorBudget",
      "  data={remaining}",
      "  window={30}",
      s.wedges === false && "  rates={[1]}",
      s.label !== "remaining" && `  label="${s.label}"`,
      ui.animate && "  animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow across the days — each announces the budget remaining and the current burn rate.",
};

export const recipes: Recipe[] = [
  {
    label: "fast-burn exhausts the window",
    code: `<ErrorBudget data={[1, 0.82, 0.6, 0.38, 0.18, 0.04, 0]} window={20} />`,
    node: <ErrorBudget data={BURNED} window={20} summary={false} width={170} height={26} />,
  },
  {
    label: "diagonal only (quietest form)",
    code: `<ErrorBudget
  data={[1, 0.96, 0.93, 0.9, 0.86, 0.83, 0.79, 0.75, 0.71, 0.67, 0.64, 0.62]}
  rates={[1]}
/>`,
    node: (
      <ErrorBudget
        data={DEMO}
        window={WINDOW}
        rates={[1]}
        summary={false}
        width={170}
        height={26}
      />
    ),
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const norm = props.data.map((v, k, a) =>
    Math.max(0, 1 - k / a.length - (Math.abs(v) % 3) * 0.03),
  );
  return (
    <ErrorBudget
      data={norm}
      summary={false}
      width={props.width ?? 70}
      height={props.height ?? 18}
    />
  );
}

export function markCode(): string {
  return `<ErrorBudget data={remaining} window={30} />`;
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
