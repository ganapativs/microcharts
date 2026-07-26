import type { ChartModule, PlaygroundSpec } from "./types";
import { Dumbbell } from "@microcharts/react/dumbbell";
import { Dumbbell as DumbbellInteractive } from "@microcharts/react/dumbbell/interactive";
import staticModule, { playground as staticPlayground, BANDS } from "./dumbbell";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <DumbbellInteractive data={BANDS} summary={false} width={130} height={52} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DumbbellInteractive
      data={BANDS}
      positive={(s.positive as boolean) ? "up" : undefined}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Berlin" : undefined}
      summary={false}
      animate={ui.animate}
      width={240}
      height={96}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Dumbbell",
      "  data={bands}",
      (s.positive as boolean) && '  positive="up"',
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Berlin"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Dumbbell,
  ChartLive: DumbbellInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
