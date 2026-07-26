import { StatusDot } from "@microcharts/react/status-dot";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

type Service = { name: string; status: string };
/** Ordered so the cell home's first three rows show real variety. */
const SERVICES: Service[] = [
  { name: "API", status: "ok" },
  { name: "Billing", status: "warn" },
  { name: "Search", status: "error" },
  { name: "Auth", status: "ok" },
  { name: "CDN", status: "off" },
];
const SERVICE_COPY: Record<string, string> = {
  ok: "operational",
  warn: "degraded",
  error: "down",
  off: "disabled",
  busy: "deploying",
};
const ENVIRONMENTS: Service[] = [
  { name: "Production", status: "ok" },
  { name: "Staging", status: "busy" },
];

export const entry: ChartEntry = {
  name: "StatusDot",
  slug: "status-dot",
  status: "stable",
  collection: "core",
  tagline: "What state is this thing in: shape and color paired, never color alone.",
  staticImport: `${PKG}/status-dot`,
  interactiveImport: `${PKG}/status-dot/interactive`,
  picker: false,
  // The glyph prints (or IS) its own reading — a hover chip would duplicate it.
  readout: false,
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
  interactiveHint: "Cycle the state — each change is announced politely with its label.",
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

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Checkout is{" "}
        <span className="mc-inline">
          <StatusDot status="ok" summary={false} style={{ width: "0.7em", height: "0.7em" }} />
        </span>{" "}
        operational; Billing is{" "}
        <span className="mc-inline">
          <StatusDot status="warn" summary={false} style={{ width: "0.7em", height: "0.7em" }} />
        </span>{" "}
        degraded.
      </p>
    ),
    code: `<p>\n  Checkout is{" "}\n  <span className="mc-inline">\n    <StatusDot status="ok" style={{ width: "0.7em", height: "0.7em" }} summary={false} />\n  </span>{" "}\n  operational; Billing is{" "}\n  <span className="mc-inline">\n    <StatusDot status="warn" style={{ width: "0.7em", height: "0.7em" }} summary={false} />\n  </span>{" "}\n  degraded.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {SERVICES.slice(0, 3).map((svc) => (
            <tr key={svc.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{svc.name}</td>
              <td className="py-1.5">
                <StatusDot status={svc.status} summary={false} style={{ width: 14, height: 14 }} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">
                {SERVICE_COPY[svc.status]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <StatusDot status="warn" />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Service health</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">2 / 5</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">fully healthy</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5">
          {SERVICES.map((svc) => (
            <StatusDot
              key={svc.name}
              status={svc.status}
              summary={false}
              style={{ width: 12, height: 12 }}
            />
          ))}
        </span>
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">2 / 5</span>\n  <span className="unit">fully healthy</span>\n  <StatusDot status="ok" />\n  <StatusDot status="warn" />\n  <StatusDot status="error" />\n  <StatusDot status="ok" />\n  <StatusDot status="off" />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {ENVIRONMENTS.map((env, i) => (
          <span
            key={env.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {env.name}
            <StatusDot
              status={env.status}
              pulse={env.status === "busy"}
              summary={false}
              style={{ width: 10, height: 10 }}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Staging <StatusDot status="busy" pulse />\n</button>`,
  },
};

export function Mark(_props: { data: number[]; width?: number; height?: number }) {
  return <StatusDot status="ok" summary={false} style={{ width: 10, height: 10 }} />;
}

export function markCode(): string {
  return `<StatusDot status="ok" />`;
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
