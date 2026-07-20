import type { ChartModule, PlaygroundSpec } from "./types";
import { TallyMarks as TallyMarksInteractive } from "@microcharts/react/tally-marks/interactive";
import staticModule, { playground as staticPlayground } from "./tally-marks";

/** Interactive half of the tally-marks chart module — the ONLY place that imports
 *  this chart's `…/interactive` ('use client') entry. Kept out of `./tally-marks`
 *  so the server-side registry can reach the static module without turning all
 *  106 interactive twins into eager client references. Reached exclusively
 *  through the lazy maps (`modules.generated`, `preview-live.generated`). */

export function PreviewLive() {
  return <TallyMarksInteractive value={23} summary={false} height={16} />;
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s) => (
    <TallyMarksInteractive
      value={s.value as number}
      total={s.total as number}
      pen={s.pen as "ruled" | "drawn"}
      overflow={s.overflow as "numeral" | "clamp"}
      title="Count"
      summary={false}
      height={28}
    />
  ),
  codeInteractive: (s) =>
    [
      "<TallyMarks",
      `  value={${s.value}}`,
      s.total !== 25 && `  total={${s.total}}`,
      s.pen !== "ruled" && `  pen="${s.pen}"`,
      s.overflow !== "numeral" && `  overflow="${s.overflow}"`,
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
