import type { ChartModule, PlaygroundSpec } from "./types";
import { BumpStrip } from "@microcharts/react/bump-strip";
import { BumpStrip as BumpStripInteractive } from "@microcharts/react/bump-strip/interactive";
import staticModule, { playground as staticPlayground, RANKS } from "./bump-strip";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <BumpStripInteractive data={RANKS} summary={false} width={130} height={20} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <BumpStripInteractive
      data={RANKS}
      label={s.label as "ends" | "last" | "none"}
      dots={s.dots as "changes" | "none"}
      maxRank={(s.maxRank as number) === 5 ? undefined : (s.maxRank as number)}
      animate={ui.animate}
      summary={false}
      width={260}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BumpStrip",
      "  data={weeklyRanks}",
      s.label !== "ends" && `  label="${s.label}"`,
      s.dots !== "changes" && `  dots="${s.dots}"`,
      s.maxRank !== 5 && `  maxRank={${s.maxRank}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: BumpStrip,
  ChartLive: BumpStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
