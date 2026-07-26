import type { ChartModule, PlaygroundSpec } from "./types";
import { DotPlot } from "@microcharts/react/dot-plot";
import { DotPlot as DotPlotInteractive } from "@microcharts/react/dot-plot/interactive";
import staticModule, { playground as staticPlayground, TEAM } from "./dot-plot";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <DotPlotInteractive data={TEAM} summary={false} width={130} height={70} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DotPlotInteractive
      data={TEAM}
      stem={s.stem as boolean}
      label={(s.values as boolean) ? "value" : "none"}
      highlight={(s.highlight as boolean) ? "Ada" : undefined}
      summary={false}
      animate={ui.animate}
      width={220}
      height={110}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DotPlot",
      "  data={team}",
      (s.stem as boolean) && "  stem",
      (s.values as boolean) && '  label="value"',
      (s.highlight as boolean) && '  highlight="Ada"',
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: DotPlot,
  ChartLive: DotPlotInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
