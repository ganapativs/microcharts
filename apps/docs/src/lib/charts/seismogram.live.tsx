import type { ChartModule, PlaygroundSpec } from "./types";
import { Seismogram } from "@microcharts/react/seismogram";
import { Seismogram as SeismogramInteractive } from "@microcharts/react/seismogram/interactive";
import staticModule, { playground as staticPlayground, BURSTS } from "./seismogram";

/** Interactive half of the seismogram chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./seismogram`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <SeismogramInteractive data={BURSTS} summary={false} width={140} height={28} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <SeismogramInteractive
      data={(s.signed as boolean) ? BURSTS.map((v, i) => (i % 2 === 0 ? v : -v)) : BURSTS}
      mode={s.mode as "intensity" | "barcode"}
      positive={(s.signed as boolean) ? "up" : undefined}
      anomaly={(s.flag as boolean) ? 6 : undefined}
      domain={(s.domain as boolean) ? [0, 20] : undefined}
      animate={ui.animate}
      summary={false}
      width={260}
      height={44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Seismogram",
      "  data={burstsPerMinute}",
      s.mode !== "intensity" && `  mode="${s.mode}"`,
      (s.signed as boolean) && '  positive="up"',
      (s.flag as boolean) && "  anomaly={6}",
      (s.domain as boolean) && "  domain={[0, 20]}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Seismogram,
  ChartLive: SeismogramInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
