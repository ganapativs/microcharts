import type { ChartModule, PlaygroundSpec } from "./types";
import { SpiralYear } from "@microcharts/react/spiral-year";
import { SpiralYear as SpiralYearInteractive } from "@microcharts/react/spiral-year/interactive";
import staticModule, { playground as staticPlayground, YEAR } from "./spiral-year";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return <SpiralYearInteractive data={YEAR} summary={false} size={40} animate={animate} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SpiralYearInteractive
      data={YEAR}
      steps={s.steps === "3" ? 3 : 5}
      mark={s.mark as "dot" | "arc"}
      monthTicks={s.monthTicks === "on"}
      animate={ui.animate}
      summary={false}
      size={128}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SpiralYear",
      "  data={byWeek}",
      s.steps !== "5" && `  steps={${s.steps}}`,
      s.mark !== "dot" && `  mark="${s.mark}"`,
      s.monthTicks !== "on" && "  monthTicks={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: SpiralYear,
  ChartLive: SpiralYearInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
