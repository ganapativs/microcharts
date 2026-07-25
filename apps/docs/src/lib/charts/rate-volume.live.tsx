import type { ChartModule, PlaygroundSpec } from "./types";
import { RateVolume } from "@microcharts/react/rate-volume";
import { RateVolume as RateVolumeInteractive } from "@microcharts/react/rate-volume/interactive";
import staticModule, { playground as staticPlayground, FRAC, PCT } from "./rate-volume";

/** Interactive half of the rate-volume chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./rate-volume`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <RateVolumeInteractive data={FRAC} format={PCT} summary={false} width={150} height={26} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <RateVolumeInteractive
      data={FRAC}
      format={PCT}
      minVolume={s.minVolume ? 50 : undefined}
      curve={s.curve as "linear" | "step"}
      label={s.label as "last" | "none"}
      animate={ui.animate}
      summary={false}
      width={280}
      height={28}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<RateVolume",
      "  data={periods}",
      s.minVolume && "  minVolume={50}",
      s.curve !== "linear" && `  curve="${s.curve}"`,
      s.label !== "last" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: RateVolume,
  ChartLive: RateVolumeInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
