import type { ChartModule, PlaygroundSpec } from "./types";
import { Horizon } from "@microcharts/react/horizon";
import { Horizon as HorizonInteractive } from "@microcharts/react/horizon/interactive";
import staticModule, { playground as staticPlayground, LOAD } from "./horizon";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <HorizonInteractive data={LOAD} summary={false} width={130} height={16} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <HorizonInteractive
      data={LOAD.map((v, i) => v - 20 + (i % 3))}
      folds={Number(s.folds) as 2 | 3}
      mode={s.mode as "mirror" | "offset"}
      baseline={s.baseline as number}
      animate={ui.animate}
      summary={false}
      width={260}
      height={24}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Horizon",
      "  data={cpuLoad}",
      s.folds !== "2" && `  folds={${s.folds}}`,
      s.mode !== "mirror" && `  mode="${s.mode}"`,
      s.baseline !== 0 && `  baseline={${s.baseline}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Horizon,
  ChartLive: HorizonInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
