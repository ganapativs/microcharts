import type { ChartModule, PlaygroundSpec } from "./types";
import { MusicStaff as MusicStaffInteractive } from "@microcharts/react/music-staff/interactive";
import staticModule, { playground as staticPlayground, MELODY } from "./music-staff";

/** Interactive half of the music-staff chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./music-staff`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <MusicStaffInteractive data={MELODY} summary={false} width={80} height={22} animate />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, data, ui) => (
    <MusicStaffInteractive
      data={data}
      mode={s.mode as "ledger" | "staff"}
      label={s.label ? "last" : "none"}
      summary={false}
      animate={ui.animate}
      width={220}
      height={40}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<MusicStaff",
      "  data={weeks}",
      s.mode !== "ledger" && `  mode="${s.mode}"`,
      s.label && '  label="last"',
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
