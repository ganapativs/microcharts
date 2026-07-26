import type { ChartModule, PlaygroundSpec } from "./types";
import { Constellation } from "@microcharts/react/constellation";
import { Constellation as ConstellationInteractive } from "@microcharts/react/constellation/interactive";
import staticModule, { playground as staticPlayground, INCIDENTS } from "./constellation";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <ConstellationInteractive
      data={INCIDENTS}
      summary={false}
      width={90}
      height={26}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ConstellationInteractive
      data={[
        { x: 0, y: 40, m: 2 },
        { x: 2, y: s.spike as number, m: 7 },
        { x: 5, y: 30, m: 3 },
        { x: 8, y: 65, m: 5 },
      ]}
      connect={s.connect === "on"}
      label={s.label as "none" | "max"}
      animate={ui.animate}
      summary={false}
      width={140}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Constellation",
      "  data={events}",
      s.connect !== "on" && "  connect={false}",
      s.label !== "none" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Constellation,
  ChartLive: ConstellationInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
