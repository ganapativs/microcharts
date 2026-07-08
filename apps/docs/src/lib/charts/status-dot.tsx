import { StatusDot } from "@microcharts/react/status-dot";
import { InteractiveDemo } from "./status-dot.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "StatusDot",
  slug: "status-dot",
  status: "stable",
  collection: "core",
  tagline: "What state is this thing in — shape and color paired, never color alone.",
  staticImport: `${PKG}/status-dot`,
  interactiveImport: `${PKG}/status-dot/interactive`,
  dataShape: '"ok" | "warn" | "error" | "off" | "busy" (extensible)',
  encoding: { channel: "paired glyph shape + semantic color", precision: "n/a — categorical" },
  nodeBudget: "≤ 2 (mark + optional pulse halo)",
  bestFor: ["service lists", "inline state in a sentence", "monitoring rows"],
  avoidFor: ["quantities", "trends", "more than ~6 state kinds"],
  props: [
    {
      name: "status",
      type: "string",
      required: true,
      description: "Built-in ok | warn | error | off | busy, or a key of states.",
    },
    {
      name: "pulse",
      type: "boolean",
      required: false,
      description: "Live-now halo (reduced-motion-gated).",
    },
    {
      name: "states",
      type: "Record<string, { glyph; token; label }>",
      required: false,
      description: "Extend the vocabulary; the shape+color pairing is preserved.",
    },
    {
      name: "color",
      type: "string",
      required: false,
      description: "Recolors the active state; never reshapes it.",
    },
  ],
  demo: [1],
  example: {
    title: "Service state",
    code: `import { StatusDot } from "${PKG}/status-dot";\n\n<StatusDot status="ok" title="API" />`,
  },
};

export function Preview() {
  return (
    <span className="inline-flex items-center gap-3">
      {(["ok", "warn", "error", "off", "busy"] as const).map((s) => (
        <StatusDot key={s} status={s} summary={false} style={{ width: 14, height: 14 }} />
      ))}
    </span>
  );
}

export const showcase = {
  hint: "state",
  Node: () => <StatusDot status="busy" pulse title="Pipeline" style={{ width: 18, height: 18 }} />,
};

export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "status",
      label: "status",
      options: ["ok", "warn", "error", "off", "busy"],
      init: "ok",
    },
    { kind: "toggle", key: "pulse", label: "pulse", init: false },
  ],
  render: (s) => (
    <StatusDot
      status={s.status as string}
      pulse={s.pulse as boolean}
      summary={false}
      style={{ width: 40, height: 40 }}
    />
  ),
  code: (s) =>
    ["<StatusDot", `  status="${s.status}"`, (s.pulse as boolean) && "  pulse", "/>"]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "inline in a sentence",
    code: `// em-sized, it sits on the text midline\nThe API is <StatusDot status="ok" style={{ width: "0.6em", height: "0.6em" }} /> operational.`,
    node: (
      <span>
        The API is{" "}
        <StatusDot status="ok" summary={false} style={{ width: "0.6em", height: "0.6em" }} />{" "}
        operational.
      </span>
    ),
  },
  {
    label: "custom vocabulary",
    code: `<StatusDot\n  status="degraded"\n  states={{ degraded: { glyph: "triangle", token: "--mc-cat-1", label: "degraded" } }}\n/>`,
    node: (
      <StatusDot
        status="degraded"
        states={{ degraded: { glyph: "triangle", token: "--mc-cat-1", label: "degraded" } }}
        summary={false}
        style={{ width: 16, height: 16 }}
      />
    ),
  },
];

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <StatusDot status="ok" summary={false} style={{ width: 10, height: 10 }} />;
}

export function markCode(): string {
  return `<StatusDot status="ok" />`;
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
