import { MinimapStrip } from "@microcharts/react/minimap-strip";
import { MinimapStrip as MinimapStripInteractive } from "@microcharts/react/minimap-strip/interactive";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const CONTENT = Array.from(
  { length: 1200 },
  (_, i) => Math.abs(Math.sin(i / 40)) + Math.abs(Math.sin(i / 150)) * 0.6,
);
export const DATA = {
  content: CONTENT,
  window: [520, 660] as [number, number],
  marks: [100, 600, 1100],
  known: [[0, 1104]] as [number, number][],
};

export const entry: ChartEntry = {
  name: "MinimapStrip",
  slug: "minimap-strip",
  status: "stable",
  collection: "frontier",
  tagline: "Where am I in the whole — and where in the whole is everything else I care about.",
  staticImport: `${PKG}/minimap-strip`,
  interactiveImport: `${PKG}/minimap-strip/interactive`,
  dataShape: "{ content, window, marks?, known? }",
  encoding: { channel: "position (window + marks along the extent)", precision: "high / low" },
  nodeBudget: "≤ 5",
  bestFor: ["document / log position", "long-timeline navigation"],
  avoidFor: ["a single value (Progress)", "exact content values (Sparkline)"],
  props: [
    {
      name: "data",
      type: "{ content, window, marks?, known? }",
      required: true,
      description: "Density series, viewport, ticks, covered regions.",
    },
    {
      name: "variant",
      type: '"bars" | "heat"',
      required: false,
      description: "Heat is a calmer opacity strip.",
    },
    {
      name: "markLane",
      type: "boolean",
      required: false,
      description: "Dedicated tick lane vs overlaying ticks.",
    },
    {
      name: "onWindowChange",
      type: "(window: [number, number]) => void",
      required: false,
      interactive: true,
      description: "Fires with the new `[start, end]` index range as the brush window is dragged.",
    },
  ],
  demo: [12],
  example: {
    title: "Document position",
    code: `import { MinimapStrip } from "${PKG}/minimap-strip";

<MinimapStrip
  data={{
    content: Array.from(
      { length: 1200 },
      (_, i) => Math.abs(Math.sin(i / 40)) + Math.abs(Math.sin(i / 150)) * 0.6,
    ),
    window: [520, 660],
    marks: [100, 600, 1100],
    known: [[0, 1104]],
  }}
  title="Document position"
/>`,
  },
};

export function Preview() {
  return <MinimapStrip data={DATA} summary={false} width={130} height={16} />;
}

export const showcase = {
  hint: "position",
  Node: () => <MinimapStrip data={DATA} title="Document position" width={130} height={16} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "variant",
      label: "variant",
      options: ["bars", "heat"],
      init: "bars",
    },
    { kind: "toggle", key: "markLane", label: "mark lane", init: true },
    { kind: "range", key: "window", label: "window at", min: 0, max: 1060, step: 20, init: 520 },
  ],
  render: (s) => (
    <MinimapStrip
      data={{ ...DATA, window: [s.window as number, (s.window as number) + 140] }}
      variant={s.variant as "bars" | "heat"}
      markLane={s.markLane as boolean}
      summary={false}
      width={320}
      height={20}
    />
  ),
  code: (s) =>
    [
      "<MinimapStrip",
      `  data={{ content, window: [${s.window}, ${(s.window as number) + 140}], marks, known }}`,
      s.variant !== "bars" && `  variant="${s.variant}"`,
      s.markLane === false && "  markLane={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  renderInteractive: (s, _data, ui) => (
    <MinimapStripInteractive
      data={{ ...DATA, window: [s.window as number, (s.window as number) + 140] }}
      variant={s.variant as "bars" | "heat"}
      markLane={s.markLane as boolean}
      animate={ui.animate}
      summary={false}
      width={320}
      height={20}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MinimapStrip",
      `  data={{ content, window: [${s.window}, ${(s.window as number) + 140}], marks, known }}`,
      s.variant !== "bars" && `  variant="${s.variant}"`,
      s.markLane === false && "  markLane={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Drag or click to move the viewport window; ←/→ nudge it (Shift for a bigger jump).",
};

export const recipes: Recipe[] = [
  {
    label: "log viewer cell",
    code: `<MinimapStrip data={{ content, window }} width={80} height={12} />`,
    node: <MinimapStrip data={DATA} summary={false} width={80} height={12} />,
  },
  {
    label: "heat",
    code: `<MinimapStrip data={data} variant="heat" />`,
    node: <MinimapStrip data={DATA} variant="heat" summary={false} width={220} height={16} />,
  },
];

const mkMinimap = (pct: number) =>
  ({
    content: CONTENT,
    window: [Math.round(pct * 1200 - 70), Math.round(pct * 1200 + 70)] as [number, number],
    marks: [100, 600, 1100],
    known: [[0, 1104]] as [number, number][],
  }) as typeof DATA;

const CTX_ROWS = [
  { name: "error.log", meta: "55%", data: mkMinimap(0.55) },
  { name: "access.log", meta: "12%", data: mkMinimap(0.12) },
  { name: "audit.log", meta: "88%", data: mkMinimap(0.88) },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Scroll position in log{" "}
        <span className="mc-inline">
          <MinimapStrip data={DATA} height={16} summary={false} />
        </span>{" "}
        — at line 660 of 1,200, dense middle section.
      </p>
    ),
    code: "<p>\n  Scroll position in log <MinimapStrip data={{ content, window, marks, known }} /> — at line 660 of 1,200, dense middle section.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <MinimapStrip data={row.data} height={18} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td>\n  <MinimapStrip data={{ content, window, marks, known }} />\n</td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Position</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">55%</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">through document</span>
          </div>
        </div>
        <MinimapStrip data={CTX_ROWS[0]!.data} height={36} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">55%</span>\n  <span className="unit">through document</span>\n  <MinimapStrip data={{ content, window, marks, known }} />\n</div>',
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
            <MinimapStrip data={row.data} height={14} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  Errors <MinimapStrip data={{ content, window, marks, known }} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MinimapStrip
      data={DATA}
      summary={false}
      width={props.width ?? 80}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<MinimapStrip data={{ content, window, marks, known }} />`;
}

export function PreviewLive() {
  return <MinimapStripInteractive data={DATA} summary={false} width={130} height={16} animate />;
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
