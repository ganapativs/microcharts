import { StationGlyph } from "@microcharts/react/station-glyph";
import { InteractiveDemo } from "./station-glyph.client";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

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
    "A whole weather observation in one character — sky, wind, temperature, dew point, pressure.",
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
  return <StationGlyph {...OBS} summary={false} size={44} />;
}

export const showcase = {
  hint: "sky · wind · temp · dew · pressure",
  Node: () => <StationGlyph {...OBS} title="KSFO observation" size={44} />,
};

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

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return <StationGlyph {...OBS} summary={false} size={props.height ?? 30} />;
}

export function markCode(): string {
  return `<StationGlyph station="KSFO" cloud={0.75} wind={{ direction: 225, magnitude: 15 }} />`;
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
