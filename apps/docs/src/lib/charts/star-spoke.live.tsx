import type { ChartModule, PlaygroundSpec } from "./types";
import { StarSpoke } from "@microcharts/react/star-spoke";
import { StarSpoke as StarSpokeInteractive } from "@microcharts/react/star-spoke/interactive";
import staticModule, { playground as staticPlayground, PROFILE } from "./star-spoke";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return <StarSpokeInteractive data={PROFILE} summary={false} size={84} animate={animate} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <StarSpokeInteractive
      data={PROFILE}
      dots={s.dots ? "tips" : "none"}
      guides={s.guides as boolean}
      compare={s.compare ? [0.5, 0.5, 0.5, 0.5, 0.5] : undefined}
      labels={s.labels as boolean}
      animate={ui.animate}
      summary={false}
      size={110}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<StarSpoke",
      "  data={metrics}",
      s.dots === true && '  dots="tips"',
      s.guides === false && "  guides={false}",
      s.compare === true && "  compare={baseline}",
      s.labels === true && "  labels",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: StarSpoke,
  ChartLive: StarSpokeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
