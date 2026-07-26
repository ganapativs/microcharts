import type { ChartModule, PlaygroundSpec } from "./types";
import { BiasStrip } from "@microcharts/react/bias-strip";
import { BiasStrip as BiasStripInteractive } from "@microcharts/react/bias-strip/interactive";
import staticModule, { playground as staticPlayground, PAIRS } from "./bias-strip";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <BiasStripInteractive data={PAIRS} summary={false} width={120} height={64} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <BiasStripInteractive
      data={PAIRS}
      limits={(s.wide as boolean) ? 2.58 : 1.96}
      label={(s.caption as boolean) ? "bias" : "none"}
      r={s.r as number}
      summary={false}
      animate={ui.animate}
      width={220}
      height={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<BiasStrip",
      "  data={pairs}",
      (s.wide as boolean) && "  limits={2.58}",
      !(s.caption as boolean) && '  label="none"',
      s.r !== 1.5 && `  r={${s.r}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: BiasStrip,
  ChartLive: BiasStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
