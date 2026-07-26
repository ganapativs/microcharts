import type { ChartModule, PlaygroundSpec } from "./types";
import { GradeProfile } from "@microcharts/react/grade-profile";
import { GradeProfile as GradeProfileInteractive } from "@microcharts/react/grade-profile/interactive";
import staticModule, { playground as staticPlayground, TRAIL, m } from "./grade-profile";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <GradeProfileInteractive
      data={TRAIL}
      summary={false}
      width={150}
      height={44}
      animate={animate}
    />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <GradeProfileInteractive
      data={TRAIL}
      label={s.label ? "max" : "none"}
      bins={[3, 6, Number(s.hard)]}
      format={m}
      animate={ui.animate}
      summary={false}
      width={280}
      height={48}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<GradeProfile",
      "  data={trail}",
      s.label === false && '  label="none"',
      s.hard !== 10 && `  bins={[3, 6, ${s.hard}]}`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: GradeProfile,
  ChartLive: GradeProfileInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
