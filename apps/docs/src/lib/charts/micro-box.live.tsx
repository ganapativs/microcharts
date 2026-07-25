import type { ChartModule, PlaygroundSpec } from "./types";
import { MicroBox } from "@microcharts/react/micro-box";
import { MicroBox as MicroBoxInteractive } from "@microcharts/react/micro-box/interactive";
import staticModule, { playground as staticPlayground, RAW } from "./micro-box";

/** Interactive half of the micro-box chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./micro-box`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <MicroBoxInteractive data={RAW} summary={false} width={130} height={22} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <MicroBoxInteractive
      data={(s.outlier as boolean) ? [...RAW, 400] : RAW}
      whiskers={s.whiskers as "minmax" | "tukey"}
      outliers={s.outliers as boolean}
      animate={ui.animate}
      summary={false}
      width={260}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MicroBox",
      "  data={latencies}",
      s.whiskers !== "minmax" && `  whiskers="${s.whiskers}"`,
      s.whiskers === "tukey" && s.outliers === false && "  outliers={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: MicroBox,
  ChartLive: MicroBoxInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
