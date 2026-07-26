import type { ChartModule, PlaygroundSpec } from "./types";
import { MusicStaff } from "@microcharts/react/music-staff";
import { MusicStaff as MusicStaffInteractive } from "@microcharts/react/music-staff/interactive";
import staticModule, { playground as staticPlayground, MELODY } from "./music-staff";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <MusicStaffInteractive data={MELODY} summary={false} width={80} height={22} animate={animate} />
  );
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
  Chart: MusicStaff,
  ChartLive: MusicStaffInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
