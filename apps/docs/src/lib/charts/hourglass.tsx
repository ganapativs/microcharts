import { Hourglass } from "@microcharts/react/hourglass";
import { Hourglass as HourglassInteractive } from "@microcharts/react/hourglass/interactive";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Hourglass",
  slug: "hourglass",
  status: "stable",
  collection: "expressive",
  tagline: "How much time is gone and how much remains — both at once.",
  staticImport: `${PKG}/hourglass`,
  interactiveImport: `${PKG}/hourglass/interactive`,
  // The sand levels already cross-fade on value change (one-shot WAAPI
  // value-transition in client.tsx) — a mount entrance would fight that
  // existing motion, so this chart has no `animate` prop at all.
  animates: false,
  dataShape: "{ value: number }",
  encoding: { channel: "sand area split top (remaining) / bottom (elapsed)", precision: "medium" },
  nodeBudget: "4",
  bestFor: [
    "a deadline or session-expiry read in a sentence",
    "a TTL cell where remaining is the story",
    "a time-boxed tab or countdown",
  ],
  avoidFor: ["exact percentages (Progress)", "trends (Sparkline)", "non-time fractions"],
  props: [
    {
      name: "value",
      type: "number",
      required: true,
      description: "Elapsed fraction 0–1 (like Progress).",
    },
    {
      name: "stream",
      type: "boolean",
      required: false,
      description: "The running-sand cue (default true).",
    },
    {
      name: "label",
      type: '"none" | "remaining" | "elapsed"',
      required: false,
      description: "Print the percent that matters to the context.",
    },
  ],
  demo: [75],
  example: {
    title: "Session",
    code: `import { Hourglass } from "${PKG}/hourglass";\n\n<Hourglass value={0.75} title="Session" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      {[0.15, 0.4, 0.6, 0.85].map((v) => (
        <Hourglass key={v} value={v} summary={false} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "gone and remaining",
  Node: () => <Hourglass value={0.7} label="remaining" title="Session" height={28} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", label: "elapsed %", min: 0, max: 100, step: 1, init: 75 },
    {
      kind: "segmented",
      key: "label",
      label: "label",
      options: ["none", "remaining", "elapsed"],
      init: "none",
    },
    { kind: "toggle", key: "stream", label: "stream", init: true },
  ],
  render: (s) => (
    <Hourglass
      value={(s.value as number) / 100}
      label={s.label as "none" | "remaining" | "elapsed"}
      stream={s.stream as boolean}
      summary={false}
      height={64}
    />
  ),
  code: (s) =>
    [
      "<Hourglass",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.label !== "none" && `  label="${s.label}"`,
      s.stream === false && "  stream={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  // No `animate` prop exists on this chart (see entry.animates) — the sand
  // levels' own value-transition cross-fade is the only motion.
  renderInteractive: (s) => (
    <HourglassInteractive
      value={(s.value as number) / 100}
      label={s.label as "none" | "remaining" | "elapsed"}
      stream={s.stream as boolean}
      summary={false}
      height={64}
    />
  ),
  codeInteractive: (s) =>
    [
      "<Hourglass",
      `  value={${((s.value as number) / 100).toFixed(2)}}`,
      s.label !== "none" && `  label="${s.label}"`,
      s.stream === false && "  stream={false}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Tap to let more sand fall — the levels cross-fade (reduced-motion → they swap), and the total is announced only when it crosses a documented threshold (50 / 90 / 100%), never on every tick.",
  animates: false,
};

export const recipes: Recipe[] = [
  {
    label: "TTL cell — remaining is the story",
    code: `<Hourglass value={0.7} label="remaining" />`,
    node: <Hourglass value={0.7} label="remaining" summary={false} height={40} />,
  },
  {
    label: "finished is shape-distinct (no stream)",
    code: `<Hourglass value={1} />`,
    node: <Hourglass value={1} summary={false} height={40} />,
  },
];

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  const v = props.data.length ? (Math.abs(props.data[0]!) % 100) / 100 : 0.7;
  return <Hourglass value={v} summary={false} height={props.height ?? 24} />;
}

export function markCode(): string {
  return `<Hourglass value={0.7} />`;
}

export default {
  entry,
  Preview,
  showcase,
  playground,
  recipes,
  Mark,
  markCode,
} satisfies ChartModule;
