import type { ChartModule, PlaygroundSpec } from "./types";
import { TallyMarks } from "@microcharts/react/tally-marks";
import { TallyMarks as TallyMarksInteractive } from "@microcharts/react/tally-marks/interactive";
import staticModule, { playground as staticPlayground } from "./tally-marks";

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
  Chart: TallyMarks,
  ChartLive: TallyMarksInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
