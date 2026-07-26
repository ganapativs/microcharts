import type { ChartModule, PlaygroundSpec } from "./types";
import { LikertStrip } from "@microcharts/react/likert-strip";
import { LikertStrip as LikertStripInteractive } from "@microcharts/react/likert-strip/interactive";
import staticModule, { playground as staticPlayground, SURVEY } from "./likert-strip";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <LikertStripInteractive
      data={SURVEY}
      summary={false}
      width={130}
      height={20}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <LikertStripInteractive
      data={SURVEY}
      neutral={s.neutral as "split" | "omit"}
      label={s.label as "ends" | "net" | "none"}
      summary={false}
      animate={ui.animate}
      width={260}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<LikertStrip",
      "  data={responses}",
      s.neutral !== "split" && `  neutral="${s.neutral}"`,
      s.label !== "ends" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: LikertStrip,
  ChartLive: LikertStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
