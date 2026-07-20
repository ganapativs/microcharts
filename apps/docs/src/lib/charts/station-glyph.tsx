import { StationGlyph } from "@microcharts/react/station-glyph";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const OBS = {
  cloud: 0.75,
  wind: { direction: 225, magnitude: 15 },
  temp: 16,
  dewpoint: 9,
  pressure: 1013,
  station: "KSFO",
} as const;

export const entry: ChartEntry = {
  name: "StationGlyph",
  slug: "station-glyph",
  status: "stable",
  collection: "frontier",
  tagline:
    "A whole weather observation in one character: sky, wind, temperature, dew point, pressure.",
  staticImport: `${PKG}/station-glyph`,
  interactiveImport: `${PKG}/station-glyph/interactive`,
  dataShape: "cloud, wind{ direction, magnitude }, temp, dewpoint, pressure, station",
  encoding: {
    channel: "disc fill = sky cover; barb = wind; corner numerals = temp / dew / pressure",
    precision: "high",
  },
  nodeBudget: "1 disc + 1 sector + 1 barb + ≤3 numerals",
  bestFor: ["a dense weather station model", "any multi-field reading that must fit one cell"],
  avoidFor: ["a single value (Delta)", "a trend over time (Sparkline)"],
  props: [
    {
      name: "cloud",
      type: "number",
      required: false,
      description: "Sky cover 0–1; fills the disc.",
    },
    {
      name: "wind",
      type: "{ direction, magnitude }",
      required: false,
      description: "Barb direction + speed.",
    },
    {
      name: "step",
      type: "number",
      required: false,
      description: "Wind-barb quantum — each full barb (default 10).",
    },
    { name: "temp", type: "number", required: false, description: "Upper-left numeral." },
    { name: "dewpoint", type: "number", required: false, description: "Lower-left numeral." },
    { name: "pressure", type: "number", required: false, description: "Upper-right numeral." },
    { name: "station", type: "string", required: false, description: "Top-left identifier." },
  ],
  demo: [16],
  example: {
    title: "Station model",
    code: `import { StationGlyph } from "${PKG}/station-glyph";\n\n<StationGlyph\n  station="KSFO"\n  cloud={0.75}\n  wind={{ direction: 225, magnitude: 15 }}\n  temp={16}\n  dewpoint={9}\n  pressure={1013}\n/>`,
  },
};

export function Preview() {
  return <StationGlyph {...OBS} summary={false} size={48} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "cloud", label: "sky cover", min: 0, max: 1, step: 0.05, init: 0.75 },
    { kind: "range", key: "direction", label: "wind dir", min: 0, max: 360, step: 15, init: 225 },
    { kind: "range", key: "magnitude", label: "wind speed", min: 0, max: 60, step: 5, init: 15 },
  ],
  render: (s) => (
    <StationGlyph
      station="KSFO"
      cloud={s.cloud as number}
      wind={{ direction: s.direction as number, magnitude: s.magnitude as number }}
      temp={16}
      dewpoint={9}
      pressure={1013}
      summary={false}
      size={44}
    />
  ),
  code: (s) =>
    [
      "<StationGlyph",
      '  station="KSFO"',
      `  cloud={${s.cloud}}`,
      `  wind={{ direction: ${s.direction}, magnitude: ${s.magnitude} }}`,
      "  temp={16}",
      "  dewpoint={9}",
      "  pressure={1013}",
      "/>",
    ].join("\n"),
  interactiveHint:
    "Focus the glyph and use ←/→ to step through each field — station, wind, sky, temperature, dew point, pressure — announced one at a time. Home reads the whole observation.",
};

export const recipes: Recipe[] = [
  {
    label: "clear + calm",
    code: `<StationGlyph station="STN" cloud={0} wind={{ direction: 0, magnitude: 0 }} temp={22} dewpoint={8} />`,
    node: (
      <StationGlyph
        station="STN"
        cloud={0}
        wind={{ direction: 0, magnitude: 0 }}
        temp={22}
        dewpoint={8}
        summary={false}
        size={34}
      />
    ),
  },
  {
    label: "overcast + gale",
    code: `<StationGlyph station="KJFK" cloud={1} wind={{ direction: 300, magnitude: 45 }} temp={4} dewpoint={2} pressure={988} />`,
    node: (
      <StationGlyph
        station="KJFK"
        cloud={1}
        wind={{ direction: 300, magnitude: 45 }}
        temp={4}
        dewpoint={2}
        pressure={988}
        summary={false}
        size={34}
      />
    ),
  },
];

const CTX_ROWS = [
  {
    name: "KSFO",
    meta: "16°C",
    obs: {
      cloud: 0.75,
      wind: { direction: 225, magnitude: 15 },
      temp: 16,
      dewpoint: 9,
      pressure: 1013,
    },
  },
  {
    name: "KJFK",
    meta: "22°C",
    obs: {
      cloud: 0.4,
      wind: { direction: 180, magnitude: 18 },
      temp: 22,
      dewpoint: 14,
      pressure: 1018,
    },
  },
  {
    name: "KORD",
    meta: "8°C",
    obs: {
      cloud: 1,
      wind: { direction: 270, magnitude: 24 },
      temp: 8,
      dewpoint: 2,
      pressure: 1002,
    },
  },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        KSFO conditions{" "}
        <span className="mc-inline">
          <StationGlyph {...OBS} size={20} summary={false} />
        </span>{" "}
        — overcast, SW 15 kt, 16°C.
      </p>
    ),
    code: '<p>\n  KSFO conditions <StationGlyph station="KSFO" cloud={0.75} wind={{ direction: 225, magnitude: 15 }} /> — overcast, SW 15 kt, 16°C.\n</p>',
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {CTX_ROWS.map((row) => (
            <tr key={row.name}>
              <td className="py-1.5 pr-3 font-mono text-fd-muted-foreground text-xs">{row.name}</td>
              <td className="py-1.5">
                <StationGlyph station={row.name} {...row.obs} size={22} summary={false} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{row.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: '<td>\n  <StationGlyph station="KSFO" cloud={0.75} wind={{ direction: 225, magnitude: 15 }} />\n</td>',
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">KSFO</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">16°C</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">· 1013 hPa</span>
          </div>
        </div>
        <StationGlyph {...OBS} size={48} summary={false} />
      </>
    ),
    code: '<div className="kpi">\n  <span className="figure">16°C</span>\n  <span className="unit">· 1013 hPa</span>\n  <StationGlyph station="KSFO" cloud={0.75} wind={{ direction: 225, magnitude: 15 }} />\n</div>',
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
            <StationGlyph station={row.name} {...row.obs} size={18} summary={false} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">\n  KSFO <StationGlyph station="KSFO" cloud={0.75} wind={{ direction: 225, magnitude: 15 }} />\n</button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return <StationGlyph {...OBS} summary={false} size={props.height ?? 30} />;
}

export function markCode(): string {
  return `<StationGlyph station="KSFO" cloud={0.75} wind={{ direction: 225, magnitude: 15 }} />`;
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
