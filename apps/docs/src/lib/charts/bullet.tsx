import { Bullet } from "@microcharts/react/bullet";
import { Bullet as BulletInteractive } from "@microcharts/react/bullet/interactive";
import { DemoPanel } from "@/components/charts/demo-panel";
import type { ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";

export const entry: ChartEntry = {
  name: "Bullet",
  slug: "bullet",
  status: "stable",
  collection: "core",
  tagline: "A measure against a target and qualitative bands.",
  staticImport: `${PKG}/bullet`,
  interactiveImport: `${PKG}/bullet/interactive`,
  dataShape: "value + target + bands",
  encoding: { channel: "position (measure length vs a target tick)", precision: "high" },
  nodeBudget: "≤ 6",
  bestFor: ["progress to goal", "SLA / budget vs target", "KPI with thresholds"],
  avoidFor: ["trends over time", "distributions"],
  props: [
    { name: "value", type: "number", required: true, description: "The measured value." },
    {
      name: "target",
      type: "number",
      required: false,
      description: "Target tick to compare against.",
    },
    {
      name: "bands",
      type: "number[]",
      required: false,
      description: "Ascending qualitative thresholds.",
    },
    {
      name: "domain",
      type: "[number, number]",
      required: false,
      description: "Explicit [0, max]; auto-fit otherwise.",
    },
    {
      name: "title",
      type: "string",
      required: false,
      description: "Accessible name; joins the auto summary.",
    },
    {
      name: "summary",
      type: "string | false",
      required: false,
      description: "Override or disable the auto summary.",
    },
  ],
  demo: [72],
  example: {
    title: "Quota attainment",
    code: `import { Bullet } from "${PKG}/bullet";\n\n<Bullet value={72} target={80} bands={[50, 90]} title="Quota" />`,
  },
};

export function Preview() {
  return <Bullet value={72} target={80} bands={[50, 90]} width={190} height={22} summary={false} />;
}

export const showcase = {
  hint: "vs target",
  Node: () => (
    <BulletInteractive
      value={72}
      target={80}
      bands={[50, 90]}
      width={168}
      height={26}
      title="Quota attainment"
    />
  ),
};

export function InteractiveDemo() {
  return (
    <DemoPanel hint="Hover or focus to hear the value against its target.">
      <BulletInteractive
        value={72}
        target={80}
        bands={[50, 90]}
        width={320}
        height={30}
        className="w-full max-w-md"
        title="Quota attainment"
      />
    </DemoPanel>
  );
}

export const playground: PlaygroundSpec = {
  knobs: [
    { kind: "range", key: "value", min: 0, max: 100, init: 72 },
    { kind: "range", key: "target", min: 0, max: 100, init: 80 },
    { kind: "toggle", key: "bands", init: true },
  ],
  render: (s) => (
    <Bullet
      value={s.value as number}
      target={s.target as number}
      bands={s.bands ? [50, 90] : undefined}
      width={300}
      height={28}
      className="w-full max-w-md"
      title="Playground"
    />
  ),
  code: (s) =>
    [
      "<Bullet",
      `  value={${s.value}}`,
      `  target={${s.target}}`,
      s.bands && "  bands={[50, 90]}",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "default",
    code: `// data alone → an intrinsic 80×16 box\n<Bullet value={72} target={80} bands={[50, 90]} />`,
    node: <Bullet value={72} target={80} bands={[50, 90]} summary={false} />,
  },
  {
    label: "fixed size",
    code: `// a bullet reads best wide and short\n<Bullet value={72} target={80} bands={[50, 90]} width={240} height={24} />`,
    node: (
      <Bullet value={72} target={80} bands={[50, 90]} width={240} height={24} summary={false} />
    ),
  },
  {
    label: "responsive",
    code: `// fills a table cell or card column, aspect ratio preserved\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <Bullet value={72} target={80} bands={[50, 90]} style={{ width: "100%", height: "auto" }} />\n</div>`,
    fluid: true,
    node: (
      <Bullet
        value={72}
        target={80}
        bands={[50, 90]}
        style={{ width: "100%", height: "auto" }}
        summary={false}
      />
    ),
  },
];

export function Mark({ width, height }: { data: number[]; width?: number; height?: number }) {
  return (
    <Bullet
      value={72}
      target={80}
      bands={[50, 90]}
      width={width ?? 90}
      height={height ?? 16}
      summary={false}
    />
  );
}

export function markCode(width?: number, height?: number): string {
  const size = width && height ? ` width={${width}} height={${height}}` : "";
  return `<Bullet value={72} target={80} bands={[50, 90]}${size} />`;
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
