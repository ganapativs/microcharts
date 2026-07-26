import type { ChartModule, PlaygroundSpec } from "./types";
import { SpreadBand } from "@microcharts/react/spread-band";
import { SpreadBand as SpreadBandInteractive } from "@microcharts/react/spread-band/interactive";
import staticModule, { playground as staticPlayground, PAIRS, LABELS } from "./spread-band";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <SpreadBandInteractive
      data={PAIRS}
      seriesLabels={LABELS}
      summary={false}
      width={140}
      height={26}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SpreadBandInteractive
      data={PAIRS}
      seriesLabels={LABELS}
      label={s.label as "gap" | "none"}
      positive={s.positive as "up" | "down"}
      animate={ui.animate}
      summary={false}
      width={260}
      height={34}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<SpreadBand",
      "  data={pairs}",
      '  seriesLabels={["Organic", "Paid"]}',
      s.label !== "gap" && `  label="${s.label}"`,
      s.positive !== "up" && `  positive="${s.positive}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: SpreadBand,
  ChartLive: SpreadBandInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
