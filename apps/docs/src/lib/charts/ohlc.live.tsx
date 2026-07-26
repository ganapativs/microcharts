import type { ChartModule, PlaygroundSpec } from "./types";
import { Ohlc } from "@microcharts/react/ohlc";
import { Ohlc as OhlcInteractive } from "@microcharts/react/ohlc/interactive";
import staticModule, { playground as staticPlayground, PERIODS } from "./ohlc";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <OhlcInteractive data={PERIODS} summary={false} width={140} height={24} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <OhlcInteractive
      data={PERIODS}
      mode={s.mode as "candle" | "bars"}
      label={s.label as "last" | "none"}
      maxPeriods={s.maxPeriods as number}
      animate={ui.animate}
      summary={false}
      width={280}
      height={32}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Ohlc",
      "  data={sessions}",
      s.mode !== "candle" && `  mode="${s.mode}"`,
      s.label !== "none" && `  label="${s.label}"`,
      s.maxPeriods !== 20 && `  maxPeriods={${s.maxPeriods}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Ohlc,
  ChartLive: OhlcInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
