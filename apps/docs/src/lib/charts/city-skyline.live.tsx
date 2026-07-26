import type { ChartModule, PlaygroundSpec } from "./types";
import { CitySkyline } from "@microcharts/react/city-skyline";
import { CitySkyline as CitySkylineInteractive } from "@microcharts/react/city-skyline/interactive";
import staticModule, { playground as staticPlayground, TEAMS } from "./city-skyline";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return <CitySkylineInteractive data={TEAMS} summary={false} height={26} animate={animate} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CitySkylineInteractive
      data={TEAMS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      ground={s.ground as boolean}
      unit="teams"
      animate={ui.animate}
      summary={false}
      bw={16}
      gap={6}
      height={s.labels || s.value ? 52 : 44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CitySkyline",
      "  data={teams}",
      s.labels && "  labels",
      s.value && '  label="value"',
      s.ground === false && "  ground={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: CitySkyline,
  ChartLive: CitySkylineInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
