import type { ChartModule, PlaygroundSpec } from "./types";
import { CalibrationStrip } from "@microcharts/react/calibration-strip";
import { CalibrationStrip as CalibrationStripInteractive } from "@microcharts/react/calibration-strip/interactive";
import staticModule, { playground as staticPlayground, BINS } from "./calibration-strip";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <CalibrationStripInteractive
      data={BINS}
      summary={false}
      width={130}
      height={32}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CalibrationStripInteractive
      data={BINS}
      mode={s.mode as "dots" | "bars"}
      minSupport={s.minSupport as number}
      summary={false}
      animate={ui.animate}
      width={300}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CalibrationStrip",
      "  data={reliability}",
      s.mode !== "dots" && `  mode="${s.mode}"`,
      s.minSupport !== 11 && `  minSupport={${s.minSupport}}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: CalibrationStrip,
  ChartLive: CalibrationStripInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
