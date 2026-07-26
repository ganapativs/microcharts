import type { ChartModule, PlaygroundSpec } from "./types";
import { DualWindowMeter } from "@microcharts/react/dual-window-meter";
import { DualWindowMeter as DualWindowMeterInteractive } from "@microcharts/react/dual-window-meter/interactive";
import staticModule, { playground as staticPlayground, LOUDNESS } from "./dual-window-meter";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <DualWindowMeterInteractive
      data={LOUDNESS}
      target={-23}
      format={{ maximumFractionDigits: 1 }}
      summary={false}
      width={130}
      height={24}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <DualWindowMeterInteractive
      data={LOUDNESS}
      target={-23}
      windows={[s.fast as number, s.slow as number]}
      band={s.band ? [-25, -21] : undefined}
      summary={false}
      animate={ui.animate}
      width={320}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<DualWindowMeter",
      "  data={samples}",
      "  target={-23}",
      `  windows={[${s.fast}, ${s.slow}]}`,
      s.band === true && "  band={[-25, -21]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: DualWindowMeter,
  ChartLive: DualWindowMeterInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
