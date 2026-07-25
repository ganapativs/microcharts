import type { ChartModule, PlaygroundSpec } from "./types";
import { PolarClock } from "@microcharts/react/polar-clock";
import { PolarClock as PolarClockInteractive } from "@microcharts/react/polar-clock/interactive";
import staticModule, { playground as staticPlayground, DAY } from "./polar-clock";

/** Interactive half of the polar-clock chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./polar-clock`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return <PolarClockInteractive data={DAY} now={14} summary={false} size={40} animate={animate} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <PolarClockInteractive
      data={DAY}
      now={s.now as number}
      mode={s.mode as "length" | "opacity"}
      labels={s.labels === "on"}
      animate={ui.animate}
      summary={false}
      size={120}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<PolarClock",
      "  data={byHour}",
      `  now={${s.now}}`,
      s.mode !== "length" && `  mode="${s.mode}"`,
      s.labels === "off" && "  labels={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: PolarClock,
  ChartLive: PolarClockInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
