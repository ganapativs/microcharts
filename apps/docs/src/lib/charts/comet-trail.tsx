import { CometTrail } from "@microcharts/react/comet-trail";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const RISING = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];

export const entry: ChartEntry = {
  name: "CometTrail",
  slug: "comet-trail",
  status: "stable",
  collection: "expressive",
  tagline: "Where the value is now, and where it has just been.",
  staticImport: `${PKG}/comet-trail`,
  interactiveImport: `${PKG}/comet-trail/interactive`,
  // The easing head + opacity-fading trail IS the encoding (age is motion) —
  // a mount entrance would fight that live motion, so this chart has no
  // `animate` prop at all.
  animates: false,
  dataShape: "number[]",
  encoding: {
    channel: "head position (now) + opacity-fading positional trail",
    precision: "medium",
  },
  nodeBudget: "trail + 2",
  bestFor: [
    "a live price or metric with a little recency context",
    "a realtime KPI that should show momentum",
    "per-stream 'where is it now' in a table",
  ],
  avoidFor: [
    "the full history (Sparkline)",
    "an exact multi-point comparison (Sparkline / DotPlot)",
    "discrete events (HeartbeatBlip)",
  ],
  props: [
    {
      name: "data",
      type: "number[]",
      required: true,
      description: "The rolling window, oldest → newest (last = now).",
    },
    {
      name: "trail",
      type: "number",
      required: false,
      description: "Points kept visible (default 12, cap 20).",
    },
    {
      name: "label",
      type: '"last" | "none"',
      required: false,
      description: "Numeral after the head (default last).",
    },
  ],
  demo: RISING,
  example: {
    title: "Now",
    code: `import { CometTrail } from "${PKG}/comet-trail";\n\n<CometTrail data={rollingWindow} title="Latency" />`,
  },
  sampleData: [
    {
      name: "rollingWindow",
      code: `const rollingWindow = [40, 45, 50, 55, 60, 65, 70, 72, 75, 78, 80, 84, 87];`,
    },
  ],
};

export function Preview() {
  return <CometTrail data={RISING} summary={false} width={80} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "trail", label: "trail", min: 2, max: 20, step: 1, init: 12 },
    { kind: "segmented", key: "label", label: "label", options: ["last", "none"], init: "last" },
  ],
  render: (s) => (
    <CometTrail
      data={RISING}
      trail={s.trail as number}
      label={s.label as "last" | "none"}
      summary={false}
      width={180}
    />
  ),
  code: (s) =>
    [
      "<CometTrail",
      "  data={rollingWindow}",
      s.trail !== 12 && `  trail={${s.trail}}`,
      s.label !== "last" && `  label="${s.label}"`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "A live rolling value. The bright head is now; the fading trail is where it has just been (opacity is age, never value). Each update eases the head to the new position — a steady stream makes the comet, a stall goes still. Reduced-motion readers get the same decaying dot-sparkline, repositioned instantly.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "shorter trail for a table cell",
    code: `<CometTrail data={rollingWindow} trail={6} />`,
    node: <CometTrail data={RISING} trail={6} summary={false} width={100} />,
  },
  {
    label: "no label — the card prints the number",
    code: `<CometTrail data={rollingWindow} label="none" />`,
    node: <CometTrail data={RISING} label="none" summary={false} width={100} />,
  },
];

const STREAMS = [
  { name: "checkout-api", data: RISING, meta: "87 ms" },
  { name: "auth-api", data: [12, 13, 14, 15, 16, 17, 18, 19], meta: "19 ms" },
  { name: "search-api", data: [78, 79, 80, 81, 82, 83, 84, 85], meta: "85 ms" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        p95 latency is climbing{" "}
        <span className="mc-inline">
          <CometTrail data={RISING} label="none" summary={false} width={90} height={16} />
        </span>{" "}
        — now at 87, with the last hour of momentum visible.
      </p>
    ),
    code: '<p>\n  p95 latency is climbing{" "}\n  <span className="mc-inline">\n    <CometTrail data={rollingWindow} label="none" width={90} height={16} summary={false} />\n  </span>{" "}\n  — now at 87.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {STREAMS.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <CometTrail
                  data={s.data}
                  trail={6}
                  label="none"
                  summary={false}
                  width={72}
                  height={16}
                />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{s.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td><CometTrail data={rollingWindow} trail={6} label="none" width={72} height={16} /></td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">API latency</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">87</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">ms, now</span>
          </div>
        </div>
        <CometTrail data={RISING} summary={false} width={200} height={36} />
      </>
    ),
    code: '<div className="kpi"><span className="figure">87</span><CometTrail data={rollingWindow} width={200} height={36} /></div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {STREAMS.map((s, i) => (
          <span
            key={s.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {s.name.split("-")[0]}
            <CometTrail
              data={s.data}
              trail={5}
              label="none"
              summary={false}
              width={44}
              height={14}
            />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">checkout <CometTrail data={rollingWindow} trail={5} label="none" width={44} height={14} /></button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const vals = props.data.length ? props.data : RISING;
  return (
    <CometTrail
      data={vals}
      summary={false}
      label="none"
      width={props.width ?? 60}
      height={props.height ?? 16}
    />
  );
}

export function markCode(): string {
  return `<CometTrail data={rollingWindow} />`;
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
