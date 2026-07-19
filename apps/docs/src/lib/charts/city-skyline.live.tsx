import type { ChartModule, PlaygroundSpec } from "./types";
import { CitySkyline as CitySkylineInteractive } from "@microcharts/react/city-skyline/interactive";
import staticModule, { playground as staticPlayground, TEAMS } from "./city-skyline";

/** Interactive half of the city-skyline chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./city-skyline`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <CitySkylineInteractive data={TEAMS} summary={false} height={26} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <CitySkylineInteractive
      data={TEAMS}
      labels={s.labels as boolean}
      label={s.value ? "value" : "none"}
      ground={s.ground as boolean}
      unit="teams"
      animate={ui.animate}
      summary={false}
      bw={16}
      gap={6}
      height={s.labels || s.value ? 52 : 44}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<CitySkyline",
      "  data={teams}",
      s.labels && "  labels",
      s.value && '  label="value"',
      s.ground === false && "  ground={false}",
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  PreviewLive,
  playground,
} satisfies ChartModule;
