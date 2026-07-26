import type { ChartModule, PlaygroundSpec } from "./types";
import { Progress } from "@microcharts/react/progress";
import { Progress as ProgressInteractive } from "@microcharts/react/progress/interactive";
import staticModule, { playground as staticPlayground } from "./progress";

export function PreviewLive({ animate = false }: { animate?: boolean }) {
  return (
    <ProgressInteractive value={0.68} summary={false} width={120} height={20} animate={animate} />
  );
}

export const playground: PlaygroundSpec = {
  ...staticPlayground,
  renderInteractive: (s, _data, ui) => (
    <ProgressInteractive
      value={(s.pct as number) / 100}
      segments={(s.segments as number) >= 2 ? (s.segments as number) : undefined}
      label={s.label as "percent" | "value" | "fraction" | "none"}
      title="Onboarding"
      animate={ui.animate}
      width={200}
      height={26}
    />
  ),
  codeInteractive: (s, _data, ui) =>
    [
      "<Progress",
      `  value={${(s.pct as number) / 100}}`,
      (s.segments as number) >= 2 && `  segments={${s.segments}}`,
      s.label !== "percent" && `  label="${s.label}"`,
      ui.animate && " animate",
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export default {
  ...staticModule,
  Chart: Progress,
  ChartLive: ProgressInteractive,
  PreviewLive,
  playground,
} satisfies ChartModule;
