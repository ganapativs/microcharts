import type { ChartModule, PlaygroundSpec } from "./types";
import { BubbleRow } from "@microcharts/react/bubble-row";
import { BubbleRow as BubbleRowInteractive } from "@microcharts/react/bubble-row/interactive";
import staticModule, { playground as staticPlayground, REGIONS } from "./bubble-row";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return <BubbleRowInteractive data={REGIONS} summary={false} height={30} animate={animate} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <BubbleRowInteractive
      data={REGIONS}
      align={s.align as "center" | "baseline"}
      label={s.label as "value" | "both" | "none"}
      summary={false}
      animate={ui.animate}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BubbleRow",
      "  data={regions}",
      s.align !== "center" && `  align="${s.align}"`,
      s.label !== "value" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: BubbleRow,
  ChartLive: BubbleRowInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
